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
    // Animation props
    animatingHoleCards?: Record<string, number[]>;  // position -> card indices
    animatingCommunityCards?: number[];             // board card indices
    animationToken?: number;
    playbackSpeed?: number;
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
 * Angle-based seat placement using math convention:
 * - 0° = right (3 o'clock)
 * - 90° = top (12 o'clock)
 * - 180° = left (9 o'clock)
 * - 270° = bottom (6 o'clock, Hero position)
 *
 * Position formula: x = cx + a*cos(θ), y = cy - b*sin(θ)
 *
 * All layouts maintain mirror symmetry around the vertical (90°-270°) axis.
 * Symmetry rule: angle θ mirrors to (180° - θ) mod 360°
 *
 * Order: Clockwise from Hero (270°) for proper poker seating
 */
const SEAT_ANGLES: Record<number, number[]> = {
    // 2-max: Hero bottom, villain top
    2: [270, 90],

    // 3-max: Hero at bottom, opponents at upper corners (symmetric)
    // Clockwise from Hero: 270° → 150° → 30°
    3: [270, 150, 30],

    // 4-max: Cardinal directions
    // Clockwise from Hero: 270° → 180° → 90° → 0°
    4: [270, 180, 90, 0],

    // 5-max: Hero + 4 symmetric positions
    // Clockwise from Hero: 270° → 225° → 135° → 45° → 315°
    5: [270, 225, 135, 45, 315],

    // 6-max: Exact angles [30°, 90°, 150°, 210°, 270°(Hero), 330°]
    // Mirror pairs: (30°, 150°), (210°, 330°), axis: (90°, 270°)
    // Clockwise from Hero: 270° → 210° → 150° → 90° → 30° → 330°
    6: [270, 210, 150, 90, 30, 330],

    // 7-max: Hero + 6 symmetric positions
    // Clockwise from Hero: 270° → 225° → 180° → 135° → 45° → 0° → 315°
    7: [270, 225, 180, 135, 45, 0, 315],

    // 8-max: Evenly spaced 45° apart
    // Clockwise from Hero: 270° → 225° → 180° → 135° → 90° → 45° → 0° → 315°
    8: [270, 225, 180, 135, 90, 45, 0, 315],

    // 9-max (Desktop): Horizontal oval with uniform spacing
    // Clockwise from Hero: 270° → 225° → 165° → 135° → 105° → 75° → 45° → 15° → 315°
    // Mirror pairs: (75°, 105°), (45°, 135°), (15°, 165°), (315°, 225°), axis: 270°
    9: [270, 225, 165, 135, 105, 75, 45, 15, 315],
};

// Mobile 9-max: Portrait oval optimized layout (different angle distribution)
// Clockwise from Hero: 270° → 240° → 205° → 155° → 120° → 60° → 25° → 335° → 300°
// Mirror pairs: (60°, 120°), (25°, 155°), (335°, 205°), (300°, 240°), axis: 270°
const MOBILE_9MAX_ANGLES = [270, 240, 205, 155, 120, 60, 25, 335, 300];

export function Table({
    players,
    communityCards,
    activePlayerIndex,
    dealerPosition,
    pot = 0,
    actions = [],
    currentStreet = 'preflop',
    animatingHoleCards = {},
    animatingCommunityCards = [],
    animationToken = 0,
    playbackSpeed = 1
}: TableProps) {
    const isMobile = useMobileLayout();
    const config = isMobile ? MOBILE_CONFIG : DESKTOP_CONFIG;

    /**
     * Get seat angles for N players using math convention
     * Uses pre-defined symmetric angles for all layouts
     * Fallback: even distribution starting from Hero at 270° (bottom)
     */
    const getSeatAngles = (total: number): number[] => {
        if (total === 0) return [];

        // 9-max: Use mobile-optimized angles for portrait layout
        if (total === 9 && isMobile) {
            return MOBILE_9MAX_ANGLES;
        }

        // Use pre-defined symmetric angles
        if (SEAT_ANGLES[total]) {
            return SEAT_ANGLES[total];
        }

        // Fallback for unexpected player counts: even distribution from 270° (Hero at bottom)
        return Array.from({ length: total }, (_, i) => {
            return (270 + (i * 360) / total) % 360;
        });
    };

    const seatAngles = getSeatAngles(players.length);

    /**
     * Calculate seat position using math convention:
     * x = cx + a*cos(θ), y = cy - b*sin(θ)
     * (minus for y because screen Y-axis is inverted)
     */
    const getPositionStyle = (index: number): React.CSSProperties => {
        if (players.length === 0) {
            return { left: '50%', top: '50%', display: 'none' };
        }

        const angleDeg = seatAngles[index];
        const rad = (angleDeg * Math.PI) / 180;

        // Apply extra outward scaling for mobile 9-max to reduce cramping
        let radiusX = config.seatRadiusX;
        let radiusY = config.seatRadiusY;
        if (isMobile && players.length === 9) {
            radiusX *= 1.06;
            radiusY *= 1.08;
        }

        // Math convention: x = cx + a*cos(θ), y = cy - b*sin(θ)
        const left = 50 + radiusX * Math.cos(rad);
        const top = 50 - radiusY * Math.sin(rad);

        return {
            left: `${left}%`,
            top: `${top}%`,
            transform: 'translate(-50%, -50%)'
        };
    };

    /**
     * Calculate chip position on inner ellipse using math convention
     */
    const getChipPositionStyle = (index: number): React.CSSProperties => {
        const angleDeg = seatAngles[index];
        const rad = (angleDeg * Math.PI) / 180;

        // Apply matching scaling for mobile 9-max chip positions
        let chipRadiusX = config.chipRadiusX;
        let chipRadiusY = config.chipRadiusY;
        if (isMobile && players.length === 9) {
            chipRadiusX *= 1.06;
            chipRadiusY *= 1.08;
        }

        // Chips positioned on inner ellipse at same angle as seat
        // Math convention: x = cx + a*cos(θ), y = cy - b*sin(θ)
        const left = 50 + chipRadiusX * Math.cos(rad);
        const top = 50 - chipRadiusY * Math.sin(rad);

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
                                <CommunityCards
                                    cards={communityCards}
                                    compact={true}
                                    animatingIndices={animatingCommunityCards}
                                    animationToken={animationToken}
                                    playbackSpeed={playbackSpeed}
                                />
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
                            animatingCardIndices={animatingHoleCards[player.position] || []}
                            animationToken={animationToken}
                            playbackSpeed={playbackSpeed}
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
                            <CommunityCards
                                cards={communityCards}
                                animatingIndices={animatingCommunityCards}
                                animationToken={animationToken}
                                playbackSpeed={playbackSpeed}
                            />
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
                        animatingCardIndices={animatingHoleCards[player.position] || []}
                        animationToken={animationToken}
                        playbackSpeed={playbackSpeed}
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
