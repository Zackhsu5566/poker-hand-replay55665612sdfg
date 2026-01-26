import { useState, useCallback, useRef } from "react";
import type {
    HandHistory,
    ExportOptions,
    ExportProgress,
    Player,
    Action,
    Street,
    ReplaySnapshot
} from "@/types";
import { renderFrame, renderTitleCard, renderFadeOverlay, renderBlackFrame } from "@/components/Export/CanvasRenderer";

const BASE_DELAY_MS = 1500;
const FADE_DURATION_MS = 300;
const FRAME_INTERVAL_MS = 33; // ~30fps
const FADE_STEPS = Math.ceil(FADE_DURATION_MS / FRAME_INTERVAL_MS);

const STREET_CARD_COUNT: Record<Street, number> = {
    preflop: 0,
    flop: 3,
    turn: 4,
    river: 5
};

interface UseVideoExportReturn {
    exportVideo: (hand: HandHistory, options: ExportOptions) => Promise<void>;
    progress: ExportProgress;
    isExporting: boolean;
    downloadUrl: string | null;
    mimeType: string | null;
    reset: () => void;
}

export function useVideoExport(): UseVideoExportReturn {
    const [progress, setProgress] = useState<ExportProgress>({
        status: 'idle',
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
        message: ''
    });
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string | null>(null);
    const abortRef = useRef(false);

    const reset = useCallback(() => {
        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
        }
        setDownloadUrl(null);
        setMimeType(null);
        setProgress({
            status: 'idle',
            progress: 0,
            currentFrame: 0,
            totalFrames: 0,
            message: ''
        });
        abortRef.current = false;
    }, [downloadUrl]);

    const exportVideo = useCallback(async (hand: HandHistory, options: ExportOptions) => {
        abortRef.current = false;

        // Parse resolution
        const [widthStr, heightStr] = options.resolution.split('x');
        const width = parseInt(widthStr, 10);
        const height = parseInt(heightStr, 10);

        // Create offscreen canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            setProgress(prev => ({ ...prev, status: 'error', message: 'Failed to create canvas context' }));
            return;
        }

        // Compute snapshots (replicating useReplay logic)
        const snapshots = computeAllSnapshots(hand);
        const totalFrames = snapshots.length + (options.includeTitleCard ? 1 : 0);

        setProgress({
            status: 'rendering',
            progress: 0,
            currentFrame: 0,
            totalFrames,
            message: 'Preparing video...'
        });

        // Setup MediaRecorder
        const stream = canvas.captureStream(30);
        const detectedMimeType = getSupportedMimeType();

        if (!detectedMimeType) {
            setProgress(prev => ({ ...prev, status: 'error', message: 'No supported video format found' }));
            return;
        }

        setMimeType(detectedMimeType);

        const recorder = new MediaRecorder(stream, {
            mimeType: detectedMimeType,
            videoBitsPerSecond: 2_500_000
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        const recordingComplete = new Promise<Blob>((resolve, reject) => {
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: detectedMimeType });
                resolve(blob);
            };
            recorder.onerror = (e) => reject(e);
        });

        recorder.start();

        try {
            const frameDuration = BASE_DELAY_MS / options.playbackSpeed;
            let currentFrame = 0;

            // Hero reveal logic: hide hero cards unless toggle is on or it's the last frame
            const shouldHideHero = !options.includeHeroReveal;

            // Render title card if enabled
            if (options.includeTitleCard) {
                renderTitleCard(ctx, hand, { width, height });
                await holdFrame(frameDuration);

                currentFrame++;
                setProgress(prev => ({
                    ...prev,
                    currentFrame,
                    progress: Math.round((currentFrame / totalFrames) * 100),
                    message: 'Rendering title card...'
                }));

                // Fade to black after title card
                if (snapshots.length > 0) {
                    await fadeOut(ctx, () => renderTitleCard(ctx, hand, { width, height }), width, height);
                }
            }

            // Render each snapshot
            for (let i = 0; i < snapshots.length; i++) {
                if (abortRef.current) {
                    recorder.stop();
                    return;
                }

                const snapshot = snapshots[i];
                const isLastFrame = i === snapshots.length - 1;
                const hideHeroCards = shouldHideHero && !isLastFrame;

                const renderOpts = { width, height, hideHeroCards };

                // Fade in from black (for first frame after title, or after previous frame's fade-out)
                if (i === 0 && options.includeTitleCard) {
                    await fadeIn(ctx, () => renderFrame(ctx, snapshot, hand, renderOpts), width, height);
                } else if (i > 0) {
                    // Fade in from the black left by previous frame's fade-out
                    await fadeIn(ctx, () => renderFrame(ctx, snapshot, hand, renderOpts), width, height);
                } else {
                    // First frame, no title card — just render directly
                    renderFrame(ctx, snapshot, hand, renderOpts);
                }

                // Hold frame for the duration
                await holdFrame(frameDuration);

                currentFrame++;
                setProgress(prev => ({
                    ...prev,
                    currentFrame,
                    progress: Math.round((currentFrame / totalFrames) * 100),
                    message: `Rendering frame ${currentFrame} of ${totalFrames}...`
                }));

                // Fade to black (unless this is the last frame)
                if (!isLastFrame) {
                    await fadeOut(ctx, () => renderFrame(ctx, snapshot, hand, renderOpts), width, height);
                }
            }

            // Hold the last frame a bit longer before ending
            if (snapshots.length > 0) {
                await holdFrame(frameDuration * 0.5);
            }

            // Stop recording
            recorder.stop();

            setProgress(prev => ({
                ...prev,
                status: 'encoding',
                message: 'Finalizing video...'
            }));

            const blob = await recordingComplete;

            // Create download URL
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            setProgress({
                status: 'complete',
                progress: 100,
                currentFrame: totalFrames,
                totalFrames,
                message: 'Export complete!'
            });

        } catch (error) {
            console.error('Export error:', error);
            setProgress(prev => ({
                ...prev,
                status: 'error',
                message: error instanceof Error ? error.message : 'Export failed'
            }));
        }
    }, []);

    return {
        exportVideo,
        progress,
        isExporting: progress.status === 'rendering' || progress.status === 'encoding',
        downloadUrl,
        mimeType,
        reset
    };
}

