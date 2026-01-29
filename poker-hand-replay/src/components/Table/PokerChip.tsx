import { cn } from "@/lib/utils";

interface PokerChipProps {
    /** Rendered pixel size (width & height) */
    size?: number;
    /** Show contact shadow beneath chip */
    shadow?: boolean;
    className?: string;
}

/**
 * Realistic casino chip rendered as inline SVG.
 * Smooth rounded edge, matte clay/composite body,
 * off-white printed inlay, top-left key light, subtle rim light.
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
            {/* ── Contact shadow ── */}
            {shadow && (
                <ellipse
                    cx="50" cy="96" rx="34" ry="4"
                    fill="rgba(0,0,0,0.30)"
                />
            )}

            {/* ── Chip body (dark charcoal clay) ── */}
            <circle cx="50" cy="50" r="46" fill="#2A2F36" />

            {/* ── Smooth edge band (lighter ring for depth) ── */}
            <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(169,177,188,0.13)" strokeWidth="6" />

            {/* ── Thin outer edge highlight (light catching the rim) ── */}
            <circle cx="50" cy="50" r="45.5" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />

            {/* ── Mid-gray groove ring ── */}
            <circle cx="50" cy="50" r="36" fill="none" stroke="#606873" strokeWidth="1.2" />

            {/* ── Inlay background (off-white printed disc) ── */}
            <circle cx="50" cy="50" r="28" fill="#E6EAF0" />

            {/* ── Inlay inner ring (printed border) ── */}
            <circle cx="50" cy="50" r="24" fill="none" stroke="#B8BFC9" strokeWidth="0.8" />

            {/* ── Inlay centre dot (denomination marker) ── */}
            <circle cx="50" cy="50" r="4" fill="#1A1F26" opacity="0.18" />

            {/* ── Subtle wear marks ── */}
            <line x1="35" y1="38" x2="42" y2="40" stroke="rgba(0,0,0,0.04)" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="58" y1="56" x2="64" y2="58" stroke="rgba(0,0,0,0.03)" strokeWidth="0.5" strokeLinecap="round" />

            {/* ── Top-left key light ── */}
            <circle cx="36" cy="36" r="24" fill="rgba(255,255,255,0.07)" />

            {/* ── Bottom-right ambient shadow ── */}
            <circle cx="62" cy="62" r="22" fill="rgba(0,0,0,0.06)" />

            {/* ── Rim light (very soft, bottom-right arc) ── */}
            <path
                d="M 80 65 A 46 46 0 0 0 65 80"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
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
