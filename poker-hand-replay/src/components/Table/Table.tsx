import type { Player, Card as CardType, Action, Street } from "@/types";
import { PlayerSeat } from "./PlayerSeat";
import { CommunityCards } from "./CommunityCards";

interface TableProps {
    players: Player[];
    communityCards: CardType[];
    activePlayerIndex?: number;
    dealerPosition?: string;
    pot?: number;
    actions?: Action[];
    currentStreet?: Street;
}

export function Table({ players, communityCards, activePlayerIndex, dealerPosition, pot = 0, actions = [], currentStreet = 'preflop' }: TableProps) {
    // Calculate seat positions dynamically around an ellipse
    // Player 0 (hero) is always at the bottom center, others distribute clockwise
    const getPositionStyle = (index: number, total: number) => {
        if (total === 0) {
            return { left: '50%', top: '50%', display: 'none' as const };
        }

        // Ellipse radii (percentages from center)
        // Horizontal radius is larger due to the oval table shape
        const radiusX = 42; // horizontal spread
        const radiusY = 38; // vertical spread

        // Start from bottom center (270 degrees in standard math coords, but we use 90 for bottom)
        // Distribute players clockwise
        const startAngle = Math.PI / 2; // 90 degrees = bottom
        const angleStep = (2 * Math.PI) / total;

        // Player 0 at bottom, then clockwise (positive direction since Y increases downward)
        const angle = startAngle + index * angleStep;

        // Calculate position on ellipse (center is at 50%, 50%)
        const left = 50 + radiusX * Math.cos(angle);
        const top = 50 + radiusY * Math.sin(angle);

        return {
            left: `${left}%`,
            top: `${top}%`,
            transform: 'translate(-50%, -50%)'
        };
    };

    // Get last action for each player - prioritize fold (once folded, always show fold)
    const getPlayerLastAction = (position: string) => {
        // Check if player folded at any point
        const foldAction = actions.find(a => a.playerPosition === position && a.type === 'fold');
        if (foldAction) return foldAction;

        // Otherwise return last action on current street
        const playerActions = actions.filter(a => a.playerPosition === position && a.street === currentStreet);
        return playerActions.length > 0 ? playerActions[playerActions.length - 1] : undefined;
    };

    // Calculate current bet for each player on this street (0 if folded)
    const getPlayerCurrentBet = (position: string) => {
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
    };

    return (
        <div className="relative w-full max-w-4xl h-full max-h-[500px] aspect-[1.8/1] mx-auto bg-slate-900 rounded-[60px] sm:rounded-[100px] border-[8px] sm:border-[12px] border-slate-800 shadow-2xl flex items-center justify-center p-6 sm:p-12 ring-1 ring-slate-700/50">
            {/* Felt Texture */}
            <div className="absolute inset-0 rounded-[52px] sm:rounded-[88px] bg-gradient-to-b from-slate-900 to-slate-800/80 pointer-events-none" />

            {/* Community Cards */}
            <div className="relative z-10 mb-4">
                <CommunityCards cards={communityCards} />
                <div className="text-center mt-2 text-poker-pot text-sm tracking-widest font-mono font-bold">
                    POT: {pot} BB
                </div>
            </div>

            {/* Players - Positioned around the table */}
            {players.map((player, idx) => (
                <div
                    key={player.position}
                    className="absolute transition-all duration-300"
                    style={getPositionStyle(idx, players.length) as React.CSSProperties}
                >
                    <PlayerSeat
                        player={player}
                        isDealer={player.position === dealerPosition}
                        isActivePosition={idx === activePlayerIndex}
                        lastAction={getPlayerLastAction(player.position)}
                        currentBet={getPlayerCurrentBet(player.position)}
                    />
                </div>
            ))}

            {/* Bet Chips - Positioned between player seats and pot center */}
            {players.map((player, idx) => {
                const currentBet = getPlayerCurrentBet(player.position);
                if (currentBet <= 0) return null;

                // Get player position (ellipse parameters)
                const radiusX = 42;
                const radiusY = 38;
                const startAngle = Math.PI / 2;
                const angleStep = (2 * Math.PI) / players.length;
                const angle = startAngle + idx * angleStep;

                // Player seat position (percentage)
                const playerLeft = 50 + radiusX * Math.cos(angle);
                const playerTop = 50 + radiusY * Math.sin(angle);

                // Pot center is at 50%, 50%
                // Calculate direction vector from player to pot
                const dx = 50 - playerLeft;
                const dy = 50 - playerTop;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Normalize direction
                const ndx = dx / dist;
                const ndy = dy / dist;

                // Default: offset toward pot
                let offsetDist = 12; // percentage units toward pot
                let chipLeft = playerLeft + ndx * offsetDist;
                let chipTop = playerTop + ndy * offsetDist;

                // Special handling for TOP-CENTER seat only (around 180° / top middle)
                // This is a seat where playerTop is low (near top) AND playerLeft is close to 50%
                const isTopCenterSeat = playerTop < 25 && playerLeft > 40 && playerLeft < 60;

                // Special handling for BOTTOM-CENTER seat (Hero position)
                // This is a seat where playerTop is high (near bottom) AND playerLeft is close to 50%
                const isBottomCenterSeat = playerTop > 75 && playerLeft > 40 && playerLeft < 60;

                if (isTopCenterSeat) {
                    // For top-center seat:
                    // - Keep X aligned with seat center (no lateral offset)
                    // - Place chip directly below the action badge, above the board/pot area
                    chipLeft = playerLeft; // Same X as seat center
                    // Position below the seat/action area but above the pot
                    // Reduced offset to keep chip further from board
                    chipTop = Math.min(playerTop + 18, 36); // Clamp to stay well above board
                } else if (isBottomCenterSeat) {
                    // For bottom-center seat (Hero):
                    // - Keep X aligned with seat center
                    // - Push chip further toward pot (upward)
                    chipLeft = playerLeft; // Same X as seat center
                    chipTop = Math.max(playerTop - 18, 62); // Clamp to stay below board (pot is ~50%)
                }

                return (
                    <div
                        key={`chip-${player.position}`}
                        className="absolute flex items-center gap-1 transition-all duration-300 z-20"
                        style={{
                            left: `${chipLeft}%`,
                            top: `${chipTop}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300 shadow-lg" />
                        <span className="text-xs font-mono font-bold text-amber-400 drop-shadow-md">{currentBet}</span>
                    </div>
                );
            })}
        </div>
    );
}

