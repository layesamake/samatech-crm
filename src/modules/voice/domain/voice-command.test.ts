import { describe, expect, it } from 'vitest';
import { parseVoiceCommand } from './voice-command';

describe('commandes vocales', () => {
  it('reconnaît les commandes de navigation en français, avec ou sans accents', () => {
    expect(parseVoiceCommand('ouvre les paramètres')).toEqual({ href: '/settings', label: 'Paramètres' });
    expect(parseVoiceCommand('nouveau prospect')).toEqual({ href: '/prospects/nouveau', label: 'Nouveau prospect' });
    expect(parseVoiceCommand('affiche la trésorerie')).toEqual({ href: '/treasury', label: 'Trésorerie' });
  });

  it('ignore une commande inconnue', () => {
    expect(parseVoiceCommand('envoie le reçu à Fatou')).toBeNull();
  });
});
