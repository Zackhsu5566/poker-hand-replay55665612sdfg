import { useState, useEffect, useRef } from "react";
import { Table } from "@/components/Table/Table";
import { ReplayControls } from "./ReplayControls";
import { useReplay } from "@/hooks/useReplay";
import { useEquity } from "@/hooks/useEquity";
import { Button } from "@/components/ui/button";
import { TextExportModal } from "@/components/Export";
import { EquityDisplay } from "@/components/Equity";
import type { HandHistory } from "@/types";

interface ReplayViewProps {
    hand: HandHistory;
    onExit: () => void;
}

export function ReplayView({ hand, onExit }: ReplayViewProps) {
    const {
        isPlaying,
        isComplete,
        currentActionIndex,
        playbackSpeed,
        totalActions,
        snapshot,
        play,
        pause,
        stepForward,
        stepBack,
        setSpeed,
        reset
    } = useReplay({ hand });

    const { equity, potOdds } = useEquity(snapshot);

    const [showEndModal, setShowEndModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const hasShownModalForThisRunRef = useRef(false);

    // Show end modal when replay reaches the end
    useEffect(() => {
        // When we're at the end and not playing, show the modal (once per run)
        if (isComplete && !isPlaying && !showEndModal && !hasShownModalForThisRunRef.current) {
            hasShownModalForThisRunRef.current = true;
            // Small delay so user sees the final state before modal
            const timer = setTimeout(() => {
                setShowEndModal(true);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isComplete, isPlaying, showEndModal]);

    // Reset the flag when going back from the end
    useEffect(() => {
        if (!isComplete) {
            hasShownModalForThisRunRef.current = false;
        }
    }, [isComplete]);

    const handleReplayAgain = () => {
        setShowEndModal(false);
        hasShownModalForThisRunRef.current = false;
        reset();
        // Start playing after a brief moment
        setTimeout(() => play(), 100);
    };

    const handleEditHand = () => {
        setShowEndModal(false);
        onExit();
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 bg-slate-900 border-b border-[rgba(255,255,255,0.10)] px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onExit}
                        className="text-slate-400 hover:text-poker-hero transition-colors flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm">Exit Replay</span>
                    </button>
                </div>
                <div className="text-sm text-slate-500 uppercase tracking-wider">
                    {snapshot.currentStreet}
                </div>
                <div className="w-24" /> {/* Spacer for balance */}
            </div>

            {/* Table Area */}
            <div className="flex-1 flex items-center justify-center p-2 min-h-0 overflow-hidden relative">
                <Table
                    players={snapshot.players}
                    communityCards={snapshot.communityCards}
                    activePlayerIndex={snapshot.activePlayerIndex}
                    pot={snapshot.pot}
                    actions={snapshot.visibleActions}
                    currentStreet={snapshot.currentStreet}
                />

                {/* Equity Display - positioned top right */}
                {equity && (
                    <div className="absolute top-4 right-4">
                        <EquityDisplay equity={equity} potOdds={potOdds} />
                    </div>
                )}
            </div>

            {/* Replay Controls */}
            <div className="flex-shrink-0">
                <ReplayControls
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                currentIndex={currentActionIndex}
                totalActions={totalActions}
                onPlay={play}
                onPause={pause}
                onStepForward={stepForward}
                onStepBack={stepBack}
                onSpeedChange={setSpeed}
                onReset={reset}
            />
            </div>

            {/* End of Hand Modal */}
            {showEndModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-up">
                    <div className="bg-slate-900 border border-[rgba(255,255,255,0.10)] rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-poker-hero to-poker-hero/60 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">Hand Complete</h2>
                            <p className="text-slate-400 text-sm">
                                Final pot: <span className="text-poker-pot font-mono font-bold">{snapshot.pot} BB</span>
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Button
                                onClick={() => {
                                    setShowEndModal(false);
                                    setShowExportModal(true);
                                }}
                                className="w-full bg-poker-bet hover:bg-poker-bet-hover text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" x2="12" y1="2" y2="15" />
                                </svg>
                                Share Hand
                            </Button>

                            <Button
                                onClick={handleReplayAgain}
                                className="w-full bg-poker-hero hover:bg-poker-hero/85 text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                </svg>
                                Replay Again
                            </Button>

                            <Button
                                onClick={handleEditHand}
                                variant="outline"
                                className="w-full"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit Hand
                            </Button>

                            <Button
                                onClick={() => setShowEndModal(false)}
                                variant="ghost"
                                className="w-full text-slate-400"
                            >
                                Continue Viewing
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Text Export Modal */}
            {showExportModal && (
                <TextExportModal
                    hand={hand}
                    onClose={() => setShowExportModal(false)}
                />
            )}
        </div>
    );
}
