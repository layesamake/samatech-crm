import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import CompanySettingsForm from './CompanySettingsForm';

describe('Paramètres de l’entreprise', () => {
  beforeEach(async () => db.settings.clear());

  it('affiche une action explicite et enregistre les paramètres', async () => {
    render(<CompanySettingsForm />);
    const saveButton = await screen.findByRole('button', { name: /Enregistrer les paramètres de l’entreprise/i });

    fireEvent.change(screen.getByLabelText("Nom de l'entreprise *"), { target: { value: 'SAMTECH' } });
    fireEvent.change(screen.getByLabelText('Téléphone *'), { target: { value: '+221770000000' } });
    fireEvent.click(saveButton);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Paramètres enregistrés avec succès'));
    expect((await db.settings.get('company.profile'))?.value).toMatchObject({ name: 'SAMTECH', phone: '+221770000000' });
  });
});
