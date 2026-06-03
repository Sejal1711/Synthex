interface LogEntry {
  timestamp: string;
  traceId: string;
  level: "info" | "warn" | "error";
  method?: string;
  path?: string;
  status?: number;
  message?: string;
  error?: unknown;
  [key: string]: unknown;
}

function log(entry: LogEntry) {
  console.log(JSON.stringify(entry));
}

export const logger = {
  info: (traceId: string, data: Omit<LogEntry, "timestamp" | "traceId" | "level">) =>
    log({ timestamp: new Date().toISOString(), traceId, level: "info", ...data }),

  warn: (traceId: string, data: Omit<LogEntry, "timestamp" | "traceId" | "level">) =>
    log({ timestamp: new Date().toISOString(), traceId, level: "warn", ...data }),

  error: (traceId: string, data: Omit<LogEntry, "timestamp" | "traceId" | "level">) =>
    log({ timestamp: new Date().toISOString(), traceId, level: "error", ...data }),
};
