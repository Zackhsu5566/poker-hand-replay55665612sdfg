import type { Position } from "@/types";

export const ORDERED_POSITIONS_6MAX: Position[] = ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'];
export const ORDERED_POSITIONS_9MAX: Position[] = ['SB', 'BB', 'UTG', 'UTG+1', 'MP', 'MP+1', 'HJ', 'CO', 'BTN'];

export function getPositions(count: number): Position[] {
    if (count <= 2) return ['SB', 'BB']; // Heads up

    // For 3-6 players, take from 6-max list (working backwards from BTN)
    // 3: BTN, SB, BB
    // 4: CO, BTN, SB, BB 
    // Wait, standard is usually:
    // 3-handed: BTN, SB, BB
    // 4-handed: CO, BTN, SB, BB
    // 5-handed: MP, CO, BTN, SB, BB
    // 6-handed: UTG, MP, CO, BTN, SB, BB
    // The lists in ORDERED_POSITIONS are strictly seat order (SB, BB, UTG...)

    if (count <= 6) {
        // If we want valid positions for N players, typically we drop early positions.
        // 6-max full: SB, BB, UTG, MP, CO, BTN
        // 5-max: SB, BB, MP, CO, BTN (No UTG)
        // 4-max: SB, BB, CO, BTN
        // 3-max: SB, BB, BTN

        // Let's filter ORDERED_POSITIONS_6MAX based on this logic.
        if (count === 3) return ['SB', 'BB', 'BTN'] // Special case rotation often used or just subsets.
        // Actually, let's just stick to the subset logic:
        // POKER SITES usually drop UTG first, then MP...
        // 6: SB, BB, UTG, MP, CO, BTN
        // 5: SB, BB, MP, CO, BTN
        // 4: SB, BB, CO, BTN
        // 3: SB, BB, BTN

        // Map of count -> positions
        const map: Record<number, Position[]> = {
            3: ['SB', 'BB', 'BTN'],
            4: ['SB', 'BB', 'CO', 'BTN'],
            5: ['SB', 'BB', 'MP', 'CO', 'BTN'],
            6: ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN']
        };
        return map[count] || map[6];
    }

    // 9-max
    // 7: SB, BB, UTG+1, MP, MP+1, HJ, CO, BTN (Drop UTG)
    // 8: SB, BB, UTG, UTG+1, MP, MP+1, HJ, CO, BTN (Drop nothing? wait 9 is full)
    const map9: Record<number, Position[]> = {
        7: ['SB', 'BB', 'MP', 'MP+1', 'HJ', 'CO', 'BTN'], // Simplified
        8: ['SB', 'BB', 'UTG+1', 'MP', 'MP+1', 'HJ', 'CO', 'BTN'],
        9: ['SB', 'BB', 'UTG', 'UTG+1', 'MP', 'MP+1', 'HJ', 'CO', 'BTN']
    };

    // Fallback implementation using slice if map fails (simplified)
    return map9[count] || ORDERED_POSITIONS_9MAX.slice(9 - count);
}

export function rotatePositions(positions: Position[], _heroPos: Position): Position[] {
    // We want to return an array of positions ordered by seat, such that Hero is at a specific visual slot?
    // Or just identifying who is who.
    return positions;
}
