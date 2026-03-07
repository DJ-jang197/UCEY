export function logApiRequest(method: string, path: string, meta?: unknown) {
  const timestamp = new Date().toISOString();
  if (meta) {
    console.info(`[api] ${timestamp} ${method} ${path}`, meta);
    return;
  }
  console.info(`[api] ${timestamp} ${method} ${path}`);
}
