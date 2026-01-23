import { useState } from "react";
import type { HandHistory, Player, Action, Position, Street, Card, ActionType } from "@/types";
import { getPositions } from "@/utils/positions";

interface SetupConfig {
    sb: number;
    bb: number;
    ante?: number;
    playerCount: number;
    heroPosition: Position;
    heroStack: number;
}

export function useHandHistory() {
    const [hand, setHand] = useState<HandHistory | null>(null);
    const [currentStreet, setCurrentStreet] = useState<Street>('preflop');
    const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
    const [isHandComplete, setIsHandComplete] = useState(false);
    // All-in showdown: all remaining players are all-in, need to run out the board
    const [isAllInShowdown, setIsAllInShowdown] = useState(false);
    // Manual end: user chose to end the hand early, may optionally add board cards
    const [isManualEnd, setIsManualEnd] = useState(false);

    const initHand = (config: SetupConfig) => {
        setIsHandComplete(false);
        setIsAllInShowdown(false);
        setIsManualEnd(false);
        const positions = getPositions(config.playerCount);

        // Rotate positions so heroPosition is at index 0
        const heroIdx = positions.indexOf(config.heroPosition);
        const rotatedPositions = heroIdx !== -1
            ? [...positions.slice(heroIdx), ...positions.slice(0, heroIdx)]
            : positions;

        const players: Player[] = rotatedPositions.map((pos, i) => ({
            position: pos,
            stack: config.heroStack, // All players start with effective stack for simplicity
            cards: [null, null],
            isHero: i === 0,
            isActive: true,
            name: i === 0 ? 'Hero' : `P${i + 1}`
        }));

        // Create initial blind actions
        const blindActions: Action[] = [];

        const sbPlayerIdx = players.findIndex(p => p.position === 'SB');
        const bbPlayerIdx = players.findIndex(p => p.position === 'BB');

        // Deduct blinds from player stacks
        if (sbPlayerIdx !== -1) {
            players[sbPlayerIdx] = {
                ...players[sbPlayerIdx],
                stack: players[sbPlayerIdx].stack - config.sb
            };
            blindActions.push({
                id: crypto.randomUUID(),
                street: 'preflop',
                playerPosition: players[sbPlayerIdx].position,
                type: 'bet', // Post SB - amount is delta (chips added to pot)
                amount: config.sb
            });
        }
        if (bbPlayerIdx !== -1) {
            players[bbPlayerIdx] = {
                ...players[bbPlayerIdx],
                stack: players[bbPlayerIdx].stack - config.bb
            };
            blindActions.push({
                id: crypto.randomUUID(),
                street: 'preflop',
                playerPosition: players[bbPlayerIdx].position,
                type: 'bet', // Post BB - amount is delta (chips added to pot)
                amount: config.bb
            });
        }

        setHand({
            id: crypto.randomUUID(),
            blinds: { sb: config.sb, bb: config.bb, ante: config.ante },
            players, // Now with deducted stacks
            heroPosition: config.heroPosition,
            communityCards: [],
            actions: blindActions, // Start with blinds
            date: new Date().toISOString()
        });

        setCurrentStreet('preflop');
        setActivePlayerIndex(0);

        // Better: Find UTG.
        // If BB is present, next one.
        if (bbPlayerIdx !== -1) {
            setActivePlayerIndex((bbPlayerIdx + 1) % players.length);
        }
    };

    const addAction = (type: ActionType, amount: number = 0) => {
        if (!hand) return;

        const player = hand.players[activePlayerIndex];
        if (!player) return;

        const newAction: Action = {
            id: crypto.randomUUID(),
            street: currentStreet,
            playerPosition: player.position,
            type,
            amount,
        };

        // Calculate updated players for move logic
        const updatedPlayers = hand.players.map((p, idx) => {
            if (idx === activePlayerIndex) {
                if (type === 'fold') {
                    return { ...p, isActive: false };
                }
                // Deduct bet amount from stack
                if (amount > 0) {
                    return { ...p, stack: Math.max(0, p.stack - amount) };
                }
            }
            return p;
        });

        setHand(prev => {
            if (!prev) return null;

            return {
                ...prev,
                players: updatedPlayers,
                actions: [...prev.actions, newAction]
            };
        });

        // Move to next active player (pass updated players so we skip all-in players)
        moveToNextPlayer(newAction, [...(hand?.actions || []), newAction], updatedPlayers);
    };

    const moveToNextPlayer = (_lastAction?: Action, allActions?: Action[], updatedPlayers?: Player[]) => {
        if (!hand || isHandComplete) return;

        const actions = allActions || hand.actions;
        const players = updatedPlayers || hand.players;

        // Check if betting round/hand is complete
        const completion = checkStreetComplete(actions, players);

        if (completion.isHandComplete) {
            setIsHandComplete(true);
            return;
        }

        // Check for all-in showdown (all players all-in, need to run out board)
        if (completion.isAllInShowdown) {
            setIsAllInShowdown(true);
        }

        if (completion.isStreetComplete) {
            // Auto advance to next street
            setTimeout(() => advanceStreet(completion.isAllInShowdown), 500); // Small delay for UX
            return;
        }

        let nextIdx = (activePlayerIndex + 1) % players.length;
        let loopCount = 0;

        // Find next active player who is not folded AND has chips remaining
        while (loopCount < players.length) {
            const player = players[nextIdx];
            // Player must be active (not folded) AND have chips to act
            if (player?.isActive && player.stack > 0) {
                break;
            }
            nextIdx = (nextIdx + 1) % players.length;
            loopCount++;
        }

        setActivePlayerIndex(nextIdx);
    };

    const checkStreetComplete = (allActions: Action[], players?: Player[]): { isStreetComplete: boolean, isHandComplete: boolean, isAllInShowdown: boolean } => {
        if (!hand) return { isStreetComplete: false, isHandComplete: false, isAllInShowdown: false };

        const currentPlayers = players || hand.players;
        const activePlayers = currentPlayers.filter(p => p.isActive);
        if (activePlayers.length <= 1) {
            return { isStreetComplete: true, isHandComplete: true, isAllInShowdown: false }; // Win by fold
        }

        // Check if all active players are all-in (have 0 chips remaining)
        const playersWithChips = activePlayers.filter(p => p.stack > 0);
        const allPlayersAllIn = playersWithChips.length <= 1; // 0 or 1 player has chips (1 can't act alone)

        // Get actions for current street only
        const streetActions = allActions.filter(a => a.street === currentStreet);

        // Track bets per player on this street
        const playerBets = new Map<string, number>();
        const playerHasActed = new Map<string, boolean>();

        // Initialize all active players (only those who CAN act - have chips)
        activePlayers.forEach(p => {
            playerBets.set(p.position, 0);
            // All-in players (stack = 0) are considered to have "acted" already
            playerHasActed.set(p.position, p.stack === 0);
        });

        // Process all actions on this street
        streetActions.forEach(a => {
            // Skip actions from already-folded players
            if (!activePlayers.find(p => p.position === a.playerPosition)) return;

            playerHasActed.set(a.playerPosition, true);

            if (a.type === 'bet' || a.type === 'raise' || a.type === 'call') {
                const current = playerBets.get(a.playerPosition) || 0;
                playerBets.set(a.playerPosition, current + (a.amount || 0));
            } else if (a.type === 'fold') {
                // Remove from tracking
                playerBets.delete(a.playerPosition);
                playerHasActed.delete(a.playerPosition);
            }
        });

        // Check if all remaining players have acted
        const allActed = Array.from(playerHasActed.values()).every(v => v);
        if (!allActed) return { isStreetComplete: false, isHandComplete: false, isAllInShowdown: false };

        // Check if all bets are equal (or players are all-in for less)
        const remainingBets = Array.from(playerBets.values());
        if (remainingBets.length === 0) {
            // Everyone checked/folded? if we are here and active > 1, then everyone checked.
            if (currentStreet === 'river') {
                return { isStreetComplete: true, isHandComplete: true, isAllInShowdown: false };
            }
            return { isStreetComplete: true, isHandComplete: false, isAllInShowdown: allPlayersAllIn };
        }

        const maxBet = Math.max(...remainingBets);

        // For all-in situations, we need to check if betting is "closed"
        // Betting is closed when all players with chips have matched the bet or are all-in
        const bettingClosed = activePlayers.every(p => {
            const playerBet = playerBets.get(p.position) || 0;
            // Player has matched the max bet, OR is all-in (can't bet more)
            return playerBet === maxBet || p.stack === 0;
        });

        if (bettingClosed) {
            // Special check for Preflop Limped Pot: BB must have option
            if (currentStreet === 'preflop' && maxBet === hand.blinds.bb) {
                const bbPlayer = activePlayers.find(p => p.position === 'BB');
                // Only check BB option if BB has chips to act
                if (bbPlayer && bbPlayer.stack > 0) {
                    // Find BB's actions on this street
                    const bbActions = streetActions.filter(a => a.playerPosition === 'BB');
                    // If BB only has the initial blind post (1 action), they haven't acted voluntarily
                    if (bbActions.length <= 1) {
                        return { isStreetComplete: false, isHandComplete: false, isAllInShowdown: false };
                    }
                }
            }

            if (currentStreet === 'river') {
                return { isStreetComplete: true, isHandComplete: true, isAllInShowdown: false };
            }
            return { isStreetComplete: true, isHandComplete: false, isAllInShowdown: allPlayersAllIn };
        }

        return { isStreetComplete: false, isHandComplete: false, isAllInShowdown: false };
    };

    const advanceStreet = (allInShowdown: boolean = false) => {
        const streets: Street[] = ['preflop', 'flop', 'turn', 'river'];
        const currentIdx = streets.indexOf(currentStreet);
        if (currentIdx < streets.length - 1) {
            setCurrentStreet(streets[currentIdx + 1]);
            setActivePlayerIndex(0); // Reset to first active player
            // Maintain all-in showdown state across streets
            if (allInShowdown) {
                setIsAllInShowdown(true);
            }
        }
    };

    const setHeroCards = (cards: [Card, Card]) => {
        setHand(prev => {
            if (!prev) return null;
            const updatedPlayers = prev.players.map(p =>
                p.isHero ? { ...p, cards } : p
            );
            return { ...prev, players: updatedPlayers };
        });
    };

    const setCommunityCards = (cards: Card[]) => {
        setHand(prev => {
            if (!prev) return null;
            return { ...prev, communityCards: cards };
        });
    };

    // Helper to get current street betting state (NLH rules)
    const getStreetState = () => {
        if (!hand) return {
            maxBet: 0,
            heroBet: 0,
            canCheck: true,
            toCall: 0,
            minRaise: 0,
            pot: 0,
            activePlayerStack: 0
        };

        // Calculate total pot from all actions
        const pot = hand.actions.reduce((sum, a) => {
            if (a.type === 'bet' || a.type === 'raise' || a.type === 'call') {
                return sum + a.amount;
            }
            return sum;
        }, 0);

        const currentStreetActions = hand.actions.filter(a => a.street === currentStreet);

        // Track how much each player has put in THIS STREET
        const playerStreetBets = new Map<string, number>();
        hand.players.forEach(p => playerStreetBets.set(p.position, 0));

        // Track last raise amount for min-raise calculation
        let lastRaiseAmount = hand.blinds.bb; // Default min raise is BB

        // Process actions
        currentStreetActions.forEach(a => {
            if (a.type === 'bet' || a.type === 'raise' || a.type === 'call') {
                const prevBet = playerStreetBets.get(a.playerPosition) || 0;
                const newTotal = prevBet + a.amount;

                // Calculate raise amount for min-raise logic
                const currentMax = Math.max(...Array.from(playerStreetBets.values()));
                if (a.type === 'raise' || (a.type === 'bet' && currentMax > 0)) {
                    const raiseBy = newTotal - currentMax;
                    if (raiseBy > lastRaiseAmount) {
                        lastRaiseAmount = raiseBy;
                    }
                } else if (a.type === 'bet') {
                    lastRaiseAmount = a.amount; // First bet sets the raise amount
                }

                playerStreetBets.set(a.playerPosition, newTotal);
            }
        });

        // Calculate Max Bet
        let maxBet = 0;
        if (currentStreet === 'preflop') {
            maxBet = hand.blinds.bb;
        }
        playerStreetBets.forEach(amount => {
            if (amount > maxBet) maxBet = amount;
        });

        const activePlayer = hand.players[activePlayerIndex];
        if (!activePlayer) return {
            maxBet,
            heroBet: 0,
            canCheck: true,
            toCall: 0,
            minRaise: hand.blinds.bb,
            pot,
            activePlayerStack: 0
        };

        const heroBet = playerStreetBets.get(activePlayer.position) || 0;
        const toCall = maxBet - heroBet;
        const canCheck = toCall === 0;

        // NLH Min Raise: Must raise by at least the last raise amount
        // Min raise TO = maxBet + lastRaiseAmount
        const minRaiseTo = maxBet + lastRaiseAmount;
        const minRaise = minRaiseTo - heroBet; // Amount needed to make min raise

        return {
            maxBet,
            heroBet,
            canCheck,
            toCall,
            minRaise: Math.max(minRaise, hand.blinds.bb), // At least 1 BB
            pot,
            activePlayerStack: activePlayer.stack
        };
    };

    // End hand manually - user can optionally add remaining board cards
    const endHandManually = () => {
        setIsManualEnd(true);
        // Don't set isHandComplete yet - allow user to add board cards first
    };

    // Finish manual end (transition to replay)
    const finishManualEnd = () => {
        setIsHandComplete(true);
    };

    return {
        hand,
        currentStreet,
        activePlayerIndex,
        isHandComplete,
        isAllInShowdown,
        isManualEnd,
        initHand,
        addAction,
        advanceStreet,
        setHeroCards,
        setCommunityCards,
        getStreetState,
        setIsHandComplete,
        endHandManually,
        finishManualEnd,
        setCurrentStreet // Expose for manual board card selection
    };
}
