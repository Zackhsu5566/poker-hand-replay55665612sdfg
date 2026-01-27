import { useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { toCanvas } from "html-to-image";
import { Button } from "@/components/ui/button";
import { useVideoExport, getFileExtension } from "@/hooks/useVideoExport";
import { ExportFrame } from "./ExportFrame";
import type { HandHistory, ExportOptions, ExportResolution, PlaybackSpeed, ReplaySnapshot } from "@/types";

interface ExportModalProps {
    hand: HandHistory;
    onClose: () => void;
}

export function ExportModal({ hand, onClose }: ExportModalProps) {
    const { exportVideo, progress, isExporting, downloadUrl, mimeType, reset } = useVideoExport();

    const [options, setOptions] = useState<ExportOptions>({
        resolution: '1080x1080',
        playbackSpeed: 1,
        includeTitleCard: true,
        includeHeroReveal: false
    });

    // Frame capture state
    const containerRef = useRef<HTMLDivElement>(null);
    const [frameState, setFrameState] = useState<{
        snapshot: ReplaySnapshot | null;
        hideHeroCards: boolean;
        showTitleCard: boolean;
    }>({ snapshot: null, hideHeroCards: false, showTitleCard: false });

    const [widthStr, heightStr] = options.resolution.split('x');
    const exportWidth = parseInt(widthStr, 10);
    const exportHeight = parseInt(heightStr, 10);

    // Capture the DOM-rendered frame as a canvas
    const captureFrame = useCallback(async (
        snapshot: ReplaySnapshot | null,
        hideHeroCards: boolean,
        showTitleCard: boolean
    ): Promise<HTMLCanvasElement> => {
        // Synchronously update the rendered frame
        flushSync(() => {
            setFrameState({ snapshot, hideHeroCards, showTitleCard });
        });

        // Wait for browser to paint
        await new Promise<void>(resolve => requestAnimationFrame(() => {
            // Double rAF to ensure paint is complete
            requestAnimationFrame(() => resolve());
        }));

        // Capture the DOM as canvas
        const canvas = await toCanvas(containerRef.current!, {
            width: exportWidth,
            height: exportHeight,
            pixelRatio: 1,
            cacheBust: true,
        });

        return canvas;
    }, [exportWidth, exportHeight]);

    const handleExport = () => {
        exportVideo(hand, options, captureFrame);
    };

    const handleDownload = () => {
        if (!downloadUrl) return;

        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `poker-hand-${hand.id}.${getFileExtension(mimeType)}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const resolutionOptions: { value: ExportResolution; label: string }[] = [
        { value: '1080x1080', label: 'Square (1080\u00d71080)' },
        { value: '1920x1080', label: 'Landscape (1920\u00d71080)' }
    ];

    const speedOptions: { value: PlaybackSpeed; label: string }[] = [
        { value: 0.5, label: '0.5\u00d7' },
        { value: 1, label: '1\u00d7' },
        { value: 1.5, label: '1.5\u00d7' },
        { value: 2, label: '2\u00d7' }
    ];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            {/* Hidden offscreen container for frame capture */}
            <div
                ref={containerRef}
                style={{
                    position: 'fixed',
                    left: '-9999px',
                    top: 0,
                    width: exportWidth,
                    height: exportHeight,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                }}
            >
                <ExportFrame
                    snapshot={frameState.snapshot}
                    hand={hand}
                    width={exportWidth}
                    height={exportHeight}
                    hideHeroCards={frameState.hideHeroCards}
                    showTitleCard={frameState.showTitleCard}
                />
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                            <path d="m22 8-6 4 6 4V8Z" />
                            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                        </svg>
                        Export Video
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-white transition-colors"
                        disabled={isExporting}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {progress.status === 'complete' ? (
                    // Success state
                    <div className="text-center py-4">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Export Complete!</h3>
                        <p className="text-slate-400 text-sm mb-6">Your video is ready to download.</p>

                        <div className="space-y-3">
                            <Button
                                onClick={handleDownload}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" x2="12" y1="15" y2="3" />
                                </svg>
                                Download Video
                            </Button>
                            <Button
                                onClick={handleClose}
                                variant="outline"
                                className="w-full"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                ) : progress.status === 'error' ? (
                    // Error state
                    <div className="text-center py-4">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" x2="9" y1="9" y2="15" />
                                <line x1="9" x2="15" y1="9" y2="15" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Export Failed</h3>
                        <p className="text-slate-400 text-sm mb-6">{progress.message}</p>

                        <div className="space-y-3">
                            <Button
                                onClick={() => reset()}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white"
                            >
                                Try Again
                            </Button>
                            <Button
                                onClick={handleClose}
                                variant="outline"
                                className="w-full"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                ) : isExporting ? (
                    // Progress state
                    <div className="py-4">
                        <div className="text-center mb-4">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin" />
                            <p className="text-slate-300 font-medium">{progress.message}</p>
                            <p className="text-slate-500 text-sm mt-1">
                                Frame {progress.currentFrame} of {progress.totalFrames}
                            </p>
                        </div>

                        {/* Progress bar */}
                        <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-300"
                                style={{ width: `${progress.progress}%` }}
                            />
                        </div>
                        <p className="text-center text-slate-400 text-sm mt-2">{progress.progress}%</p>
                    </div>
                ) : (
                    // Options state
                    <div className="space-y-5">
                        {/* Resolution */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Resolution
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {resolutionOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setOptions(prev => ({ ...prev, resolution: opt.value }))}
                                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${options.resolution === opt.value
                                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                                : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Playback Speed */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Playback Speed
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {speedOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setOptions(prev => ({ ...prev, playbackSpeed: opt.value }))}
                                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${options.playbackSpeed === opt.value
                                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                                : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={options.includeTitleCard}
                                    onChange={(e) => setOptions(prev => ({ ...prev, includeTitleCard: e.target.checked }))}
                                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                                />
                                <span className="text-slate-300 text-sm">Include title card</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={options.includeHeroReveal}
                                    onChange={(e) => setOptions(prev => ({ ...prev, includeHeroReveal: e.target.checked }))}
                                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                                />
                                <div>
                                    <span className="text-slate-300 text-sm">Show hero cards throughout</span>
                                    <p className="text-slate-500 text-xs">When off, hero cards are hidden until the final frame</p>
                                </div>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={handleClose}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleExport}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <path d="m22 8-6 4 6 4V8Z" />
                                    <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                                </svg>
                                Export Video
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
