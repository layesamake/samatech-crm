import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { WhatsAppMessagePanel } from './WhatsAppMessagePanel';

describe('Préparation d’un message WhatsApp personnalisé', () => {
  beforeEach(async () => {
    await db.messageTemplates.clear();
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
