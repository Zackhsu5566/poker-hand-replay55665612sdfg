import type { Player, Card as CardType, Action, Street } from "@/types";
import { PlayerSeat } from "./PlayerSeat";
import { CommunityCards } from "./CommunityCards";
import { PokerChip, ChipStack } from "./PokerChip";
import { useMobileLayout } from "@/hooks/useMobileLayout";

interface TableProps {
    players: Player[];
    communityCards: CardType[];
    activePlayerIndex?: number;
    dealerPosition?: string;
    pot?: number;
    actions?: Action[];
    currentStreet?: Street;
}

// Layout configuration constants
const DESKTOP_CONFIG = {
    // Ellipse radii for player seats (% from center)
    seatRadiusX: 48,
    seatRadiusY: 42,
    // Inner ellipse for chips (proportional to seat radius)
    chipRadiusX: 32,
    chipRadiusY: 28,
};

const MOBILE_CONFIG = {
    // Portrait ellipse - balanced radii for uniform rim spacing
    seatRadiusX: 42,
    seatRadiusY: 42,
    // Inner ellipse for chips - 65% of seat radius for consistent ring
    chipRadiusX: 27,
    chipRadiusY: 27,
};

/**
 * Pre-defined symmetric seat angles for each player count (mobile layout)
 * Angles in CSS degrees: 0=right, 90=bottom, 180=left, 270=top
 * Hero is always at 90° (bottom center)
 * All layouts are PERFECTLY left-right symmetric around the 90°-270° vertical axis
 *
 * Symmetry rule: For every angle θ, its mirror is (180° - θ) mod 360°
 * Angles on the axis (90°, 270°) are self-symmetric
 *
 * Order: Clockwise from Hero for proper poker seating
 */
const MOBILE_SEAT_ANGLES: Record<number, number[]> = {
    2: [90, 270],                                    // Hero bottom, villain top
    3: [90, 210, 330],                               // Clockwise: Hero → upper-left → upper-right
    4: [90, 180, 270, 0],                            // Clockwise: Hero → left → top → right
    5: [90, 150, 210, 330, 30],                      // Clockwise: Hero → left side → right side
    6: [90, 150, 210, 270, 330, 30],                 // Clockwise: Hero → left → top → right
    7: [90, 140, 200, 250, 290, 340, 40],            // Clockwise around table
    8: [90, 135, 180, 225, 270, 315, 0, 45],         // Clockwise: 8 positions evenly spaced
    9: [90, 120, 150, 210, 240, 300, 330, 30, 60],   // Clockwise: 9-max full ring
};

