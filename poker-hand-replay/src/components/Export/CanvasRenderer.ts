import type { Card, Player, Action, Street, ReplaySnapshot, HandHistory } from "@/types";

// Colors matching the app's design
const COLORS = {
    background: '#0a0a0a',
    feltGreen: '#1a2e1a',
    feltGreenLight: '#243a24',
    border: '#334155', // slate-700
    borderLight: '#475569', // slate-600
    text: '#e2e8f0', // slate-200
    textMuted: '#94a3b8', // slate-400
    pot: '#fbbf24', // amber-400
    cardWhite: '#f1f5f9', // slate-100
    cardRed: '#dc2626',
    cardBlack: '#0f172a', // slate-950
    actionFold: { bg: 'rgba(127, 29, 29, 0.5)', text: '#f87171' }, // red
    actionCheck: { bg: '#334155', text: '#cbd5e1' }, // slate
    actionBet: { bg: 'rgba(6, 78, 59, 0.5)', text: '#34d399' }, // emerald
    activeGlow: 'rgba(6, 182, 212, 0.5)', // cyan
    dealerButton: '#ffffff',
    chipGold: '#f59e0b',
    chipGoldLight: '#fbbf24',
};

interface RenderOptions {
    width: number;
    height: number;
    showTitleCard?: boolean;
    titleText?: string;
}

// Main render function
export function renderFrame(
    ctx: CanvasRenderingContext2D,
    snapshot: ReplaySnapshot,
    hand: HandHistory,
    options: RenderOptions
): void {
    const { width, height } = options;

    // Clear and draw background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // Calculate table dimensions (maintain 1.8:1 aspect ratio)
    const tableAspect = 1.8;
    const padding = Math.min(width, height) * 0.08;
    let tableWidth: number, tableHeight: number;

    if (width / height > tableAspect) {
        // Width is wider, constrain by height
        tableHeight = height - padding * 2;
        tableWidth = tableHeight * tableAspect;
    } else {
        // Height is taller, constrain by width
        tableWidth = width - padding * 2;
        tableHeight = tableWidth / tableAspect;
    }

    const tableX = (width - tableWidth) / 2;
    const tableY = (height - tableHeight) / 2;

    // Draw felt
    drawFelt(ctx, tableX, tableY, tableWidth, tableHeight);

    // Draw community cards
    const centerX = tableX + tableWidth / 2;
    const centerY = tableY + tableHeight / 2;
    drawCommunityCards(ctx, snapshot.communityCards, centerX, centerY - tableHeight * 0.05);

    // Draw pot
    drawPot(ctx, snapshot.pot, centerX, centerY + tableHeight * 0.12);

    // Draw players around the table
    const players = snapshot.players;
    const total = players.length;

    for (let i = 0; i < total; i++) {
        const player = players[i];
        const pos = getPlayerPosition(i, total, tableX, tableY, tableWidth, tableHeight);

        // Find dealer position from hand
        const isDealer = hand.players[i]?.position === hand.heroPosition &&
            hand.players.find(p => p.position === 'BTN')?.position === player.position;

        // Get last action for this player
        const lastAction = getLastActionForPlayer(player.position, snapshot.visibleActions, snapshot.currentStreet);

        // Calculate current bet on this street
        const currentBet = getCurrentBet(player.position, snapshot.visibleActions, snapshot.currentStreet);

        drawPlayerSeat(
            ctx,
            player,
            pos.x,
            pos.y,
            i === snapshot.activePlayerIndex,
            isDealer,
            lastAction,
            currentBet,
            tableWidth
        );

        // Draw bet chip if player has bet on current street
        if (currentBet > 0 && player.isActive) {
            const chipPos = getBetChipPosition(pos.x, pos.y, centerX, centerY, tableWidth, tableHeight, i, total);
            drawBetChip(ctx, currentBet, chipPos.x, chipPos.y);
        }
    }
}

