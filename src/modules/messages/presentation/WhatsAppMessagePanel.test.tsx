import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { WhatsAppMessagePanel } from './WhatsAppMessagePanel';

describe('Préparation d’un message WhatsApp personnalisé', () => {
  beforeEach(async () => {
    await db.transaction('rw', [db.messageTemplates, db.contacts, db.prospectProfiles], async () => Promise.all([
      db.messageTemplates.clear(),
      db.contacts.clear(),
      db.prospectProfiles.clear(),
    ]));
  });

  it('sélectionne automatiquement le premier modèle actif et active le lien', async () => {
    const now = '2026-07-19T12:00:00.000Z';
    await db.contacts.add({ id: 'contact-1', displayName: 'Awa Ndiaye', firstName: 'Awa', whatsappPhone: '+221771234567', normalizedWhatsappPhone: '+221771234567', createdAt: now, updatedAt: now });
    await db.prospectProfiles.add({ id: crypto.randomUUID(), contactId: 'contact-1', status: 'CONVERTI', interestLevel: 'CHAUD', firstContactDate: '2026-07-01', lastStatusChangedAt: now, createdAt: now, updatedAt: now });
    await db.messageTemplates.add({ id: crypto.randomUUID(), name: 'Remerciement achat', category: 'LOYALTY', content: 'Merci {{prenom}} pour votre achat.', variables: ['prenom'], isActive: true, createdAt: now, updatedAt: now });

    render(<WhatsAppMessagePanel contactId="contact-1" normalizedPhone="+221771234567" displayName="Awa Ndiaye" />);
    fireEvent.click(screen.getByRole('button', { name: 'Message WhatsApp' }));

    const link = await screen.findByRole('link', { name: 'Ouvrir dans WhatsApp' });
    await waitFor(() => expect(link).toHaveAttribute('href', `https://wa.me/221771234567?text=${encodeURIComponent('Merci Awa pour votre achat.')}`));
    expect(screen.getByLabelText('Message WhatsApp pour Awa Ndiaye')).toHaveValue('Merci Awa pour votre achat.');
  });

  it('ouvre WhatsApp avec le message libre encodé et laisse l’envoi à l’utilisateur', async () => {
    render(<WhatsAppMessagePanel contactId="contact-1" normalizedPhone="+221 77 123 45 67" displayName="Awa Ndiaye" />);
    fireEvent.click(screen.getByRole('button', { name: 'Message WhatsApp' }));
    fireEvent.click(screen.getByRole('button', { name: 'Message libre' }));
    fireEvent.change(screen.getByLabelText('Message WhatsApp pour Awa Ndiaye'), {
      target: { value: 'Bonjour Awa, votre commande est prête.' },
    });
    const link = screen.getByRole('link', { name: 'Ouvrir dans WhatsApp' });
    expect(link).toHaveAttribute('href', `https://wa.me/221771234567?text=${encodeURIComponent('Bonjour Awa, votre commande est prête.')}`);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
