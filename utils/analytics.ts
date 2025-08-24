export function track(name: string, payload?: Record<string, any>) {
  // Demo analytics: log to console
  if (payload) console.log(`[analytics] ${name}`, payload);
  else console.log(`[analytics] ${name}`);
}


