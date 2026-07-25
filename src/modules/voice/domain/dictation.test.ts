import { describe, expect, it } from 'vitest';
import { applyDictation } from './dictation';

describe('dictée de formulaire', () => {
  it('remplace la valeur du champ et normalise les espaces', () => {
    expect(applyDictation('Ancienne valeur', '  Fatou   Fall  ')).toBe('Fatou Fall');
  });

  it('ajoute la dictée aux notes sans perdre le texte existant', () => {
    expect(applyDictation('À rappeler demain.', 'Prépare une proposition.', 'APPEND')).toBe('À rappeler demain. Prépare une proposition.');
  });
});
