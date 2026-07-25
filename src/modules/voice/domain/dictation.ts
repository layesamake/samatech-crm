export function applyDictation(currentValue: string, transcript: string, mode: 'REPLACE' | 'APPEND' = 'REPLACE'): string {
  const value = transcript.trim().replace(/\s+/g, ' ');
  if (!value) return currentValue;
  if (mode === 'REPLACE' || !currentValue.trim()) return value;
  return `${currentValue.trim()} ${value}`;
}
