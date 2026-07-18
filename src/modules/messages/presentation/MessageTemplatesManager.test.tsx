import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import MessageTemplatesManager from './MessageTemplatesManager';

describe('Écran des modèles de messages', () => {
  beforeEach(async () => db.messageTemplates.clear());

  it('crée et prévisualise un modèle comme texte', async () => {
    render(<MessageTemplatesManager />);
    fireEvent.change(screen.getByLabelText('Nom du modèle'), { target: { value: 'Relance composant' } });
    fireEvent.change(screen.getByLabelText('Contenu du modèle'), { target: { value: 'Bonjour {{prenom}} <b>texte</b>' } });
    expect(screen.getAllByText('Bonjour {{prenom}} <b>texte</b>')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Créer le modèle' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Modèle créé avec succès'));
    expect(await db.messageTemplates.count()).toBe(1);
    expect(document.querySelector('b')).toBeNull();
  });

  it('affiche l’erreur d’une variable inconnue', async () => {
    render(<MessageTemplatesManager />);
    fireEvent.change(screen.getByLabelText('Nom du modèle'), { target: { value: 'Invalide' } });
    fireEvent.change(screen.getByLabelText('Contenu du modèle'), { target: { value: '{{secret}}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le modèle' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Variables inconnues'));
    expect(await db.messageTemplates.count()).toBe(0);
  });
});
