import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './page';

vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

describe('Tableau de bord', () => {
  beforeEach(async () => {
    const { db } = await import('@/infrastructure/database/db');
    await db.delete(); await db.open();
  });

  it('affiche le tableau de bord', async () => {
    render(<Home />);
    expect(await screen.findByText('Bienvenue sur SAMTECH CRM', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