// Render title card
export function renderTitleCard(
    ctx: CanvasRenderingContext2D,
    hand: HandHistory,
    options: RenderOptions
): void {
    const { width, height } = options;

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // Find hero
    const hero = hand.players.find(p => p.isHero);
    const heroCards = hero?.cards.filter(c => c !== null) as Card[] || [];

    // Title
    ctx.fillStyle = COLORS.text;
    ctx.font = `bold ${Math.floor(height * 0.06)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Poker Hand Replay', width / 2, height * 0.25);

    // Blinds info
    ctx.font = `${Math.floor(height * 0.035)}px sans-serif`;
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText(`${hand.blinds.sb}/${hand.blinds.bb} BB  •  ${hand.players.length}-handed`, width / 2, height * 0.35);

    // Hero position and cards
    if (hero) {
        ctx.fillStyle = COLORS.pot;
        ctx.font = `bold ${Math.floor(height * 0.04)}px sans-serif`;
        ctx.fillText(`Hero: ${hero.position}`, width / 2, height * 0.5);

        // Draw hero cards
        if (heroCards.length === 2) {
            const cardWidth = Math.floor(width * 0.08);
            const cardHeight = Math.floor(cardWidth * 1.4);
            const cardGap = cardWidth * 0.3;
            const startX = width / 2 - cardWidth - cardGap / 2;
            const cardY = height * 0.58;

            drawCard(ctx, heroCards[0], startX, cardY, cardWidth, cardHeight, false);
            drawCard(ctx, heroCards[1], startX + cardWidth + cardGap, cardY, cardWidth, cardHeight, false);
        }
    }
}

function drawFelt(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
): void {
    // Outer border (rail)
    ctx.fillStyle = COLORS.border;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, width / 2 + 6, height / 2 + 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Felt gradient
    const gradient = ctx.createRadialGradient(
        x + width / 2, y + height / 2, 0,
        x + width / 2, y + height / 2, Math.max(width, height) / 2
    );
    gradient.addColorStop(0, COLORS.feltGreenLight);
    gradient.addColorStop(1, COLORS.feltGreen);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner ring
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, width / 2 - 4, height / 2 - 4, 0, 0, Math.PI * 2);
    ctx.stroke();
}

function drawCard(
    ctx: CanvasRenderingContext2D,
    card: Card | null,
    x: number,
    y: number,
    width: number,
    height: number,
    faceDown: boolean = false
): void {
    const radius = Math.min(width, height) * 0.1;

    if (faceDown) {
        // Card back
        ctx.fillStyle = '#312e81'; // indigo-900
        roundRect(ctx, x, y, width, height, radius);
        ctx.fill();

        ctx.strokeStyle = '#a5b4fc'; // indigo-200
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, width, height, radius);
        ctx.stroke();

        // Pattern circle
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width * 0.25, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    if (!card) {
        // Empty slot
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        roundRect(ctx, x, y, width, height, radius);
        ctx.stroke();
        ctx.setLineDash([]);
        return;
    }

    // Card face
    ctx.fillStyle = COLORS.cardWhite;
    roundRect(ctx, x, y, width, height, radius);
    ctx.fill();

    const isRed = card.suit === '♥' || card.suit === '♦';
    ctx.fillStyle = isRed ? COLORS.cardRed : COLORS.cardBlack;

    // Top left rank and suit
    ctx.font = `bold ${Math.floor(width * 0.35)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(card.rank, x + width * 0.25, y + height * 0.08);
    ctx.font = `${Math.floor(width * 0.3)}px sans-serif`;
    ctx.fillText(card.suit, x + width * 0.25, y + height * 0.32);

    // Center suit (large, faded)
    ctx.globalAlpha = 0.15;
    ctx.font = `${Math.floor(width * 0.7)}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(card.suit, x + width / 2, y + height / 2);
    ctx.globalAlpha = 1;

    // Bottom right (rotated)
    ctx.save();
    ctx.translate(x + width * 0.75, y + height * 0.68);
    ctx.rotate(Math.PI);
    ctx.font = `bold ${Math.floor(width * 0.35)}px monospace`;
    ctx.textBaseline = 'top';
    ctx.fillText(card.rank, 0, 0);
    ctx.font = `${Math.floor(width * 0.3)}px sans-serif`;
    ctx.fillText(card.suit, 0, height * 0.24);
    ctx.restore();
}

function drawCommunityCards(
    ctx: CanvasRenderingContext2D,
    cards: Card[],
    centerX: number,
    centerY: number
): void {
    const cardWidth = 48;
    const cardHeight = 66;
    const gap = 8;
    const totalWidth = cardWidth * 5 + gap * 4;
    const startX = centerX - totalWidth / 2;

    for (let i = 0; i < 5; i++) {
        const card = cards[i] || null;
        drawCard(ctx, card, startX + i * (cardWidth + gap), centerY - cardHeight / 2, cardWidth, cardHeight, false);
    }
}

function drawPot(
    ctx: CanvasRenderingContext2D,
    amount: number,
    x: number,
    y: number
): void {
    ctx.fillStyle = COLORS.pot;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`POT: ${amount} BB`, x, y);
}

function drawPlayerSeat(
    ctx: CanvasRenderingContext2D,
    player: Player,
    x: number,
    y: number,
    isActive: boolean,
    isDealer: boolean,
    lastAction: Action | null,
    _currentBet: number,
    _tableWidth: number
): void {
    const boxWidth = 100;
    const boxHeight = 40;
    const cardWidth = 32;
    const cardHeight = 44;
    const cardOverlap = 16;

    // Apply opacity if folded
    if (!player.isActive) {
        ctx.globalAlpha = 0.5;
    }

    // Draw cards above the box
    const cardsY = y - cardHeight - 4;
    const cardsStartX = x - cardWidth + cardOverlap / 2;

    if (player.isHero && player.cards[0] && player.cards[1]) {
        // Show hero cards face up
        drawCard(ctx, player.cards[0], cardsStartX, cardsY, cardWidth, cardHeight, false);
        drawCard(ctx, player.cards[1], cardsStartX + cardWidth - cardOverlap, cardsY, cardWidth, cardHeight, false);
    } else if (!player.isHero) {
        // Show opponent cards face down
        drawCard(ctx, null, cardsStartX, cardsY, cardWidth, cardHeight, true);
        drawCard(ctx, null, cardsStartX + cardWidth - cardOverlap, cardsY, cardWidth, cardHeight, true);
    }

    // Player info box
    const boxX = x - boxWidth / 2;
    const boxY = y - boxHeight / 2;

    // Glow effect if active
    if (isActive && player.isActive) {
        ctx.shadowColor = COLORS.activeGlow;
        ctx.shadowBlur = 15;
    }

    // Box background
    ctx.fillStyle = '#0f172a'; // slate-900
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 8);
    ctx.fill();

    // Box border
    ctx.strokeStyle = isActive && player.isActive ? '#06b6d4' : COLORS.border;
    ctx.lineWidth = 1;
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 8);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Dealer button
    if (isDealer) {
        const btnSize = 20;
        const btnX = boxX + boxWidth - 6;
        const btnY = boxY - 6;

        ctx.fillStyle = COLORS.dealerButton;
        ctx.beginPath();
        ctx.arc(btnX, btnY, btnSize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = COLORS.cardBlack;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('D', btnX, btnY);
    }

    // Position name
    ctx.fillStyle = COLORS.text;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.name || player.position, x, y - 8);

    // Stack size
    ctx.fillStyle = COLORS.pot;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${player.stack} BB`, x, y + 8);

    // Reset alpha
    ctx.globalAlpha = 1;

    // Action label below box
    if (lastAction) {
        const labelY = y + boxHeight / 2 + 12;
        drawActionBadge(ctx, lastAction, x, labelY);
    }
}

