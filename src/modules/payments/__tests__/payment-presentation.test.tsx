import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PaymentsPage from '@/app/(app)/payments/page';
import NewPaymentForm from '@/modules/payments/presentation/NewPaymentForm';

vi.mock('next/link', () => ({
  default: ({ children, href, className, 'aria-label': ariaLabel }: { children: React.ReactNode; href: string; className?: string; 'aria-label'?: string }) => (
    <a href={href} className={className} aria-label={ariaLabel}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue('') }),
}));

vi.mock('@/modules/treasury/application/manage-treasury-accounts', () => ({
  ManageTreasuryAccountsUseCase: class {
    listAccountsWithBalance = vi.fn().mockResolvedValue([]);
  },
}));

vi.mock('@/modules/treasury/application/allocate-treasury-sources', () => ({
  AllocateTreasurySourcesUseCase: class {
    allocate = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('@/modules/payments/application/manage-payments', () => {
  return {
    ManagePaymentsUseCase: class {
      list = vi.fn().mockResolvedValue([]);
      receivables = vi.fn().mockResolvedValue([]);
    },
  };
});

describe('PaymentsPage', () => {
  it('affiche uniquement la liste des paiements sans les onglets et avec le bouton FAB', async () => {
    render(<PaymentsPage />);

    expect(screen.getByText('Paiements')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Liste des paiements' })).toBeInTheDocument();

    // Vérifie que les onglets de créances ne sont pas affichés
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByText('Créances')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Indicateurs d’encaissement' })).not.toBeInTheDocument();

    // Vérifie la présence du bouton FAB
    const fab = screen.getByRole('link', { name: 'Ajouter un nouveau paiement' });
    expect(fab).toBeInTheDocument();
    expect(fab).toHaveAttribute('href', '/payments/new');
  });
});

describe('NewPaymentForm', () => {
  it('affiche le formulaire de création d’un paiement et un message en l’absence de facture impayée', async () => {
    render(<NewPaymentForm />);

    expect(screen.getByText('Nouveau paiement')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Aucune facture en attente de paiement.')).toBeInTheDocument();
    });
  });
});
