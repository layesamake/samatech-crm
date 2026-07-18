import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './page';

vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

describe('Tableau de bord', () => {
  beforeEach(async () => {
    const { db } = await import('@/infrastructure/database/db');
    await db.delete(); await db.open();
  });

  it('explique l’état vide et propose la première action', async () => {
    render(<Home />);
    await waitFor(() => expect(screen.getByText('Votre activité commerciale commence ici')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Ajouter mon premier prospect' })).toHaveAttribute('href', '/prospects/nouveau');
    expect(screen.getByText(/restent sur cet appareil/)).toBeInTheDocument();
  });
});