// Hold the current frame for a specified duration
function holdFrame(durationMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, durationMs));
}

// Fade out: re-render the scene and progressively overlay black
async function fadeOut(
    ctx: CanvasRenderingContext2D,
    renderScene: () => void,
    width: number,
    height: number
): Promise<void> {
    for (let step = 1; step <= FADE_STEPS; step++) {
        const alpha = step / FADE_STEPS;
        renderScene();
        renderFadeOverlay(ctx, width, height, alpha);
        await holdFrame(FRAME_INTERVAL_MS);
    }
    // Ensure we end on solid black
    renderBlackFrame(ctx, width, height);
    await holdFrame(FRAME_INTERVAL_MS);
}

// Fade in: render the next scene and progressively remove black overlay
async function fadeIn(
    ctx: CanvasRenderingContext2D,
    renderScene: () => void,
    width: number,
    height: number
): Promise<void> {
    for (let step = FADE_STEPS; step >= 0; step--) {
        const alpha = step / FADE_STEPS;
        renderScene();
        if (alpha > 0) {
            renderFadeOverlay(ctx, width, height, alpha);
        }
        await holdFrame(FRAME_INTERVAL_MS);
    }
}

// Get supported MIME type for video recording
function getSupportedMimeType(): string | null {
    const types = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
    ];

    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }

    return null;
}

// Get file extension from MIME type
export function getFileExtension(mime: string | null): string {
    if (!mime) return 'webm';
    if (mime.startsWith('video/mp4')) return 'mp4';
    if (mime.startsWith('video/webm')) return 'webm';
    return 'webm';
}

// Compute all snapshots for the hand (replicating useReplay logic)
function computeAllSnapshots(hand: HandHistory): ReplaySnapshot[] {
    const snapshots: ReplaySnapshot[] = [];

    // Identify blind actions
    const blindPositions = ['SB', 'BB'];
    const blindActions: Action[] = [];

    for (const action of hand.actions) {
        if (action.street !== 'preflop') break;
        if (blindPositions.includes(action.playerPosition) && action.type === 'bet') {
            blindActions.push(action);
            if (blindActions.length >= 2) break;
        }
    }

    const blindCount = blindActions.length;
    const voluntaryActions = hand.actions.slice(blindCount);

    // Calculate initial stacks (before any actions)
    const initialStacks = new Map<string, number>();
    hand.players.forEach(player => {
        let stack = player.stack;
        const totalBetByPlayer = hand.actions
            .filter(a => a.playerPosition === player.position)
            .reduce((sum, a) => {
                if (a.type === 'bet' || a.type === 'raise' || a.type === 'call' || a.type === 'all-in') {
                    return sum + a.amount;
                }
                return sum;
            }, 0);
        stack += totalBetByPlayer;
        initialStacks.set(player.position, stack);
    });

    // Generate snapshot for each action index (-1 to voluntaryActions.length - 1)
    for (let actionIndex = -1; actionIndex < voluntaryActions.length; actionIndex++) {
        const visibleVoluntaryActions = actionIndex >= 0
            ? voluntaryActions.slice(0, actionIndex + 1)
            : [];

        const visibleActions = [...blindActions, ...visibleVoluntaryActions];

        const lastAction = visibleActions.length > 0
            ? visibleActions[visibleActions.length - 1]
            : null;

        const lastVoluntaryAction = visibleVoluntaryActions.length > 0
            ? visibleVoluntaryActions[visibleVoluntaryActions.length - 1]
            : null;

        const currentStreet: Street = lastVoluntaryAction?.street || 'preflop';

        const cardCount = STREET_CARD_COUNT[currentStreet];
        const communityCards = hand.communityCards.slice(0, cardCount);

        const pot = visibleActions.reduce((sum, a) => {
            if (a.type === 'bet' || a.type === 'raise' || a.type === 'call' || a.type === 'all-in') {
                return sum + a.amount;
            }
            return sum;
        }, 0);

        const players: Player[] = hand.players.map(player => {
            const hasFolded = visibleActions.some(
                a => a.playerPosition === player.position && a.type === 'fold'
            );

            const betSoFar = visibleActions
                .filter(a => a.playerPosition === player.position)
                .reduce((sum, a) => {
                    if (a.type === 'bet' || a.type === 'raise' || a.type === 'call' || a.type === 'all-in') {
                        return sum + a.amount;
                    }
                    return sum;
                }, 0);

            const startingStack = initialStacks.get(player.position) || 100;
            const currentStack = startingStack - betSoFar;

            return {
                ...player,
                isActive: !hasFolded,
                stack: currentStack
            };
        });

        let activePlayerIndex = -1;
        if (lastVoluntaryAction) {
            activePlayerIndex = players.findIndex(p => p.position === lastVoluntaryAction.playerPosition);
        }

        snapshots.push({
            players,
            communityCards,
            pot,
            currentStreet,
            activePlayerIndex,
            visibleActions,
            lastAction
        });
    }

    return snapshots;
}
