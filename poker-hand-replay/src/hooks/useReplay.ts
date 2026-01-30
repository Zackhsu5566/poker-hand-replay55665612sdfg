import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { HandHistory, Player, Action, Street, PlaybackSpeed, ReplaySnapshot } from "@/types";

interface UseReplayOptions {
    hand: HandHistory | null;
    onComplete?: () => void;
}

interface UseReplayReturn {
    // State
    isPlaying: boolean;
    isComplete: boolean;
    currentActionIndex: number;
    playbackSpeed: PlaybackSpeed;
    totalActions: number;

    // Computed snapshot
    snapshot: ReplaySnapshot;

    // Controls
    play: () => void;
    pause: () => void;
    togglePlayPause: () => void;
    stepForward: () => void;
    stepBack: () => void;
    jumpTo: (index: number) => void;
    setSpeed: (speed: PlaybackSpeed) => void;
    reset: () => void;
}

const STREET_CARD_COUNT: Record<Street, number> = {
    preflop: 0,
    flop: 3,
    turn: 4,
    river: 5
};

const BASE_DELAY_MS = 1500;
const STREET_REVEAL_DELAY_MS = 700; // Delay for card reveal animation
const STREET_ABSORB_DELAY_MS = 800; // Pause after reveal before showing first action of new street

