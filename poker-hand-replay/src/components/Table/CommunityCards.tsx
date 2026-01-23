import type { Card as CardType } from "@/types";
import { Card } from "@/components/Card/Card";

interface CommunityCardsProps {
    cards: CardType[];
}

export function CommunityCards({ cards }: CommunityCardsProps) {
    // Always render 5 slots placeholder if empty?
    // Prompt says "Choose 3 board cards" etc.
    // We should show what is available.

    // We can show placeholders for missing cards to make it look like a board
    const slots = [0, 1, 2, 3, 4];

    return (
        <div className="flex gap-2 items-center justify-center p-4 bg-slate-950/30 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
            {slots.map((i) => (
                <Card
                    key={i}
                    card={cards[i] || null}
                    hidden={false}
                    className={!cards[i] ? "opacity-20" : ""}
                />
            ))}
        </div>
    );
}
