import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './page';

vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

describe('Tableau de bord', () => {
  beforeEach(async () => {
    const { db } = await import('@/infrastructure/database/db');
    await db.delete(); await db.open();
  });

  it('guide une nouvelle entreprise vers son premier prospect', async () => {
    render(<Home />);
    expect(await screen.findByRole('heading', { name: 'Commencez votre suivi commercial' }, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ajouter un prospect' })).toHaveAttribute('href', '/prospects/nouveau');
  });

  it('évite les indicateurs financiers vides sur un nouvel espace', async () => {
    render(<Home />);
    await screen.findByRole('heading', { name: 'Commencez votre suivi commercial' }, { timeout: 3000 });
    expect(document.body).not.toHaveTextContent('0 XOF');
  });
});