function drawActionBadge(
    ctx: CanvasRenderingContext2D,
    action: Action,
    x: number,
    y: number
): void {
    let colors: { bg: string; text: string };
    let label: string;

    switch (action.type) {
        case 'fold':
            colors = COLORS.actionFold;
            label = 'FOLD';
            break;
        case 'check':
            colors = COLORS.actionCheck;
            label = 'CHECK';
            break;
        case 'call':
            colors = COLORS.actionBet;
            label = `CALL ${action.amount}`;
            break;
        case 'bet':
            colors = COLORS.actionBet;
            label = `BET ${action.amount}`;
            break;
        case 'raise':
            colors = COLORS.actionBet;
            label = `RAISE ${action.amount}`;
            break;
        case 'all-in':
            colors = { bg: 'rgba(126, 34, 206, 0.5)', text: '#c084fc' }; // purple
            label = `ALL-IN ${action.amount}`;
            break;
        default:
            return;
    }

    ctx.font = 'bold 10px sans-serif';
    const textWidth = ctx.measureText(label).width;
    const padding = 8;
    const badgeWidth = textWidth + padding * 2;
    const badgeHeight = 16;

    // Badge background
    ctx.fillStyle = colors.bg;
    roundRect(ctx, x - badgeWidth / 2, y - badgeHeight / 2, badgeWidth, badgeHeight, 4);
    ctx.fill();

    // Badge text
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
}

