import type { HandHistory, Card, Action, Player, Street, Suite } from '@/types';

const SUIT_TO_LETTER: Record<Suite, string> = {
    '♠': 's',
    '♥': 'h',
    '♦': 'd',
    '♣': 'c'
};

const ACTION_VERBS: Record<string, string> = {
    'fold': 'folds',
    'check': 'checks',
    'call': 'calls',
    'bet': 'bets',
    'raise': 'raises to',
    'all-in': 'all-in'
};

const STREET_ORDER: Street[] = ['preflop', 'flop', 'turn', 'river'];

export interface TextExportOptions {
    showDollarAmounts?: boolean;
    dollarPerBB?: number;
    showPotPercentages?: boolean;
}

/**
 * Format a card to short notation (e.g., "As" for Ace of spades)
 */
export function formatCard(card: Card): string {
    return `${card.rank}${SUIT_TO_LETTER[card.suit]}`;
}

/**
 * Format multiple cards to notation (e.g., "As Kh")
 */
export function formatCards(cards: (Card | null)[]): string {
    return cards
        .filter((c): c is Card => c !== null)
        .map(formatCard)
        .join(' ');
}

/**
 * Calculate pot size at a given point in the hand
 */
export function calculatePotAtPoint(actions: Action[], upToIndex: number): number {
    let pot = 0;
    for (let i = 0; i <= upToIndex && i < actions.length; i++) {
        const action = actions[i];
        if (action.type !== 'fold' && action.type !== 'check') {
            pot += action.amount;
        }
    }
    return pot;
}

/**
 * Calculate pot at the start of a street
 */
function calculatePotAtStreetStart(actions: Action[], street: Street): number {
    const streetIndex = STREET_ORDER.indexOf(street);
    if (streetIndex === 0) {
        // Preflop starts with blinds
        return 0;
    }

    // Sum all actions from previous streets
    let pot = 0;
    for (const action of actions) {
        const actionStreetIndex = STREET_ORDER.indexOf(action.street);
        if (actionStreetIndex < streetIndex) {
            if (action.type !== 'fold' && action.type !== 'check') {
                pot += action.amount;
            }
        }
    }
    return pot;
}

/**
 * Get actions for a specific street
 */
function getStreetActions(actions: Action[], street: Street): Action[] {
    return actions.filter(a => a.street === street);
}

/**
 * Calculate initial stacks (before any actions)
 */
function calculateInitialStacks(players: Player[], actions: Action[]): Map<string, number> {
    const stacks = new Map<string, number>();

    for (const player of players) {
        // Current stack + all bets made = initial stack
        let totalBet = 0;
        for (const action of actions) {
            if (action.playerPosition === player.position && action.type !== 'fold' && action.type !== 'check') {
                totalBet += action.amount;
            }
        }
        stacks.set(player.position, player.stack + totalBet);
    }

    return stacks;
}

/**
 * Find the effective stack (smallest stack among active players)
 */
function calculateEffectiveStack(players: Player[], initialStacks: Map<string, number>): number {
    const activeStacks = players
        .filter(p => p.isActive || p.isHero)
        .map(p => initialStacks.get(p.position) || p.stack);

    return Math.min(...activeStacks);
}

/**
 * Determine if we went to showdown (multiple players active at end)
 */
function isShowdown(players: Player[]): boolean {
    const activePlayers = players.filter(p => p.isActive);
    return activePlayers.length > 1;
}

/**
 * Format a single action line
 */
function formatActionLine(
    action: Action,
    potBefore: number,
    options: TextExportOptions
): string {
    const verb = ACTION_VERBS[action.type] || action.type;
    let line = `${action.playerPosition}: ${verb}`;

    if (action.type !== 'fold' && action.type !== 'check' && action.amount > 0) {
        line += ` ${action.amount}bb`;

        if (options.showDollarAmounts && options.dollarPerBB) {
            const dollars = action.amount * options.dollarPerBB;
            line += ` ($${dollars.toFixed(0)})`;
        }

        if (options.showPotPercentages && potBefore > 0 && (action.type === 'bet' || action.type === 'raise')) {
            const potPct = Math.round((action.amount / potBefore) * 100);
            line += ` (${potPct}% pot)`;
        }
    }

    return line;
}

/**
 * Format community cards for a street header
 */
