import { useRef, useEffect, useState, useCallback } from "react";
import type { ReplaySnapshot } from "@/types";

export interface AnimationState {
    animatingHoleCards: Record<string, number[]>;  // position -> [0,1] indices
    animatingCommunityCards: number[];              // newly revealed board indices
    token: number;                                  // increment to force CSS re-trigger
}

interface UseAnimationStateReturn extends AnimationState {
    resetAnimationState: () => void;
}

// Animation duration in ms (should match CSS)
const ANIMATION_DURATION_MS = 500;

/**
 * Tracks which cards are newly visible and should animate.
 * Compares current snapshot to previous snapshot to detect changes.
 */
export function useAnimationState(
    snapshot: ReplaySnapshot,
    currentActionIndex: number
): UseAnimationStateReturn {
    const prevSnapshotRef = useRef<ReplaySnapshot | null>(null);
    const prevActionIndexRef = useRef<number>(-2);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [animationState, setAnimationState] = useState<AnimationState>({
        animatingHoleCards: {},
        animatingCommunityCards: [],
        token: 0
    });

    const [token, setToken] = useState(0);

    // Reset function to clear prev snapshot and allow re-animation
    const resetAnimationState = useCallback(() => {
        prevSnapshotRef.current = null;
        prevActionIndexRef.current = -2;
        setToken(prev => prev + 1);
    }, []);

    useEffect(() => {
        const prevSnapshot = prevSnapshotRef.current;
        const prevActionIndex = prevActionIndexRef.current;

        // Calculate delta to detect jumps
        const delta = currentActionIndex - prevActionIndex;

        // Step backward: no animations, just update refs
        if (delta < 0) {
            prevSnapshotRef.current = snapshot;
            prevActionIndexRef.current = currentActionIndex;
            setAnimationState({
                animatingHoleCards: {},
                animatingCommunityCards: [],
                token
            });
            return;
        }

        // Jump detection: if |delta| > 1, skip animations (snap to state)
        if (Math.abs(delta) > 1 && prevActionIndex !== -2) {
            prevSnapshotRef.current = snapshot;
            prevActionIndexRef.current = currentActionIndex;
            setAnimationState({
                animatingHoleCards: {},
                animatingCommunityCards: [],
                token
            });
            return;
        }

        // Detect newly visible hole cards (per-seat, per-card-index)
        const newHoleCards: Record<string, number[]> = {};
        snapshot.players.forEach(player => {
            const prevPlayer = prevSnapshot?.players.find(p => p.position === player.position);
            const newIndices: number[] = [];

            [0, 1].forEach(idx => {
                const prevCard = prevPlayer?.cards[idx];
                const currCard = player.cards[idx];
                // Card is new if it exists now but didn't before
                if (currCard && !prevCard) {
                    newIndices.push(idx);
                }
            });

            if (newIndices.length > 0) {
                newHoleCards[player.position] = newIndices;
            }
        });

        // Detect newly visible community cards (per-index comparison)
        const newCommunityCards: number[] = [];
        for (let i = 0; i < 5; i++) {
            const prevCard = prevSnapshot?.communityCards[i];
            const currCard = snapshot.communityCards[i];
            // Card is new if it exists now but didn't before
            if (currCard && !prevCard) {
                newCommunityCards.push(i);
            }
        }

        const hasNewAnimations =
            Object.keys(newHoleCards).length > 0 ||
            newCommunityCards.length > 0;

        // Update refs before setting state
        prevSnapshotRef.current = snapshot;
        prevActionIndexRef.current = currentActionIndex;

        if (hasNewAnimations) {
            // Increment token to force CSS re-trigger
            const newToken = token + 1;
            setToken(newToken);

            setAnimationState({
                animatingHoleCards: newHoleCards,
                animatingCommunityCards: newCommunityCards,
                token: newToken
            });

            // Clear previous timeout before starting new one
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Clear animation state after animations complete
            timeoutRef.current = setTimeout(() => {
                setAnimationState(prev => ({
                    animatingHoleCards: {},
                    animatingCommunityCards: [],
                    token: prev.token
                }));
            }, ANIMATION_DURATION_MS);
        } else {
            // No new animations, just update token in state
            setAnimationState(prev => ({
                ...prev,
                token
            }));
        }

        // Cleanup on unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [snapshot, currentActionIndex, token]);

    return {
        ...animationState,
        resetAnimationState
    };
}
