import { Button } from "@/components/ui/button";
import type { PlaybackSpeed } from "@/types";

interface ReplayControlsProps {
    isPlaying: boolean;
    playbackSpeed: PlaybackSpeed;
    currentIndex: number;
    totalActions: number;
    onPlay: () => void;
    onPause: () => void;
    onStepForward: () => void;
    onStepBack: () => void;
    onSpeedChange: (speed: PlaybackSpeed) => void;
    onReset: () => void;
}

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.5, 2];

export function ReplayControls({
    isPlaying,
    playbackSpeed,
    currentIndex,
    totalActions,
    onPlay,
    onPause,
    onStepForward,
    onStepBack,
    onSpeedChange,
    onReset
}: ReplayControlsProps) {
    const progress = totalActions > 0 ? ((currentIndex + 1) / totalActions) * 100 : 0;
    const atStart = currentIndex <= -1;
    const atEnd = currentIndex >= totalActions - 1;

    return (
        <div className="bg-slate-900 border-t border-[rgba(255,255,255,0.10)] p-3 pb-safe space-y-2">
            {/* Progress Bar */}
            <div className="relative h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 bg-poker-hero transition-all duration-300"
                    style={{ width: `${Math.max(0, progress)}%` }}
                />
            </div>

            {/* Action Counter */}
            <div className="text-center text-sm text-slate-400">
                {currentIndex < 0 ? (
                    <span>Ready to replay</span>
                ) : (
                    <span>Action {currentIndex + 1} of {totalActions}</span>
                )}
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-2">
                {/* Reset */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    disabled={atStart}
                    className="text-slate-400 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                    </svg>
                </Button>

                {/* Step Back */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onStepBack}
                    disabled={atStart}
                    className="text-slate-400 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="19 20 9 12 19 4 19 20" />
                        <line x1="5" y1="19" x2="5" y2="5" />
                    </svg>
                </Button>

                {/* Play/Pause */}
                <Button
                    variant="default"
                    size="icon"
                    onClick={isPlaying ? onPause : onPlay}
                    className="w-14 h-14 rounded-full bg-poker-hero hover:bg-poker-hero/85"
                >
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                    )}
                </Button>

                {/* Step Forward */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onStepForward}
                    disabled={atEnd}
                    className="text-slate-400 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 4 15 12 5 20 5 4" />
                        <line x1="19" y1="5" x2="19" y2="19" />
                    </svg>
                </Button>

                {/* Spacer - hidden on very small screens */}
                <div className="hidden xs:block w-4 sm:w-8" />

                {/* Speed Controls */}
                <div className="flex items-center gap-0.5 xs:gap-1 bg-slate-800 rounded-lg p-0.5 xs:p-1">
                    {SPEEDS.map(speed => (
                        <Button
                            key={speed}
                            variant="ghost"
                            size="sm"
                            onClick={() => onSpeedChange(speed)}
                            className={`px-1.5 xs:px-2 py-1 min-h-[36px] text-xs font-mono ${playbackSpeed === speed
                                    ? 'bg-poker-hero text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {speed}x
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
