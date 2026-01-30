import { useState, useEffect, useRef, useCallback } from 'react';
import { SetupForm } from '@/components/Input/SetupForm';
import { Table } from '@/components/Table/Table';
import { ActionInput } from '@/components/Input/ActionInput';
import { CardPicker } from '@/components/Card/CardPicker';
import { ReplayView } from '@/components/Replay';
import { useHandHistory } from '@/hooks/useHandHistory';
import { ChevronDown } from 'lucide-react';
import type { ActionType, Card, Street } from '@/types';

const MOBILE_BREAKPOINT = 768;
const HEADER_COLLAPSED_KEY = 'replow-header-collapsed';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

function App() {
  const { hand, currentStreet, activePlayerIndex, isHandComplete, isAllInShowdown, isManualEnd, initHand, addAction, advanceStreet, setHeroCards, setCommunityCards, getStreetState, setIsHandComplete, endHandManually, finishManualEnd, setCurrentStreet } = useHandHistory();
  const [view, setView] = useState<'setup' | 'play' | 'replay'>('setup');
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [heroCardsSelected, setHeroCardsSelected] = useState<Card[]>([]);

  // Collapsible header state
  const isMobile = useIsMobile();
  const [headerCollapsed, setHeaderCollapsed] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(HEADER_COLLAPSED_KEY);
    return stored !== null ? stored === 'true' : true; // Default collapsed on mobile
  });
  const headerRef = useRef<HTMLDivElement>(null);

  // Persist header state to localStorage
  useEffect(() => {
    if (isMobile) {
      localStorage.setItem(HEADER_COLLAPSED_KEY, String(headerCollapsed));
    }
  }, [headerCollapsed, isMobile]);

  // Close header when tapping outside (only on mobile when expanded)
  useEffect(() => {
    if (!isMobile || headerCollapsed) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setHeaderCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, headerCollapsed]);

  const toggleHeader = useCallback(() => {
    setHeaderCollapsed(prev => !prev);
  }, []);

  // Auto-switch to replay view when hand completes
  useEffect(() => {
    if (isHandComplete && view === 'play') {
      setView('replay');
    }
  }, [isHandComplete, view]);

  // Board card picking state
  const [pickingBoard, setPickingBoard] = useState<'flop' | 'turn' | 'river' | null>(null);
  const [boardCardsSelected, setBoardCardsSelected] = useState<Card[]>([]);
  const prevStreetRef = useRef<Street>('preflop');

  // Detect street changes and trigger board card picker
  useEffect(() => {
    if (currentStreet !== prevStreetRef.current && hand) {
      if (currentStreet === 'flop') {
        setPickingBoard('flop');
        setBoardCardsSelected([]);
      } else if (currentStreet === 'turn') {
        setPickingBoard('turn');
        setBoardCardsSelected([]);
      } else if (currentStreet === 'river') {
        setPickingBoard('river');
        setBoardCardsSelected([]);
      }
      prevStreetRef.current = currentStreet;
    }
  }, [currentStreet, hand]);

  // In all-in showdown, after river cards are selected, complete the hand
  useEffect(() => {
    if (isAllInShowdown && currentStreet === 'river' && hand?.communityCards.length === 5) {
      // All community cards are out, hand is complete
      setIsHandComplete(true);
    }
  }, [isAllInShowdown, currentStreet, hand?.communityCards.length, setIsHandComplete]);

  // In all-in showdown, auto-prompt for remaining community cards
  useEffect(() => {
    if (!isAllInShowdown || !hand || pickingBoard) return;

    const cardCount = hand.communityCards.length;

    // Determine what cards we need based on current state
    if (currentStreet === 'flop' && cardCount === 0) {
      setPickingBoard('flop');
      setBoardCardsSelected([]);
    } else if (currentStreet === 'turn' && cardCount === 3) {
      setPickingBoard('turn');
      setBoardCardsSelected([]);
    } else if (currentStreet === 'river' && cardCount === 4) {
      setPickingBoard('river');
      setBoardCardsSelected([]);
    }
  }, [isAllInShowdown, currentStreet, hand?.communityCards.length, pickingBoard, hand]);

  const handleStart = (config: any) => {
    initHand(config);
    setView('play');
    setShowCardPicker(true);
    setHeroCardsSelected([]);
    prevStreetRef.current = 'preflop';
  };

  const handleCardSelect = (card: Card) => {
    const newCards = [...heroCardsSelected, card];
    setHeroCardsSelected(newCards);

    if (newCards.length === 2) {
      setHeroCards([newCards[0], newCards[1]]);
      setShowCardPicker(false);
    }
  };

  const handleBoardCardSelect = (card: Card) => {
    const newCards = [...boardCardsSelected, card];
    setBoardCardsSelected(newCards);

    const cardsNeeded = pickingBoard === 'flop' ? 3 : 1;

    if (newCards.length >= cardsNeeded) {
      // Update community cards
      const existingCards = hand?.communityCards || [];
      setCommunityCards([...existingCards, ...newCards]);
      setPickingBoard(null);
      setBoardCardsSelected([]);

      // In all-in showdown, advance to next street after cards are selected
      if (isAllInShowdown) {
        // Small delay before advancing to next street
        setTimeout(() => {
          if (pickingBoard === 'flop') {
            advanceStreet(true); // Move to turn
          } else if (pickingBoard === 'turn') {
            advanceStreet(true); // Move to river
          }
          // River completion is handled by the useEffect that sets isHandComplete
        }, 300);
      }
    }
  };

  const handleAction = (type: ActionType, amount?: number) => {
    addAction(type, amount || 0);
  };

  const handleExitReplay = () => {
    setView('setup');
  };

  // Handle manual end hand
  const handleEndHand = () => {
    endHandManually();
  };

  // Handle board card selection in manual end mode
  const handleManualBoardCardSelect = (card: Card) => {
    const newCards = [...boardCardsSelected, card];
    setBoardCardsSelected(newCards);

    const cardsNeeded = pickingBoard === 'flop' ? 3 : 1;

    if (newCards.length >= cardsNeeded) {
      const existingCards = hand?.communityCards || [];
      setCommunityCards([...existingCards, ...newCards]);
      setPickingBoard(null);
      setBoardCardsSelected([]);
    }
  };

  // Start picking board cards for a specific street in manual end mode
  const startPickingBoardForStreet = (street: 'flop' | 'turn' | 'river') => {
    setPickingBoard(street);
    setBoardCardsSelected([]);
    // Update current street to match what we're picking
    if (street === 'flop') setCurrentStreet('flop');
    else if (street === 'turn') setCurrentStreet('turn');
    else if (street === 'river') setCurrentStreet('river');
  };

  // Finish manual end and go to replay
  const handleFinishAndReplay = () => {
    finishManualEnd();
  };

  // Calculate betting state for the active player
  const streetState = getStreetState ? getStreetState() : {
    maxBet: 0,
    heroBet: 0,
    canCheck: true,
    toCall: 0,
    minRaise: 1,
    pot: 0,
    activePlayerStack: 100
  };

  // Show ReplayView when hand is complete
  if (view === 'replay' && hand) {
    return (
      <div className="h-screen bg-slate-950 text-slate-50 flex flex-col font-sans selection:bg-poker-hero/30 overflow-hidden">
        <ReplayView hand={hand} onExit={handleExitReplay} />
      </div>
    );
  }

  // Determine if header should be shown as collapsible (mobile + play view)
  const showCollapsibleHeader = isMobile && view === 'play';

  return (
    <div className="h-screen bg-slate-950 text-slate-50 flex flex-col font-sans selection:bg-poker-hero/30 overflow-hidden">
      {/* Collapsible Header for Mobile */}
      {showCollapsibleHeader ? (
        <div ref={headerRef} className="flex-shrink-0 z-50">
          {/* Handle - always visible */}
          <button
            onClick={toggleHeader}
            className="w-full bg-slate-950 border-b border-[rgba(255,255,255,0.10)] flex items-center justify-center pt-safe transition-colors active:bg-slate-900"
            style={{ height: headerCollapsed ? '28px' : '0px', paddingTop: 'env(safe-area-inset-top)' }}
            aria-label={headerCollapsed ? 'Expand header' : 'Collapse header'}
            aria-expanded={!headerCollapsed}
          >
            <ChevronDown
              size={16}
              className={`text-slate-500 transition-transform duration-200 ${headerCollapsed ? '' : 'rotate-180'}`}
            />
          </button>

          {/* Expandable content */}
          <div
            className={`overflow-hidden transition-all duration-200 ease-out bg-slate-950 border-b border-[rgba(255,255,255,0.10)] ${
              headerCollapsed ? 'max-h-0 opacity-0' : 'max-h-16 opacity-100'
            }`}
          >
            <div className="p-3 flex justify-between items-center">
              <h1 className="text-xl font-bold tracking-tight text-slate-50">Replow</h1>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 uppercase">
                  {currentStreet}
                </span>
                <button
                  onClick={() => setView('setup')}
                  className="text-xs text-slate-400 hover:text-poker-hero transition-colors"
                >
                  NEW HAND
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Header for Desktop & Setup/Replay views */
        <header className="flex-shrink-0 p-3 border-b border-[rgba(255,255,255,0.10)] flex justify-between items-center bg-slate-950 backdrop-blur z-50 pt-safe">
          <h1 className="text-xl font-bold tracking-tight text-slate-50">Replow</h1>
          {view === 'play' && (
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 uppercase">
                {currentStreet}
              </span>
              <button
                onClick={() => setView('setup')}
                className="text-xs text-slate-400 hover:text-poker-hero transition-colors"
              >
                NEW HAND
              </button>
            </div>
          )}
        </header>
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden min-h-0">
        {view === 'setup' ? (
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <SetupForm onStart={handleStart} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex items-center justify-center p-2 min-h-0 overflow-hidden">
              {hand && (
                <Table
                  players={hand.players}
                  communityCards={hand.communityCards}
                  activePlayerIndex={activePlayerIndex}
                  pot={streetState.pot}
                  actions={hand.actions}
                  currentStreet={currentStreet}
                />
              )}
            </div>

            {/* Card Picker Modal */}
            {showCardPicker && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="space-y-4">
                  <div className="text-center text-slate-300 mb-2">
                    Select Hero Card {heroCardsSelected.length + 1} of 2
                  </div>
                  <CardPicker
                    onSelect={handleCardSelect}
                    onCancel={() => setShowCardPicker(false)}
                    excludedCards={heroCardsSelected}
                  />
                  {heroCardsSelected.length > 0 && (
                    <div className="text-center text-sm text-slate-400">
                      First card: {heroCardsSelected[0].rank}{heroCardsSelected[0].suit}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Board Card Picker Modal */}
            {pickingBoard && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="space-y-4">
                  <div className="text-center text-slate-300 mb-2">
                    {pickingBoard === 'flop'
                      ? `Select Flop Card ${boardCardsSelected.length + 1} of 3`
                      : pickingBoard === 'turn'
                        ? 'Select Turn Card'
                        : 'Select River Card'
                    }
                  </div>
                  <CardPicker
                    onSelect={isManualEnd ? handleManualBoardCardSelect : handleBoardCardSelect}
                    onCancel={() => setPickingBoard(null)}
                    excludedCards={[
                      ...(hand?.players.find(p => p.isHero)?.cards.filter((c): c is Card => c !== null) || []),
                      ...(hand?.communityCards || []),
                      ...boardCardsSelected
                    ]}
                  />
                  {boardCardsSelected.length > 0 && (
                    <div className="text-center text-sm text-slate-400">
                      Selected: {boardCardsSelected.map(c => `${c.rank}${c.suit}`).join(' ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Controller Area - Fixed at bottom */}
            <div className="flex-shrink-0">
              {/* Active Player Indicator */}
              <div className="bg-slate-900 px-1.5 py-1 flex gap-1 items-center border-t border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">
                  {isManualEnd ? 'End:' : isAllInShowdown ? 'AI:' : 'Act:'}
                </span>
                {hand?.players.map((p, idx) => (
                  <button
                    key={p.position}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      !p.isActive
                        ? 'bg-transparent text-slate-600 line-through'
                        : p.stack === 0
                          ? 'bg-poker-allin/80 text-white' // All-in indicator
                          : isManualEnd
                            ? 'bg-slate-700 text-slate-300' // No active player in manual end
                            : idx === activePlayerIndex
                              ? 'bg-poker-hero text-white ring-2 ring-poker-hero/50'
                              : 'bg-slate-700 text-slate-300'
                      }`}
                  >
                    {p.position}{p.isActive && p.stack === 0 ? ' (AI)' : ''}
                  </button>
                ))}
              </div>

              {isManualEnd ? (
                // Manual end mode - allow optional board card selection
                <div className="p-2 bg-slate-900 border-t border-slate-800 pb-safe">
                  <div className="text-poker-hero font-bold mb-0.5 text-center text-xs">Hand Ended</div>
                  <p className="text-slate-400 text-[10px] text-center mb-2">
                    Add remaining board cards, then view replay.
                  </p>

                  {/* Board card status and buttons */}
                  <div className="flex flex-wrap gap-1.5 justify-center mb-2">
                    {/* Flop */}
                    {(hand?.communityCards.length || 0) < 3 ? (
                      <button
                        onClick={() => startPickingBoardForStreet('flop')}
                        className="px-1.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px]"
                      >
                        + Flop
                      </button>
                    ) : (
                      <span className="px-1.5 py-1 bg-slate-800 rounded text-[10px] text-slate-400">
                        {hand?.communityCards.slice(0, 3).map(c => `${c.rank}${c.suit}`).join(' ')}
                      </span>
                    )}

                    {/* Turn */}
                    {(hand?.communityCards.length || 0) >= 3 && (hand?.communityCards.length || 0) < 4 ? (
                      <button
                        onClick={() => startPickingBoardForStreet('turn')}
                        className="px-1.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px]"
                      >
                        + Turn
                      </button>
                    ) : (hand?.communityCards.length || 0) >= 4 ? (
                      <span className="px-1.5 py-1 bg-slate-800 rounded text-[10px] text-slate-400">
                        {hand?.communityCards[3]?.rank}{hand?.communityCards[3]?.suit}
                      </span>
                    ) : null}

                    {/* River */}
                    {(hand?.communityCards.length || 0) >= 4 && (hand?.communityCards.length || 0) < 5 ? (
                      <button
                        onClick={() => startPickingBoardForStreet('river')}
                        className="px-1.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px]"
                      >
                        + River
                      </button>
                    ) : (hand?.communityCards.length || 0) >= 5 ? (
                      <span className="px-1.5 py-1 bg-slate-800 rounded text-[10px] text-slate-400">
                        {hand?.communityCards[4]?.rank}{hand?.communityCards[4]?.suit}
                      </span>
                    ) : null}
                  </div>

                  {/* View Replay button */}
                  <button
                    onClick={handleFinishAndReplay}
                    className="w-full py-2 bg-poker-hero hover:bg-poker-hero/85 rounded-xl font-bold text-white text-sm shadow-[0_6px_16px_rgba(0,0,0,0.4)]"
                  >
                    View Replay →
                  </button>
                </div>
              ) : isAllInShowdown ? (
                // All-in showdown message - no action input needed
                <div className="p-2 bg-slate-900 border-t border-slate-800 text-center pb-safe">
                  <div className="text-poker-pot font-bold mb-0.5 text-xs">All-In Showdown</div>
                  <p className="text-slate-400 text-[10px]">
                    {currentStreet === 'preflop' && 'Select flop cards to continue...'}
                    {currentStreet === 'flop' && 'Select turn card to continue...'}
                    {currentStreet === 'turn' && 'Select river card to continue...'}
                    {currentStreet === 'river' && hand?.communityCards.length === 5 && 'Board complete!'}
                  </p>
                </div>
              ) : (
                <ActionInput
                  onAction={handleAction}
                  onEndHand={handleEndHand}
                  canCheck={streetState.canCheck}
                  canCall={!streetState.canCheck}
                  callAmount={streetState.toCall}
                  minBet={streetState.minRaise || streetState.maxBet * 2 || 1}
                  pot={streetState.pot}
                  playerStack={streetState.activePlayerStack}
                  street={currentStreet}
                  maxBet={streetState.maxBet}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
