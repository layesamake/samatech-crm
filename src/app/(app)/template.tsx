'use client';

import { ReactNode } from 'react';

export default function AppTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="animate-in fade-in duration-200 ease-out min-h-full">
      {children}
    </div>
  );
}
