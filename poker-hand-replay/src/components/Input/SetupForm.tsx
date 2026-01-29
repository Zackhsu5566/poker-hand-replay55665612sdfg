import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Position } from "@/types";
import { getPositions } from "@/utils/positions";
import { ChevronRight, Users, UserCircle, Coins } from "lucide-react";

interface SetupConfig {
    sb: number;
    bb: number;
    ante: number;
    playerCount: number;
    heroPosition: Position;
    heroStack: number;
}

interface SetupFormProps {
    onStart: (config: SetupConfig) => void;
}

type Step = 'count' | 'position' | 'stack';

export function SetupForm({ onStart }: SetupFormProps) {
    const [step, setStep] = useState<Step>('count');
    const [config, setConfig] = useState<SetupConfig>({
        sb: 1,
        bb: 2,
        ante: 0,
        playerCount: 6,
        heroPosition: 'BTN',
        heroStack: 100,
    });

    const [numericInputs, setNumericInputs] = useState({
        sb: "1",
        bb: "2",
        heroStack: "100"
    });

    const availablePositions = useMemo(() => getPositions(config.playerCount), [config.playerCount]);

    const handleNext = () => {
        if (step === 'count') setStep('position');
        else if (step === 'position') setStep('stack');
        else {
            onStart({
                ...config,
                sb: Number(numericInputs.sb) || 0,
                bb: Number(numericInputs.bb) || 0,
                heroStack: Number(numericInputs.heroStack) || 0
            });
        }
    };

    const handleBlur = (field: keyof typeof numericInputs) => {
        const val = Number(numericInputs[field]);
        // Default to 0 if NaN or empty, clamp to positive
        const normalized = isNaN(val) || val < 0 ? 0 : val;
        setNumericInputs(prev => ({ ...prev, [field]: normalized.toString() }));
    };

    const renderStepContent = () => {
        switch (step) {
            case 'count':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                            <Users size={20} className="text-poker-bet" />
                            How many players?
                        </h3>
                        <div className="grid grid-cols-3 gap-2 xs:gap-3">
                            {[2, 3, 4, 5, 6, 9].map(count => (
                                <button
                                    key={count}
                                    onClick={() => {
                                        setConfig(prev => ({ ...prev, playerCount: count }));
                                        // Auto advance for better UX
                                        setStep('position');
                                    }}
                                    className={`aspect-square min-h-[60px] rounded-xl border-2 text-xl font-bold transition-all
                                        ${config.playerCount === count
                                            ? 'bg-poker-hero/20 border-poker-hero text-poker-hero'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900 group'
                                        }`}
                                >
                                    {count}
                                    <span className="block text-xs font-normal opacity-50">max</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'position':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                                <UserCircle size={20} className="text-poker-hero" />
                                What is your position?
                            </h3>
                            <button onClick={() => setStep('count')} className="text-xs text-slate-500 hover:text-slate-300">
                                Change Players
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 xs:gap-3">
                            {availablePositions.map(pos => (
                                <button
                                    key={pos}
                                    onClick={() => setConfig({ ...config, heroPosition: pos })}
                                    className={`py-3 xs:py-4 min-h-[48px] rounded-lg border-2 text-sm font-bold transition-all
                                        ${config.heroPosition === pos
                                            ? 'bg-poker-hero/20 border-poker-hero text-poker-hero shadow-[0_0_15px_-3px_rgba(43,212,182,0.3)]'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900'
                                        }`}
                                >
                                    {pos}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'stack':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                                <Coins size={20} className="text-poker-pot" />
                                Stack & Blinds
                            </h3>
                            <button onClick={() => setStep('position')} className="text-xs text-slate-500 hover:text-slate-300">
                                Back
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 font-medium uppercase">Effective Stack (BB)</label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={numericInputs.heroStack}
                                    onChange={(e) => setNumericInputs({ ...numericInputs, heroStack: e.target.value })}
                                    onBlur={() => handleBlur('heroStack')}
                                    className="bg-slate-950 border-slate-800 h-12 text-lg font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 font-medium uppercase">Small Blind</label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={numericInputs.sb}
                                        onChange={(e) => setNumericInputs({ ...numericInputs, sb: e.target.value })}
                                        onBlur={() => handleBlur('sb')}
                                        className="bg-slate-950 border-slate-800 font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 font-medium uppercase">Big Blind</label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={numericInputs.bb}
                                        onChange={(e) => setNumericInputs({ ...numericInputs, bb: e.target.value })}
                                        onBlur={() => handleBlur('bb')}
                                        className="bg-slate-950 border-slate-800 font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-1">
            <div className="bg-[rgba(255,255,255,0.06)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.10)] rounded-2xl shadow-2xl overflow-hidden">
                {/* Progress Bar */}
                <div className="flex h-1 bg-slate-950">
                    <div className={`h-full bg-poker-hero transition-all duration-300 ${step === 'count' ? 'w-1/3' : step === 'position' ? 'w-2/3' : 'w-full'}`} />
                </div>

                <div className="p-6">
                    {renderStepContent()}
                </div>

                <div className="p-6 bg-[rgba(0,0,0,0.2)] border-t border-[rgba(255,255,255,0.08)] flex justify-end">
                    {step !== 'count' && (
                        <Button
                            onClick={handleNext}
                            className="bg-slate-100 hover:bg-white text-slate-900 font-bold px-8"
                        >
                            {step === 'stack' ? 'Start Hand' : (
                                <span className="flex items-center gap-2">
                                    Next <ChevronRight size={16} />
                                </span>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-slate-500 text-xs">
                    Poker Replay Studio v0.1
                </p>
            </div>
        </div>
    );
}
