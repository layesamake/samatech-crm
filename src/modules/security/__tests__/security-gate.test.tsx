import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { ManageSecurityUseCase } from '../application/manage-security';
import { DexieSecurityRepository } from '../infrastructure/dexie-security-repository';
import SecurityGate, { useSecuritySession } from '../presentation/SecurityGate';

const useCase = new ManageSecurityUseCase(new DexieSecurityRepository());

function SensitiveArea() {
  const session = useSecuritySession();
  return <div><p>Donnée commerciale secrète</p><button onClick={session.lockNow}>Verrouiller</button></div>;
}

describe('Écran global verrouillé', () => {
  beforeEach(async () => { db.close(); await db.delete(); await db.open(); await db.contacts.add({ id: 'c1', displayName: 'Secret', whatsappPhone: '+221770000000', normalizedWhatsappPhone: '+221770000000', source: 'OTHER', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); });

  it('masque réellement les enfants au chargement, déverrouille puis reverrouille manuellement', async () => {
    await useCase.enable('2486', '2486');
    render(<SecurityGate><SensitiveArea /></SecurityGate>);
    expect(await screen.findByTestId('locked-screen')).toBeInTheDocument();
    expect(screen.queryByText('Donnée commerciale secrète')).not.toBeInTheDocument();
    fireEvent.change(screen.getByTestId('unlock-pin'), { target: { value: '2486' } });
    fireEvent.click(screen.getByTestId('unlock-submit'));
    expect(await screen.findByText('Donnée commerciale secrète')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Verrouiller'));
    expect(await screen.findByTestId('locked-screen')).toBeInTheDocument();
    expect(screen.queryByText('Donnée commerciale secrète')).not.toBeInTheDocument();
  });

  it('reste verrouillé après remontage et exige la phrase exacte avant effacement', async () => {
    await useCase.enable('2486', '2486');
    const first = render(<SecurityGate><SensitiveArea /></SecurityGate>);
    expect(await screen.findByTestId('locked-screen')).toBeInTheDocument();
    first.unmount();
    render(<SecurityGate><SensitiveArea /></SecurityGate>);
    expect(await screen.findByTestId('locked-screen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('PIN oublié'));
    fireEvent.change(screen.getByTestId('forgot-phrase'), { target: { value: 'EFFACER' } });
    expect(screen.getByTestId('forgot-confirm')).toBeDisabled();
    expect(await db.contacts.count()).toBe(1);
    fireEvent.change(screen.getByTestId('forgot-phrase'), { target: { value: 'EFFACER MES DONNÉES' } });
    fireEvent.click(screen.getByTestId('forgot-confirm'));
    await waitFor(async () => expect(await db.contacts.count()).toBe(0));
    expect(await db.securitySettings.count()).toBe(0);
  });
});