export function Table({ players, communityCards, activePlayerIndex, dealerPosition, pot = 0, actions = [], currentStreet = 'preflop' }: TableProps) {
    const isMobile = useMobileLayout();
    const config = isMobile ? MOBILE_CONFIG : DESKTOP_CONFIG;

    /**
     * Get seat angles for N players
     * Mobile: uses pre-defined symmetric angles
     * Desktop: even distribution around ellipse
     */
    const getSeatAngles = (total: number): number[] => {
        if (total === 0) return [];

        // For desktop, use simple even distribution
        if (!isMobile) {
            // Even distribution starting from bottom (90°)
            return Array.from({ length: total }, (_, i) => {
                return (90 + (i * 360) / total) % 360;
            });
        }

        // MOBILE: Use pre-defined symmetric angles
        if (MOBILE_SEAT_ANGLES[total]) {
            return MOBILE_SEAT_ANGLES[total];
        }

        // Fallback for unexpected player counts: even distribution
        return Array.from({ length: total }, (_, i) => {
            return (90 + (i * 360) / total) % 360;
        });
    };

    const seatAngles = getSeatAngles(players.length);

    const getPositionStyle = (index: number): React.CSSProperties => {
        if (players.length === 0) {
            return { left: '50%', top: '50%', display: 'none' };
        }

        const angleDeg = seatAngles[index];
        const rad = (angleDeg * Math.PI) / 180;

        const left = 50 + config.seatRadiusX * Math.cos(rad);
        const top = 50 + config.seatRadiusY * Math.sin(rad);

        return {
            left: `${left}%`,
            top: `${top}%`,
            transform: 'translate(-50%, -50%)'
        };
    };

    const getChipPositionStyle = (index: number): React.CSSProperties => {
        const angleDeg = seatAngles[index];
        const rad = (angleDeg * Math.PI) / 180;

        // Chips positioned on inner ellipse at same angle as seat
        const left = 50 + config.chipRadiusX * Math.cos(rad);
        const top = 50 + config.chipRadiusY * Math.sin(rad);

        return {
            position: 'absolute',
            left: `${left}%`,
            top: `${top}%`,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '3px',
            transform: 'translate(-50%, -50%)'
        };
    };

    // Get last action for each player
    const getPlayerLastAction = (position: string) => {
        const foldAction = actions.find(a => a.playerPosition === position && a.type === 'fold');
        if (foldAction) return foldAction;
        const playerActions = actions.filter(a => a.playerPosition === position && a.street === currentStreet);
        return playerActions.length > 0 ? playerActions[playerActions.length - 1] : undefined;
    };

    const getPlayerCurrentBet = (position: string) => {
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

    // Mobile layout: portrait composition
    if (isMobile) {
        return (
            <div className="relative w-full aspect-[3/4] max-w-[400px] mx-auto flex items-center justify-center">
                {/* Table Structure - Portrait Ellipse */}
                <div className="absolute inset-[4%] rounded-[50%] bg-gradient-to-b from-[#1B2333] to-[#0F131B] shadow-[0_18px_60px_rgba(0,0,0,0.65)] p-3 ring-1 ring-white/5">
                    {/* Felt */}
                    <div className="relative w-full h-full rounded-[50%] bg-[#0F131B] overflow-hidden shadow-[inset_0_0_0_1px_rgba(43,212,182,0.12)]">
                        {/* Felt Gradient */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1A2232] to-[#0F131B] opacity-80" />

                        {/* Center Cluster: Community Cards + Pot */}
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="flex flex-col items-center gap-2 -mt-4">
                                <CommunityCards cards={communityCards} compact={true} />
                                <div className="flex items-center justify-center gap-1.5">
                                    <ChipStack count={pot >= 20 ? 3 : pot >= 5 ? 2 : 1} chipSize={16} />
                                    <span className="text-[#C9A86A] text-xs tracking-widest font-mono font-bold" style={{ textShadow: '0 1px 8px rgba(201,168,106,0.3)' }}>
                                        {pot} BB
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Players - Positioned around portrait ellipse */}
                {players.map((player, idx) => (
                    <div
                        key={player.position}
                        className="absolute transition-all duration-300 z-20"
                        style={getPositionStyle(idx)}
                    >
                        <PlayerSeat
                            player={player}
                            isDealer={player.position === dealerPosition}
                            isActivePosition={idx === activePlayerIndex}
                            lastAction={getPlayerLastAction(player.position)}
                            currentBet={getPlayerCurrentBet(player.position)}
                            compact={true}
                        />
                    </div>
                ))}

                {/* Bet Chips - Inner ellipse ring */}
                {players.map((player, idx) => {
                    const currentBet = getPlayerCurrentBet(player.position);
                    if (currentBet <= 0) return null;

                    return (
                        <div
                            key={`chip-${player.position}`}
                            className="absolute flex items-center gap-1 transition-all duration-300 z-30"
                            style={getChipPositionStyle(idx)}
                        >
                            <PokerChip size={18} shadow={false} />
                            <span className="text-[10px] font-mono font-bold text-[#C9A86A] drop-shadow-md">{currentBet}</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Desktop layout: wide composition
    return (
        <div className="relative w-full max-w-5xl aspect-[2/1] mx-auto flex items-center justify-center">
            {/* Table Structure */}
            <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-[#1B2333] to-[#0F131B] shadow-[0_18px_60px_rgba(0,0,0,0.65)] p-4 sm:p-5 ring-1 ring-white/5">
                {/* Felt */}
                <div className="relative w-full h-full rounded-[50%] bg-[#0F131B] overflow-hidden shadow-[inset_0_0_0_1px_rgba(43,212,182,0.12)]">
                    {/* Felt Gradient */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1A2232] to-[#0F131B] opacity-80" />

                    {/* Community Cards & Pot Center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative z-10 flex flex-col items-center gap-4 pt-4">
                            <CommunityCards cards={communityCards} />
                            <div className="flex items-center justify-center gap-2">
                                <ChipStack count={pot >= 20 ? 3 : pot >= 5 ? 2 : 1} chipSize={20} />
                                <span className="text-[#C9A86A] text-sm tracking-widest font-mono font-bold" style={{ textShadow: '0 1px 8px rgba(201,168,106,0.3)' }}>
                                    {pot} BB
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Players - Positioned absolutely relative to the main container */}
            {players.map((player, idx) => (
                <div
                    key={player.position}
                    className="absolute transition-all duration-300 z-20"
                    style={getPositionStyle(idx)}
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

            {/* Bet Chips */}
            {players.map((player, idx) => {
                const currentBet = getPlayerCurrentBet(player.position);
                if (currentBet <= 0) return null;

                return (
                    <div
                        key={`chip-${player.position}`}
                        className="absolute flex items-center gap-1 transition-all duration-300 z-30"
                        style={getChipPositionStyle(idx)}
                    >
                        <PokerChip size={22} shadow={false} />
                        <span className="text-xs font-mono font-bold text-[#C9A86A] drop-shadow-md">{currentBet}</span>
                    </div>
                );
            })}
        </div>
    );
}
