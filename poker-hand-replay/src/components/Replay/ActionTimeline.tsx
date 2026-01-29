import type { Action, Street } from "@/types";

interface ActionTimelineProps {
    actions: Action[];
    currentIndex: number;
    onJumpTo: (index: number) => void;
}

const ACTION_COLORS: Record<string, string> = {
    fold: 'bg-poker-fold/80',
    check: 'bg-slate-500',
    call: 'bg-poker-bet/80',
    bet: 'bg-poker-pot',
    raise: 'bg-poker-pot',
    'all-in': 'bg-poker-allin'
};

const STREET_LABELS: Record<Street, string> = {
    preflop: 'PRE',
    flop: 'FLOP',
    turn: 'TURN',
    river: 'RIVER'
};

export function ActionTimeline({ actions, currentIndex, onJumpTo }: ActionTimelineProps) {
    // Group actions by street for visual separators
    let lastStreet: Street | null = null;

    return (
        <div className="bg-slate-900/50 border-t border-slate-800 px-3 py-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                {/* Initial state marker */}
                <button
                    onClick={() => onJumpTo(-1)}
                    className={`flex-shrink-0 px-2 py-1 rounded text-xs font-mono transition-all ${currentIndex === -1
                            ? 'bg-poker-hero text-white ring-2 ring-poker-hero/50'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                >
                    START
                </button>

                {actions.map((action, idx) => {
                    const showStreetDivider = action.street !== lastStreet;
                    lastStreet = action.street;

                    return (
                        <div key={action.id} className="flex items-center gap-2">
                            {/* Street Divider */}
                            {showStreetDivider && (
                                <div className="flex-shrink-0 flex items-center gap-1">
                                    <div className="w-px h-6 bg-slate-600" />
                                    <span className="text-[10px] text-slate-500 font-mono uppercase">
                                        {STREET_LABELS[action.street]}
                                    </span>
                                    <div className="w-px h-6 bg-slate-600" />
                                </div>
                            )}

                            {/* Action Node */}
                            <button
                                onClick={() => onJumpTo(idx)}
                                className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-all ${idx === currentIndex
                                        ? 'ring-2 ring-poker-hero/50 scale-105'
                                        : idx < currentIndex
                                            ? 'opacity-60'
                                            : ''
                                    } ${ACTION_COLORS[action.type]} text-white hover:opacity-100`}
                            >
                                <span className="font-bold">{action.playerPosition}</span>
                                <span className="text-white/80">
                                    {action.type === 'fold' && 'F'}
                                    {action.type === 'check' && 'X'}
                                    {action.type === 'call' && `C${action.amount}`}
                                    {action.type === 'bet' && `B${action.amount}`}
                                    {action.type === 'raise' && `R${action.amount}`}
                                    {action.type === 'all-in' && 'AI'}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
