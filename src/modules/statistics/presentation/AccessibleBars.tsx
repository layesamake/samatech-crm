import type { ReactNode } from 'react';

export interface BarDatum { label: string; value: number | string; display?: ReactNode; }

function toBigInt(value: number | string): bigint {
  try { return BigInt(value); } catch { return BigInt(0); }
}

export function AccessibleBars({ title, items, emptyLabel = 'Aucune donnée sur la période.' }: { title: string; items: BarDatum[]; emptyLabel?: string }) {
  if (!items.length || items.every((item) => toBigInt(item.value) === BigInt(0))) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  const maximum = items.reduce((max, item) => { const value = toBigInt(item.value); return value > max ? value : max; }, BigInt(1));
  return (
    <div className="space-y-3">
      <div role="img" aria-label={title} className="space-y-2">
        {items.map((item) => {
          const width = Number((toBigInt(item.value) * BigInt(100)) / maximum);
          return <div key={item.label} className="grid grid-cols-[minmax(7rem,1fr)_2fr_auto] items-center gap-2 text-sm">
            <span className="truncate" title={item.label}>{item.label}</span>
            <span className="h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true"><span className="block h-full rounded-full bg-blue-600" style={{ width: `${Math.max(width, 2)}%` }} /></span>
            <strong className="tabular-nums">{item.display ?? String(item.value)}</strong>
          </div>;
        })}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Alternative textuelle</summary>
        <ul className="mt-2 space-y-1">
          {items.map((item) => <li key={item.label} className="flex justify-between gap-4"><span>{item.label}</span><strong>{item.display ?? String(item.value)}</strong></li>)}
        </ul>
      </details>
    </div>
  );
}
