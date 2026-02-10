import { cn } from "@/lib/utils";

interface PokerChipProps {
    /** Rendered pixel size (width & height) */
    size?: number;
    /** Show contact shadow beneath chip */
    shadow?: boolean;
    className?: string;
}

/**
 * Casino chip rendered as inline SVG.
 * Direction A — CNC engraved metal, 12 grooves, center=40%.
 * Yale-Blue palette, self-contained colors.
 *
 * Geometry (R=46): rim 1.00R→0.86R, body 0.86R→0.40R,
 * center disc 0.40R, dot 0.06R. Grooves every 30°.
 */
export function PokerChip({ size = 22, shadow = true, className }: PokerChipProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={cn("flex-shrink-0", className)}
            aria-hidden="true"
        >
            <defs>
                {/* Body gradient: subtle blue-graphite depth */}
                <radialGradient id="chip-body" cx="42%" cy="40%">
                    <stop offset="0%" stopColor="#172A38" />
                    <stop offset="100%" stopColor="#12212C" />
                </radialGradient>
                {/* Center disc gradient: cool neutral silver */}
                <radialGradient id="chip-disc" cx="44%" cy="42%">
                    <stop offset="0%" stopColor="#CBD2D8" />
                    <stop offset="100%" stopColor="#BFC6CC" />
                </radialGradient>
            </defs>

            {/* ── Contact shadow ── */}
            {shadow && (
                <ellipse cx="50" cy="96" rx="32" ry="4" fill="rgba(0,0,0,0.35)" />
            )}

            {/* ── Outer rim edge (dark border) ── */}
            <circle cx="50" cy="50" r="46" fill="#0E1820" />

            {/* ── Rim surface (lighter band) ── */}
            <circle cx="50" cy="50" r="44.5" fill="#1C3445" />

            {/* ── Body / engraved zone ── */}
            <circle cx="50" cy="50" r="39.5" fill="url(#chip-body)" />

            {/* ── Machined step: rim → body ── */}
            <circle cx="50" cy="50" r="39.5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />

            {/* ── 12 engraved grooves (0.86R → 0.40R) ── */}
            {Array.from({ length: 12 }, (_, i) => i * 30).map(angle => (
                <line
                    key={angle}
                    x1="50" y1="10.5" x2="50" y2="31.5"
                    stroke="#091520"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.45"
                    transform={`rotate(${angle} 50 50)`}
                />
            ))}

            {/* ── Rim highlight (subtle full circumference) ── */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            {/* ── Center disc ── */}
            <circle cx="50" cy="50" r="18.5" fill="url(#chip-disc)" />

            {/* ── Center disc border ── */}
            <circle cx="50" cy="50" r="18.5" fill="none" stroke="#96A0A8" strokeWidth="0.7" />

            {/* ── Center dot ── */}
            <circle cx="50" cy="50" r="2.8" fill="#12212C" opacity="0.2" />

            {/* ── Top-left key light ── */}
            <circle cx="38" cy="38" r="20" fill="rgba(255,255,255,0.05)" />

            {/* ── Bottom-right ambient shadow ── */}
            <circle cx="62" cy="62" r="18" fill="rgba(0,0,0,0.06)" />
        </svg>
    );
}

interface ChipStackProps {
    /** Number of chips in the stack (1-3) */
    count?: 1 | 2 | 3;
    /** Pixel size of each chip */
    chipSize?: number;
    className?: string;
}

/**
 * A small stack of overlapping chips.
 * Each chip is offset vertically to create depth.
 */
export function ChipStack({ count = 2, chipSize = 22, className }: ChipStackProps) {
    const offset = Math.round(chipSize * 0.18); // vertical overlap

    return (
        <div
            className={cn("relative flex-shrink-0", className)}
            style={{
                width: chipSize,
                height: chipSize + offset * (count - 1),
            }}
        >
            {Array.from({ length: count }, (_, i) => (
                <div
                    key={i}
                    className="absolute left-0"
                    style={{ top: (count - 1 - i) * offset }}
                >
                    <PokerChip
                        size={chipSize}
                        shadow={i === count - 1} // only bottom chip casts shadow
                    />
                </div>
            ))}
        </div>
    );
}
