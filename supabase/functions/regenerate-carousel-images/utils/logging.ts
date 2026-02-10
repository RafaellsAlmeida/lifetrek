/**
 * Logging utilities for Edge Function
 * Captures logs for UI display while maintaining console output
 * 
 * @module utils/logging
 */

/** Internal log storage */
const __regenLogs: string[] = [];

/**
 * Stringify any value for logging
 */
const stringify = (v: unknown): string => {
    if (typeof v === "string") return v;
    try {
        return JSON.stringify(v);
    } catch {
        return String(v);
    }
};

/**
 * Record a log entry
 */
const record = (level: "info" | "warn" | "error", args: unknown[]): void => {
    __regenLogs.push(`[${level}] ${args.map(stringify).join(" ")}`);
};

// Store original console methods
const _log = console.log.bind(console);
const _warn = console.warn.bind(console);
const _error = console.error.bind(console);

/**
 * Initialize log capture by overriding console methods
 * Call this at the start of request handling
 */
export function initLogging(): void {
    __regenLogs.length = 0;

    console.log = (...args: unknown[]) => {
        record("info", args);
        _log(...args);
    };

    console.warn = (...args: unknown[]) => {
        record("warn", args);
        _warn(...args);
    };

    console.error = (...args: unknown[]) => {
        record("error", args);
        _error(...args);
    };
}

/**
 * Get all captured logs
 */
export function getLogs(): string[] {
    return [...__regenLogs];
}

/**
 * Clear log buffer
 */
export function clearLogs(): void {
    __regenLogs.length = 0;
}
