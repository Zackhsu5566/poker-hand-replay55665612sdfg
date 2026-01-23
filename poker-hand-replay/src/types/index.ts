export type Suite = '♠' | '♥' | '♦' | '♣';
export type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type Position = 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'MP' | 'MP+1' | 'HJ' | 'CO';
export type Street = 'preflop' | 'flop' | 'turn' | 'river';
export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';

export interface Card {
    rank: Rank;
    suit: Suite;
}

export interface Player {
    position: Position;
    stack: number; // in Big Blinds or amount
    cards: [Card | null, Card | null];
    name?: string;
    isHero: boolean;
    isActive: boolean; // Not folded
}

export interface Action {
    id: string;
    street: Street;
    playerPosition: Position;
    type: ActionType;
    amount: number; // For bet/raise/call/all-in. 0 for check/fold
    potState?: number; // Pot size after action
}

export interface HandHistory {
    id: string;
    blinds: { sb: number; bb: number; ante?: number };
    players: Player[];
    heroPosition: Position;
    communityCards: Card[];
    actions: Action[];
    date: string;
}

// Replay types
export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

export interface ReplaySnapshot {
    players: Player[];
    communityCards: Card[];
    pot: number;
    currentStreet: Street;
    activePlayerIndex: number;
    visibleActions: Action[];
    lastAction: Action | null;
}

// Video Export types
export type ExportResolution = '1080x1080' | '1920x1080';

export interface ExportOptions {
    resolution: ExportResolution;
    playbackSpeed: PlaybackSpeed;
    includeTitleCard: boolean;
    includeHeroReveal: boolean;
}

export interface ExportProgress {
    status: 'idle' | 'rendering' | 'encoding' | 'complete' | 'error';
    progress: number; // 0-100
    currentFrame: number;
    totalFrames: number;
    message: string;
}

// Equity Calculator types
export interface EquityResult {
    heroEquity: number;      // 0-100 percentage
    tieEquity: number;       // 0-100 percentage
    opponentCount: number;   // Number of active opponents
    simulations: number;     // How many sims were run
}

export interface PotOdds {
    potSize: number;
    toCall: number;
    percentage: number;      // pot odds as %
    breakeven: number;       // equity needed to call profitably
}
