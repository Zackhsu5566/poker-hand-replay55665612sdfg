import { useState, useCallback, useRef } from 'react';

interface UseClipboardReturn {
    copy: (text: string) => Promise<boolean>;
    copied: boolean;
    error: string | null;
    reset: () => void;
}

export function useClipboard(): UseClipboardReturn {
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const reset = useCallback(() => {
        setCopied(false);
        setError(null);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const copy = useCallback(async (text: string): Promise<boolean> => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setError(null);

        try {
            // Try the modern Clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                timeoutRef.current = setTimeout(() => {
                    setCopied(false);
                }, 2000);
                return true;
            }

            // Fallback for older browsers using execCommand
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                setCopied(true);
                timeoutRef.current = setTimeout(() => {
                    setCopied(false);
                }, 2000);
                return true;
            } else {
                setError('Failed to copy to clipboard');
                return false;
            }
        } catch (err) {
            setError('Clipboard access denied');
            return false;
        }
    }, []);

    return { copy, copied, error, reset };
}
