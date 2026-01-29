import { useState } from "react";
import type { Card, Rank, Suite } from "@/types";
import { Button } from "@/components/ui/button";

interface CardPickerProps {
    onSelect: (card: Card) => void;
    onCancel: () => void;
    excludedCards?: Card[];
}

const RANKS: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS: Suite[] = ['♠', '♥', '♦', '♣'];

export function CardPicker({ onSelect, onCancel: _onCancel, excludedCards = [] }: CardPickerProps) {
    const [selectedRank, setSelectedRank] = useState<Rank | null>(null);

    const isCardExcluded = (rank: Rank, suit: Suite): boolean => {
        return excludedCards.some(c => c.rank === rank && c.suit === suit);
    };

    const isRankFullyExcluded = (rank: Rank): boolean => {
        return SUITS.every(suit => isCardExcluded(rank, suit));
    };

    const handleRankClick = (rank: Rank) => {
        setSelectedRank(rank);
    };

    const handleSuitClick = (suit: Suite) => {
        if (selectedRank) {
            onSelect({ rank: selectedRank, suit });
            setSelectedRank(null); // Reset to rank selection for next card
        }
    };

    return (
        <div className="bg-slate-900 p-3 xs:p-4 rounded-lg border border-[rgba(255,255,255,0.10)] shadow-2xl max-w-sm w-full">
            <div className="text-slate-200 font-bold mb-2">Select Card</div>
            {!selectedRank ? (
                <div className="grid grid-cols-4 gap-1.5 xs:gap-2">
                    {RANKS.map(rank => {
                        const fullyExcluded = isRankFullyExcluded(rank);
                        return (
                            <Button
                                key={rank}
                                variant="outline"
                                className={`h-11 xs:h-12 text-lg font-mono ${fullyExcluded ? 'opacity-30' : ''}`}
                                onClick={() => handleRankClick(rank)}
                                disabled={fullyExcluded}
                            >
                                {rank}
                            </Button>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <div className="text-4xl font-bold text-white border-2 border-slate-600 w-16 h-24 flex items-center justify-center rounded">
                            {selectedRank}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 xs:gap-2">
                        {SUITS.map(suit => {
                            const excluded = isCardExcluded(selectedRank, suit);
                            return (
                                <Button
                                    key={suit}
                                    variant="outline"
                                    className={`h-12 xs:h-14 text-3xl ${suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-slate-200'} ${excluded ? 'opacity-30' : ''}`}
                                    onClick={() => handleSuitClick(suit)}
                                    disabled={excluded}
                                >
                                    {suit}
                                </Button>
                            );
                        })}
                    </div>
                    <Button variant="ghost" onClick={() => setSelectedRank(null)} className="w-full">
                        Back to Ranks
                    </Button>
                </div>
            )}
        </div>
    );
}
