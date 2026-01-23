import { useState, useEffect } from "react";
import type { ActionType, Street } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ActionInputProps {
    onAction: (type: ActionType, amount?: number) => void;
    onEndHand?: () => void;
    canCheck: boolean;
    canCall: boolean;
    callAmount?: number;
    minBet?: number;
    pot?: number;
    playerStack?: number;
    street?: Street;
    maxBet?: number; // Current highest bet on this street
}

export function ActionInput({
    onAction,
    onEndHand,
    canCheck,
    canCall: _canCall, // Kept for interface compatibility
    callAmount = 0,
    minBet = 1,
    pot = 0,
    playerStack = 100,
    street = 'preflop',
    maxBet = 0
}: ActionInputProps) {
    const [amount, setAmount] = useState<string>(minBet.toString());
    const [mode, setMode] = useState<'normal' | 'betting'>('normal');

    // Preflop: Any voluntary betting action is a Raise (over blinds).
    // Postflop: If you can check, opening action is a Bet. If you can't check, it's a Raise.
    const isRaise = !(canCheck && street !== 'preflop');
    const aggressiveActionLabel = isRaise ? 'RAISE' : 'BET';

    // Calculate effective min bet (capped to stack)
    const effectiveMinBet = Math.min(minBet, playerStack);

    // Update amount when minBet changes
    useEffect(() => {
        setAmount(effectiveMinBet.toString());
    }, [effectiveMinBet]);

    const handleBetClick = () => {
        setMode('betting');
        setAmount(effectiveMinBet.toString());
    };

    // Helper to cap amount to player's stack
    const capToStack = (value: number): number => {
        return Math.min(Math.max(0, Math.round(value)), playerStack);
    };

    const submitBet = () => {
        let betAmount = Number(amount);
        // Cap to player's stack (all-in protection)
        betAmount = capToStack(betAmount);
        // Determine if this is a bet or raise based on context
        const type = isRaise ? 'raise' : 'bet';
        onAction(type, betAmount);
        setMode('normal');
    };

    const handleAllIn = () => {
        setAmount(playerStack.toString());
    };

    // Handle amount change with validation
    const handleAmountChange = (value: string) => {
        const numValue = Number(value);
        // Allow typing but cap display to stack when it exceeds
        if (numValue > playerStack) {
            setAmount(playerStack.toString());
        } else {
            setAmount(value);
        }
    };

    if (mode === 'betting') {
        // For BET: Use pot-based sizing (1/3, 1/2, 3/4, Pot)
        // For RAISE: Use raise multipliers (2x, 2.5x, 3x, 4x of current bet)
        const potSizeRaise = pot + callAmount; // Pot-size bet/raise

        // Render quick sizing buttons based on bet vs raise
        const renderQuickButtons = () => {
            if (isRaise) {
                // RAISE mode: Show multipliers of the current bet to face
                // The raise "to" amount = maxBet * multiplier
                const raiseMultipliers = [
                    { label: '2×', mult: 2 },
                    { label: '2.5×', mult: 2.5 },
                    { label: '3×', mult: 3 },
                    { label: '4×', mult: 4 },
                ];

                return (
                    <>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setAmount(capToStack(effectiveMinBet).toString())}
                        >
                            Min
                        </Button>
                        {raiseMultipliers.map(({ label, mult }) => {
                            const raiseToAmount = capToStack(maxBet * mult);
                            return (
                                <Button
                                    key={label}
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setAmount(raiseToAmount.toString())}
                                    disabled={raiseToAmount <= effectiveMinBet}
                                >
                                    {label}
                                </Button>
                            );
                        })}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleAllIn}
                        >
                            All-In
                        </Button>
                    </>
                );
            } else {
                // BET mode: Show pot-based sizing
                return (
                    <>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setAmount(capToStack(effectiveMinBet).toString())}
                        >
                            Min
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setAmount(capToStack(potSizeRaise * 0.33).toString())}
                        >
                            1/3 Pot
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setAmount(capToStack(potSizeRaise * 0.5).toString())}
                        >
                            1/2 Pot
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setAmount(capToStack(potSizeRaise * 0.75).toString())}
                        >
                            3/4 Pot
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setAmount(capToStack(potSizeRaise).toString())}
                        >
                            Pot
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleAllIn}
                        >
                            All-In
                        </Button>
                    </>
                );
            }
        };

        return (
            <div className="flex flex-col gap-2 p-2 bg-slate-900 border-t border-slate-800">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {renderQuickButtons()}
                </div>
                <div className="flex gap-2">
                    <Input
                        type="number"
                        value={amount}
                        onChange={e => handleAmountChange(e.target.value)}
                        min={effectiveMinBet}
                        max={playerStack}
                        className="text-base bg-slate-950 font-mono h-10"
                    />
                    <Button onClick={submitBet} className="bg-emerald-600 font-bold w-28 h-10">
                        {aggressiveActionLabel}
                    </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setMode('normal')}>Cancel</Button>
            </div>
        );
    }

    // Player has no chips - can only fold (or check if allowed)
    if (playerStack <= 0) {
        return (
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-900 border-t border-slate-800 pb-safe">
                <Button
                    variant="destructive"
                    className="h-14 text-base font-bold bg-red-600/90 hover:bg-red-600"
                    onClick={() => onAction('fold')}
                >
                    FOLD
                </Button>
                {canCheck && (
                    <Button
                        className="h-14 text-base font-bold bg-slate-700 hover:bg-slate-600"
                        onClick={() => onAction('check')}
                    >
                        CHECK
                    </Button>
                )}
            </div>
        );
    }

    // Calculate effective call amount (capped to stack for all-in calls)
    const effectiveCallAmount = Math.min(callAmount, playerStack);
    const isAllInCall = callAmount > playerStack;

    return (
        <div className="bg-slate-900 border-t border-slate-800 pb-safe">
            {/* End Hand button */}
            {onEndHand && (
                <div className="flex justify-end px-2 pt-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEndHand}
                        className="text-slate-400 hover:text-white text-xs"
                    >
                        End Hand →
                    </Button>
                </div>
            )}
            <div className="grid grid-cols-4 gap-2 p-2">
                <Button
                    variant="destructive"
                    className="h-14 text-base font-bold bg-red-600/90 hover:bg-red-600"
                    onClick={() => onAction('fold')}
                >
                    FOLD
                </Button>

                {canCheck ? (
                    <Button
                        className="h-14 text-base font-bold bg-slate-700 hover:bg-slate-600 col-span-2"
                        onClick={() => onAction('check')}
                    >
                        CHECK
                    </Button>
                ) : (
                    <Button
                        className="h-14 text-base font-bold bg-slate-700 hover:bg-slate-600 col-span-2"
                        onClick={() => onAction('call', effectiveCallAmount)}
                    >
                        {isAllInCall ? 'ALL-IN' : 'CALL'} {effectiveCallAmount > 0 && effectiveCallAmount}
                    </Button>
                )}

                <Button
                    className="h-14 text-base font-bold bg-emerald-600/90 hover:bg-emerald-600"
                    onClick={handleBetClick}
                    disabled={playerStack <= effectiveCallAmount}
                >
                    {aggressiveActionLabel}
                </Button>
            </div>
        </div>
    );
}
