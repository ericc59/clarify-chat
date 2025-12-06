export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerOptions {
	name?: string;
	level?: LogLevel;
	pretty?: boolean;
}

interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: string;
	name?: string;
	data?: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

const COLORS: Record<LogLevel, string> = {
	debug: "\x1b[36m", // cyan
	info: "\x1b[32m", // green
	warn: "\x1b[33m", // yellow
	error: "\x1b[31m", // red
};

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

function getLogLevel(): LogLevel {
	const env = process.env.LOG_LEVEL?.toLowerCase();
	if (env && env in LOG_LEVELS) {
		return env as LogLevel;
	}
	return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
	return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function formatPretty(entry: LogEntry): string {
	const color = COLORS[entry.level];
	const levelStr = entry.level.toUpperCase().padEnd(5);
	const name = entry.name ? `${DIM}[${entry.name}]${RESET} ` : "";
	const timestamp = `${DIM}${entry.timestamp}${RESET}`;
	const data =
		entry.data !== undefined ? `\n${JSON.stringify(entry.data, null, 2)}` : "";

	return `${timestamp} ${color}${levelStr}${RESET} ${name}${entry.message}${data}`;
}

function formatJson(entry: LogEntry): string {
	return JSON.stringify({
		...entry,
		data: entry.data,
	});
}

export class Logger {
	private name?: string;
	private level: LogLevel;
	private pretty: boolean;

	constructor(options: LoggerOptions = {}) {
		this.name = options.name;
		this.level = options.level ?? getLogLevel();
		this.pretty = options.pretty ?? process.env.NODE_ENV !== "production";
	}

	private log(level: LogLevel, message: string, data?: unknown): void {
		if (!shouldLog(level, this.level)) return;

		const entry: LogEntry = {
			level,
			message,
			timestamp: new Date().toISOString(),
			name: this.name,
			data,
		};

		const output = this.pretty ? formatPretty(entry) : formatJson(entry);

		switch (level) {
			case "error":
				console.error(output);
				break;
			case "warn":
				console.warn(output);
				break;
			default:
				console.log(output);
		}
	}

	debug(message: string, data?: unknown): void {
		this.log("debug", message, data);
	}

	info(message: string, data?: unknown): void {
		this.log("info", message, data);
	}

	warn(message: string, data?: unknown): void {
		this.log("warn", message, data);
	}

	error(message: string, data?: unknown): void {
		this.log("error", message, data);
	}

	child(name: string): Logger {
		const childName = this.name ? `${this.name}:${name}` : name;
		return new Logger({
			name: childName,
			level: this.level,
			pretty: this.pretty,
		});
	}
}

export const logger = new Logger();

export function createLogger(
	name: string,
	options?: Omit<LoggerOptions, "name">,
): Logger {
	return new Logger({ name, ...options });
}
