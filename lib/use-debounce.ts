import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing values with optional callback support
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @param callback - Optional callback function to execute when debounced value changes
 * @returns The debounced value
 */
export function useDebounce<T>(
    value: T,
    delay: number = 300,
    callback?: (debouncedValue: T) => void
): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    const callbackRef = useRef(callback);

    // Keep callback ref current to avoid stale closures
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedValue(value);

            // Execute callback if provided
            if (callbackRef.current) {
                callbackRef.current(value);
            }
        }, delay);

        // Cleanup timeout on value or delay change
        return () => clearTimeout(timeoutId);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Alternative hook that provides both immediate and debounced values
 * Useful when you need to show immediate feedback but perform actions on debounced value
 */
export function useDebouncedState<T>(
    initialValue: T,
    delay: number = 300
): [T, T, (value: T) => void] {
    const [immediateValue, setImmediateValue] = useState<T>(initialValue);
    const debouncedValue = useDebounce(immediateValue, delay);

    return [immediateValue, debouncedValue, setImmediateValue];
}

/**
 * Hook for debouncing callback functions (useful for API calls)
 *
 * @param callback - Function to debounce
 * @param delay - Debounce delay in milliseconds
 * @param deps - Dependencies array for the callback
 * @returns Debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
    deps: React.DependencyList = []
): T {
    const timeoutRef = useRef<NodeJS.Timeout>();

    const debouncedCallback = useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [delay, ...deps]) as T;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedCallback;
}