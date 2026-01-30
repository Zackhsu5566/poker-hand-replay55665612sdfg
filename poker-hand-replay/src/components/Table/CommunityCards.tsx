import type { Card as CardType } from "@/types";
import { Card } from "@/components/Card/Card";

interface CommunityCardsProps {
    cards: CardType[];
    compact?: boolean;
    // Animation props
    animatingIndices?: number[];  // which card indices [0-4] should animate
    animationToken?: number;      // for CSS re-trigger
    playbackSpeed?: number;       // for scaling delays
}

export function CommunityCards({
    cards,
    compact = false,
    animatingIndices = [],
    animationToken = 0,
    playbackSpeed = 1
}: CommunityCardsProps) {
    const slots = [0, 1, 2, 3, 4];

    return (
        <div className={`flex items-center justify-center bg-[#0D1117] rounded-lg border border-[rgba(43,212,182,0.12)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)] ${
            compact ? "gap-1 px-2 py-1.5" : "gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 xs:py-3"
        }`}>
            {slots.map((i) => {
                const isAnimating = animatingIndices.includes(i);

                // Stagger delay: position within the batch * 100ms, scaled by speed
                // e.g., flop [0,1,2] → delays of 0, 100, 200ms at 1x speed
                let baseDelay = 0;
                if (isAnimating) {
                    const positionInBatch = animatingIndices.indexOf(i);
                    baseDelay = positionInBatch * 100;
                }
                const scaledDelay = baseDelay / playbackSpeed;

                return (
                    <Card
                        key={i}
                        card={cards[i] || null}
                        hidden={false}
                        size={compact ? "sm" : "md"}
                        className={!cards[i] ? "opacity-10" : ""}
                        animationType={isAnimating ? 'flip' : 'none'}
                        animationDelay={scaledDelay}
                        animationToken={animationToken}
                    />
                );
            })}
        </div>
    );
}