export function useReplay({ hand, onComplete }: UseReplayOptions): UseReplayReturn {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentActionIndex, setCurrentActionIndex] = useState(-1);
    const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
    // When set, reveals this street's cards before advancing to the next action
    const [revealingStreet, setRevealingStreet] = useState<Street | null>(null);
    // Ref to track the current reveal timer for proper cleanup
    const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Identify blind actions (forced bets at the start of preflop)
    const blindActions = useMemo(() => {
        if (!hand) return [];
        const blindPositions = ['SB', 'BB'];
        const blinds: Action[] = [];

        for (const action of hand.actions) {
            if (action.street !== 'preflop') break;
            if (blindPositions.includes(action.playerPosition) && action.type === 'bet') {
                blinds.push(action);
                if (blinds.length >= 2) break; // Found both blinds
            }
        }

        return blinds;
    }, [hand?.actions]);

    // Number of blind actions to always include
    const blindCount = blindActions.length;

    // Voluntary actions start after blinds
    const voluntaryActions = useMemo(() => {
        if (!hand) return [];
        return hand.actions.slice(blindCount);
    }, [hand?.actions, blindCount]);

    const totalVoluntaryActions = voluntaryActions.length;
    const isComplete = currentActionIndex >= totalVoluntaryActions - 1 && totalVoluntaryActions > 0;

    // Initial stacks
    const initialStacks = useMemo(() => {
        if (!hand) return new Map<string, number>();
        const stacks = new Map<string, number>();

        hand.players.forEach(player => {
            let stack = player.stack;

            const totalBetByPlayer = hand.actions
                .filter(a => a.playerPosition === player.position)
                .reduce((sum, a) => {
                    if (a.type === 'bet' || a.type === 'raise' || a.type === 'call' || a.type === 'all-in') {
                        return sum + a.amount;
                    }
                    return sum;
                }, 0);

            stack += totalBetByPlayer;
            stacks.set(player.position, stack);
        });

        return stacks;
    }, [hand]);

    // Compute the snapshot
    const snapshot = useMemo((): ReplaySnapshot => {
        if (!hand) return {
            players: [],
            communityCards: [],
            pot: 0,
            currentStreet: 'preflop',
            activePlayerIndex: -1,
            visibleActions: [],
            lastAction: null
        };

        // Always include blind actions, plus voluntary actions up to current index
        const visibleVoluntaryActions = currentActionIndex >= 0
            ? voluntaryActions.slice(0, currentActionIndex + 1)
            : [];

        // All visible actions = blinds + visible voluntary actions
        const visibleActions = [...blindActions, ...visibleVoluntaryActions];

        const lastAction = visibleActions.length > 0
            ? visibleActions[visibleActions.length - 1]
            : null;

        // Determine current street from last voluntary action (or preflop if none)
        const lastVoluntaryAction = visibleVoluntaryActions.length > 0
            ? visibleVoluntaryActions[visibleVoluntaryActions.length - 1]
            : null;
        let currentStreet: Street = lastVoluntaryAction?.street || 'preflop';

        // Determine community cards based on street
        // For all-in showdowns or manual end where action ends early but board may run out,
        // show all community cards when we're at the end of the replay
        const isAtEnd = currentActionIndex >= totalVoluntaryActions - 1;
        const boardCardCount = hand.communityCards.length;

        let cardCount: number;
        if (isAtEnd && boardCardCount > STREET_CARD_COUNT[currentStreet]) {
            // Show all available board cards at end of replay (e.g., all-in preflop, manual end)
            cardCount = boardCardCount;
            // Update street to reflect the board state
            if (boardCardCount >= 5) currentStreet = 'river';
            else if (boardCardCount >= 4) currentStreet = 'turn';
            else if (boardCardCount >= 3) currentStreet = 'flop';
        } else if (revealingStreet) {
            // During street reveal phase, show the new street's cards
            // but keep currentStreet as the previous street (for action display)
            cardCount = STREET_CARD_COUNT[revealingStreet];
        } else {
            cardCount = STREET_CARD_COUNT[currentStreet];
        }
        const communityCards = hand.communityCards.slice(0, cardCount);

        // Calculate pot from all visible actions (including blinds)
        const pot = visibleActions.reduce((sum, a) => {
            if (a.type === 'bet' || a.type === 'raise' || a.type === 'call' || a.type === 'all-in') {
                return sum + a.amount;
            }
            return sum;
        }, 0);

        // Compute player states
        const players: Player[] = hand.players.map(player => {
            // Check if player has folded in visible actions
            const hasFolded = visibleActions.some(
                a => a.playerPosition === player.position && a.type === 'fold'
            );

            // Calculate how much this player has bet so far (in visible actions, including blinds)
            const betSoFar = visibleActions
                .filter(a => a.playerPosition === player.position)
                .reduce((sum, a) => {
                    if (a.type === 'bet' || a.type === 'raise' || a.type === 'call' || a.type === 'all-in') {
                        return sum + a.amount;
                    }
                    return sum;
                }, 0);

            // Get initial stack (before blinds) and subtract bets made so far
            const startingStack = initialStacks.get(player.position) || 100;
            const currentStack = startingStack - betSoFar;

            return {
                ...player,
                isActive: !hasFolded,
                stack: currentStack
            };
        });

        // Find active player (who made the last voluntary action, or -1 if only blinds shown)
        let activePlayerIndex = -1;
        if (lastVoluntaryAction) {
            activePlayerIndex = players.findIndex(p => p.position === lastVoluntaryAction.playerPosition);
        }

        return {
            players,
            communityCards,
            pot,
            currentStreet,
            activePlayerIndex,
            visibleActions,
            lastAction
        };
    }, [hand, currentActionIndex, initialStacks, blindActions, voluntaryActions, totalVoluntaryActions, revealingStreet]);

    // Effect 1: Handle street reveal timing with two phases:
    // Phase 1: Card animation (STREET_REVEAL_DELAY_MS)
    // Phase 2: Absorption pause before showing action (STREET_ABSORB_DELAY_MS)
    useEffect(() => {
        if (!revealingStreet || !isPlaying) return;

        // Phase 1: Wait for card flip animation
        const revealDelay = STREET_REVEAL_DELAY_MS / playbackSpeed;

        revealTimerRef.current = setTimeout(() => {
            // Phase 2: Wait for user to absorb the new board
            const absorbDelay = STREET_ABSORB_DELAY_MS / playbackSpeed;

            revealTimerRef.current = setTimeout(() => {
                setRevealingStreet(null);
                setCurrentActionIndex(prev => prev + 1);
            }, absorbDelay);
        }, revealDelay);

        return () => {
            if (revealTimerRef.current) {
                clearTimeout(revealTimerRef.current);
                revealTimerRef.current = null;
            }
        };
    }, [revealingStreet, isPlaying, playbackSpeed]);

    // Effect 2: Handle normal action advance and detect street transitions
    useEffect(() => {
        // Skip if not playing or currently revealing a street
        if (!isPlaying || revealingStreet) return;

        if (currentActionIndex >= totalVoluntaryActions - 1) {
            setIsPlaying(false);
            onComplete?.();
            return;
        }

        // Get current and next action's streets
        const currentAction = currentActionIndex >= 0 ? voluntaryActions[currentActionIndex] : null;
        const nextAction = voluntaryActions[currentActionIndex + 1];
        const currentStreetFromAction = currentAction?.street || 'preflop';
        const nextStreet = nextAction?.street || 'preflop';

        // Check if we need to reveal a new street first
        const isStreetTransition = nextStreet !== currentStreetFromAction;

        if (isStreetTransition) {
            // Street transition - start reveal phase, Effect 1 will handle the timing
            setRevealingStreet(nextStreet);
            return;
        }

        // Normal action advance (no street transition)
        const delay = BASE_DELAY_MS / playbackSpeed;
        const timer = setTimeout(() => {
            setCurrentActionIndex(prev => prev + 1);
        }, delay);

        return () => clearTimeout(timer);
    }, [isPlaying, currentActionIndex, totalVoluntaryActions, playbackSpeed, onComplete, voluntaryActions, revealingStreet]);

    const play = useCallback(() => {
        if (!hand) return;
        if (currentActionIndex >= totalVoluntaryActions - 1) {
            // If at end, restart
            setCurrentActionIndex(-1);
        }
        setIsPlaying(true);
    }, [currentActionIndex, totalVoluntaryActions, hand]);

    const pause = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const togglePlayPause = useCallback(() => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }, [isPlaying, play, pause]);

    const stepForward = useCallback(() => {
        setIsPlaying(false);
        setCurrentActionIndex(prev => Math.min(prev + 1, totalVoluntaryActions - 1));
    }, [totalVoluntaryActions]);

    const stepBack = useCallback(() => {
        setIsPlaying(false);
        setCurrentActionIndex(prev => Math.max(prev - 1, -1));
    }, []);

    const jumpTo = useCallback((index: number) => {
        setIsPlaying(false);
        setCurrentActionIndex(Math.max(-1, Math.min(index, totalVoluntaryActions - 1)));
    }, [totalVoluntaryActions]);

    const setSpeed = useCallback((speed: PlaybackSpeed) => {
        setPlaybackSpeed(speed);
    }, []);

    const reset = useCallback(() => {
        setIsPlaying(false);
        setCurrentActionIndex(-1);
        setRevealingStreet(null);
    }, []);

    return {
        isPlaying,
        isComplete,
        currentActionIndex,
        playbackSpeed,
        totalActions: totalVoluntaryActions,
        snapshot,
        play,
        pause,
        togglePlayPause,
        stepForward,
        stepBack,
        jumpTo,
        setSpeed,
        reset
    };
}
