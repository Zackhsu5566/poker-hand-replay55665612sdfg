import { Table } from "@/components/Table/Table";
import { Card as CardComponent } from "@/components/Card/Card";
import type { HandHistory, ReplaySnapshot, Card } from "@/types";

interface ExportFrameProps {
    snapshot: ReplaySnapshot | null;
    hand: HandHistory;
    width: number;
    height: number;
    hideHeroCards: boolean;
    showTitleCard: boolean;
}

export function ExportFrame({ snapshot, hand, width, height, hideHeroCards, showTitleCard }: ExportFrameProps) {
    if (showTitleCard) {
        const hero = hand.players.find(p => p.isHero);
        const heroCards = hero?.cards.filter((c): c is Card => c !== null) || [];

        return (
            <div
                style={{ width, height, backgroundColor: '#0a0a0a' }}
                className="flex flex-col items-center justify-center"
            >
                <h1
                    className="font-bold text-slate-200"
                    style={{ fontSize: Math.floor(height * 0.06) }}
                >
                    Poker Hand Replay
                </h1>
                <p
                    className="text-slate-400 mt-4"
                    style={{ fontSize: Math.floor(height * 0.035) }}
                >
                    {hand.blinds.sb}/{hand.blinds.bb} BB &bull; {hand.players.length}-handed
                </p>
                {hero && (
                    <div className="flex flex-col items-center mt-8">
                        <p
                            className="font-bold text-amber-400 mb-4"
                            style={{ fontSize: Math.floor(height * 0.04) }}
                        >
                            Hero: {hero.position}
                        </p>
                        {heroCards.length === 2 && (
                            <div className="flex gap-3">
                                <CardComponent card={heroCards[0]} size="lg" />
                                <CardComponent card={heroCards[1]} size="lg" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    if (!snapshot) {
        return <div style={{ width, height, backgroundColor: '#0a0a0a' }} />;
    }

    // When hideHeroCards is true, make hero appear as non-hero so cards show face-down
    const players = hideHeroCards
        ? snapshot.players.map(p => p.isHero ? { ...p, isHero: false } : p)
        : snapshot.players;

    // Scale the table to better fill the export frame
    const tableMaxWidth = 896; // max-w-4xl
    const tableMaxHeight = 500; // max-h-[500px]
    const padding = 40;
    const availW = width - padding * 2;
    const availH = height - padding * 2;
    const tableScale = Math.min(availW / tableMaxWidth, availH / tableMaxHeight);

    return (
        <div
            style={{ width, height, backgroundColor: '#0a0a0a' }}
            className="flex items-center justify-center overflow-hidden"
        >
            <div style={{ transform: `scale(${tableScale})`, transformOrigin: 'center center' }}>
                <div style={{ width: tableMaxWidth, height: tableMaxHeight }} className="flex items-center justify-center">
                    <Table
                        players={players}
                        communityCards={snapshot.communityCards}
                        activePlayerIndex={snapshot.activePlayerIndex}
                        pot={snapshot.pot}
                        actions={snapshot.visibleActions}
                        currentStreet={snapshot.currentStreet}
                    />
                </div>
            </div>
        </div>
    );
}
