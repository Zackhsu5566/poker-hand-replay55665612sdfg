import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/useClipboard";
import { formatHandHistory } from "@/utils/textExport";
import type { TextExportOptions } from "@/utils/textExport";
import type { HandHistory } from "@/types";

interface TextExportModalProps {
    hand: HandHistory;
    onClose: () => void;
}

export function TextExportModal({ hand, onClose }: TextExportModalProps) {
    const { copy, copied, error } = useClipboard();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [options, setOptions] = useState<TextExportOptions>({
        showDollarAmounts: false,
        dollarPerBB: 2, // Default $1/$2
        showPotPercentages: true
    });

    const [showFallback, setShowFallback] = useState(false);

    // Generate the formatted text
    const formattedText = useMemo(() => {
        return formatHandHistory(hand, options);
    }, [hand, options]);

    // Handle copy action
    const handleCopy = async () => {
        const success = await copy(formattedText);
        if (!success) {
            setShowFallback(true);
        }
    };

    // Select all text in fallback textarea
    useEffect(() => {
        if (showFallback && textareaRef.current) {
            textareaRef.current.select();
        }
    }, [showFallback]);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-[rgba(255,255,255,0.10)] rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-poker-bet">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" x2="12" y1="2" y2="15" />
                        </svg>
                        Share Hand
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Options */}
                <div className="mb-4 flex-shrink-0 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={options.showPotPercentages}
                            onChange={(e) => setOptions(prev => ({ ...prev, showPotPercentages: e.target.checked }))}
                            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-poker-hero focus:ring-poker-hero focus:ring-offset-slate-900"
                        />
                        <span className="text-slate-300 text-sm">Show pot percentages</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={options.showDollarAmounts}
                            onChange={(e) => setOptions(prev => ({ ...prev, showDollarAmounts: e.target.checked }))}
                            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-poker-hero focus:ring-poker-hero focus:ring-offset-slate-900"
                        />
                        <span className="text-slate-300 text-sm">Show dollar amounts</span>
                    </label>
                    {options.showDollarAmounts && (
                        <div className="ml-8 flex items-center gap-2">
                            <span className="text-slate-400 text-sm">$1 per</span>
                            <input
                                type="number"
                                value={options.dollarPerBB || 1}
                                onChange={(e) => setOptions(prev => ({ ...prev, dollarPerBB: parseFloat(e.target.value) || 1 }))}
                                className="w-16 px-2 py-1 rounded border border-slate-600 bg-slate-800 text-white text-sm focus:border-poker-hero focus:ring-1 focus:ring-poker-hero"
                                min="0.01"
                                step="0.01"
                            />
                            <span className="text-slate-400 text-sm">bb</span>
                        </div>
                    )}
                </div>

                {/* Text Preview */}
                <div className="flex-1 min-h-0 mb-4 overflow-hidden">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Preview
                    </label>
                    <textarea
                        ref={textareaRef}
                        value={formattedText}
                        readOnly
                        className="w-full h-full min-h-[200px] max-h-[300px] p-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 font-mono text-xs resize-none focus:border-poker-hero focus:ring-1 focus:ring-poker-hero"
                        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    />
                </div>

                {/* Error/Fallback Message */}
                {error && !showFallback && (
                    <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm flex-shrink-0">
                        <p className="font-medium">Clipboard access unavailable</p>
                        <p className="text-yellow-400/80 text-xs mt-1">Select the text above and copy manually (Ctrl+C / Cmd+C)</p>
                    </div>
                )}

                {/* Success Toast */}
                {copied && (
                    <div className="mb-4 p-3 rounded-lg bg-poker-bet/10 border border-poker-bet/30 text-poker-bet text-sm flex items-center gap-2 flex-shrink-0 animate-fade-in-up">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Copied to clipboard!
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 flex-shrink-0">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1"
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleCopy}
                        className="flex-1 bg-poker-bet hover:bg-poker-bet-hover text-white"
                    >
                        {copied ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                </svg>
                                Copy to Clipboard
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
