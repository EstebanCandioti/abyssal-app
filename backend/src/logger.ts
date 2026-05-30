type LogMeta = Record<string, unknown>;

function serialize(meta?: unknown) {
  if (!meta) {
    return '';
  }

  if (meta instanceof Error) {
    return JSON.stringify({ name: meta.name, message: meta.message, stack: meta.stack });
  }

  return JSON.stringify(meta);
}

function write(level: 'info' | 'warn' | 'error', message: string, meta?: unknown) {
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;
  const details = serialize(meta);

  if (level === 'error') {
    console.error(line, details);
    return;
  }

  if (level === 'warn') {
    console.warn(line, details);
    return;
  }

  console.info(line, details);
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    write('info', message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    write('warn', message, meta);
  },
  error(message: string, error?: unknown) {
    write('error', message, error);
  }
};