function formatStreetHeader(street: Street, communityCards: Card[]): string {
    const streetUpper = street.toUpperCase();

    if (street === 'preflop') {
        return `=== ${streetUpper} ===`;
    }

    if (street === 'flop' && communityCards.length >= 3) {
        const flopCards = communityCards.slice(0, 3);
        return `=== ${streetUpper} === [${formatCards(flopCards)}]`;
    }

    if (street === 'turn' && communityCards.length >= 4) {
        const flopCards = communityCards.slice(0, 3);
        const turnCard = communityCards[3];
        return `=== ${streetUpper} === [${formatCards(flopCards)}] [${formatCard(turnCard)}]`;
    }

    if (street === 'river' && communityCards.length >= 5) {
        const flopCards = communityCards.slice(0, 3);
        const turnCard = communityCards[3];
        const riverCard = communityCards[4];
        return `=== ${streetUpper} === [${formatCards(flopCards)}] [${formatCard(turnCard)}] [${formatCard(riverCard)}]`;
    }

    return `=== ${streetUpper} ===`;
}

/**
 * Find the winner of the hand
 */
function determineWinner(players: Player[]): string | null {
    // If only one player is active, they won
    const activePlayers = players.filter(p => p.isActive);
    if (activePlayers.length === 1) {
        return activePlayers[0].position;
    }

    // At showdown, we don't have hand evaluation - just note multiple players
    return null;
}

/**
 * Main function to format a hand history into shareable text
 */
export function formatHandHistory(hand: HandHistory, options: TextExportOptions = {}): string {
    const lines: string[] = [];
    const { blinds, players, communityCards, actions, date } = hand;

    // Calculate initial stacks
    const initialStacks = calculateInitialStacks(players, actions);
    const effectiveStack = calculateEffectiveStack(players, initialStacks);

    // Find hero
    const hero = players.find(p => p.isHero);

    // Header
    lines.push('=== POKER HAND ===');

    const stakesStr = options.showDollarAmounts && options.dollarPerBB
        ? `$${blinds.sb * options.dollarPerBB}/$${blinds.bb * options.dollarPerBB}`
        : `${blinds.sb}/${blinds.bb}`;

    let headerLine = `NL Hold'em ${stakesStr}`;
    if (blinds.ante) {
        headerLine += ` (${blinds.ante} ante)`;
    }
    headerLine += ` | ${players.length}-max`;
    lines.push(headerLine);

    // Hand ID and date
    const dateStr = new Date(date).toLocaleString();
    lines.push(`Hand #${hand.id.slice(0, 8)} | ${dateStr}`);
    lines.push('');

    // Player roster
    lines.push('--- PLAYERS ---');
    for (const player of players) {
        const stack = initialStacks.get(player.position) || player.stack;
        let playerLine = `${player.position}: ${stack}bb`;
        if (player.isHero) {
            playerLine += ' [HERO]';
        }
        if (player.name) {
            playerLine = `${player.position} (${player.name}): ${stack}bb`;
            if (player.isHero) {
                playerLine += ' [HERO]';
            }
        }
        lines.push(playerLine);
    }
    lines.push('');
    lines.push(`Effective stack: ${effectiveStack}bb`);
    lines.push('');

    // Hero cards
    if (hero && hero.cards[0] && hero.cards[1]) {
        lines.push('--- HERO CARDS ---');
        lines.push(`[${formatCards(hero.cards)}]`);
        lines.push('');
    }

    // Street-by-street actions
    for (const street of STREET_ORDER) {
        const streetActions = getStreetActions(actions, street);

        // Skip streets with no actions
        if (streetActions.length === 0) {
            continue;
        }

        // Street header
        lines.push(formatStreetHeader(street, communityCards));

        // Pot at start of street
        const potAtStart = calculatePotAtStreetStart(actions, street);
        if (street !== 'preflop') {
            lines.push(`Pot: ${potAtStart}bb`);
        }

        // Actions
        let potForPct = potAtStart;
        for (const action of streetActions) {
            lines.push(formatActionLine(action, potForPct, options));
            if (action.type !== 'fold' && action.type !== 'check') {
                potForPct += action.amount;
            }
        }

        lines.push('');
    }

    // Showdown section (if applicable)
    const showdown = isShowdown(players);
    if (showdown) {
        lines.push('=== SHOWDOWN ===');
        for (const player of players.filter(p => p.isActive)) {
            if (player.cards[0] && player.cards[1]) {
                lines.push(`${player.position}: [${formatCards(player.cards)}]`);
            } else {
                lines.push(`${player.position}: [** **]`);
            }
        }
        lines.push('');
    }

    // Result section
    lines.push('=== RESULT ===');
    const finalPot = calculatePotAtPoint(actions, actions.length - 1);
    lines.push(`Final pot: ${finalPot}bb`);

    const winner = determineWinner(players);
    if (winner) {
        lines.push(`${winner} wins ${finalPot}bb`);
    }

    return lines.join('\n');
}