function drawBetChip(
    ctx: CanvasRenderingContext2D,
    amount: number,
    x: number,
    y: number
): void {
    const chipSize = 20;

    // Chip gradient
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, chipSize / 2);
    gradient.addColorStop(0, COLORS.chipGoldLight);
    gradient.addColorStop(1, COLORS.chipGold);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, chipSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fcd34d'; // amber-300
    ctx.lineWidth = 2;
    ctx.stroke();

    // Amount text
    ctx.fillStyle = COLORS.chipGold;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(amount), x + chipSize / 2 + 4, y);
}

// Helper to get player position on the ellipse
function getPlayerPosition(
    index: number,
    total: number,
    tableX: number,
    tableY: number,
    tableWidth: number,
    tableHeight: number
): { x: number; y: number } {
    const radiusX = tableWidth * 0.42;
    const radiusY = tableHeight * 0.38;
    const centerX = tableX + tableWidth / 2;
    const centerY = tableY + tableHeight / 2;

    // Start from bottom center, go clockwise
    const startAngle = Math.PI / 2;
    const angleStep = (2 * Math.PI) / total;
    const angle = startAngle + index * angleStep;

    return {
        x: centerX + radiusX * Math.cos(angle),
        y: centerY + radiusY * Math.sin(angle)
    };
}

// Helper to get bet chip position
function getBetChipPosition(
    playerX: number,
    playerY: number,
    potX: number,
    potY: number,
    tableWidth: number,
    tableHeight: number,
    _playerIndex: number,
    _totalPlayers: number
): { x: number; y: number } {
    // Direction toward pot center
    const dx = potX - playerX;
    const dy = potY - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const ndx = dx / dist;
    const ndy = dy / dist;

    // Default offset toward pot
    let offsetDist = tableWidth * 0.12;

    // Calculate position
    let chipX = playerX + ndx * offsetDist;
    let chipY = playerY + ndy * offsetDist;

    // Special handling for top and bottom center positions
    const tableCenterX = potX;
    const isTopCenter = playerY < potY - tableHeight * 0.25 && Math.abs(playerX - tableCenterX) < tableWidth * 0.1;
    const isBottomCenter = playerY > potY + tableHeight * 0.25 && Math.abs(playerX - tableCenterX) < tableWidth * 0.1;

    if (isTopCenter) {
        chipX = playerX;
        chipY = Math.min(playerY + tableHeight * 0.18, potY - tableHeight * 0.14);
    } else if (isBottomCenter) {
        chipX = playerX;
        chipY = Math.max(playerY - tableHeight * 0.18, potY + tableHeight * 0.12);
    }

    return { x: chipX, y: chipY };
}

// Helper to draw rounded rectangle
function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Helper to get last action for a player
function getLastActionForPlayer(
    position: string,
    actions: Action[],
    currentStreet: Street
): Action | null {
    // Check if player folded at any point
    const foldAction = actions.find(a => a.playerPosition === position && a.type === 'fold');
    if (foldAction) return foldAction;

    // Otherwise return last action on current street
    const playerActions = actions.filter(a => a.playerPosition === position && a.street === currentStreet);
    return playerActions.length > 0 ? playerActions[playerActions.length - 1] : null;
}

// Helper to get current bet for a player on this street
function getCurrentBet(
    position: string,
    actions: Action[],
    currentStreet: Street
): number {
    // If player folded, don't show bet
    const hasFolded = actions.some(a => a.playerPosition === position && a.type === 'fold');
    if (hasFolded) return 0;

    return actions
        .filter(a => a.playerPosition === position && a.street === currentStreet)
        .reduce((sum, a) => {
            if (a.type === 'bet' || a.type === 'raise' || a.type === 'call') {
                return sum + (a.amount || 0);
            }
            return sum;
        }, 0);
}
