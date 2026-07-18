import { describe, expect, it } from 'vitest';
import { MessageTemplateInputSchema, buildWhatsAppUrl, extractVariables, resolveMessage } from './message-template';

describe('Modèles et WhatsApp BR-080 à BR-084', () => {
  it('valide le nom, contenu, catégorie et extrait les variables sans doublon', () => {
    expect(MessageTemplateInputSchema.safeParse({ name: '', category: 'FOLLOW_UP', content: 'Bonjour' }).success).toBe(false);
    expect(MessageTemplateInputSchema.safeParse({ name: 'R', category: 'FOLLOW_UP', content: '' }).success).toBe(false);
    expect(extractVariables('{{prenom}} {{produit}} {{prenom}}')).toEqual(['prenom', 'produit']);
  });
  it('refuse une variable inconnue et signale une valeur absente', () => {
    expect(MessageTemplateInputSchema.safeParse({ name: 'R', category: 'FOLLOW_UP', content: '{{inconnue}}' }).success).toBe(false);
    expect(resolveMessage('Bonjour {{prenom}} — {{localite}}', { prenom: 'Awa' })).toEqual({ text: 'Bonjour Awa — {{localite}}', unresolved: ['localite'] });
    expect(resolveMessage('Bonjour {{prenom}} — {{localite}}', { prenom: 'Awa' }, true).text).toBe('Bonjour Awa — ');
  });
  it('résout plusieurs produits de manière déterministe sans interpréter le HTML', () => {
    const result = resolveMessage('<b>{{contact}}</b> : {{produit}}', { contact: 'Awa', produits: ['Audit', 'Conseil'] });
    expect(result.text).toBe('<b>Awa</b> : Audit, Conseil');
  });
  it('construit exactement le lien avec accents, apostrophe, unicode et retours à la ligne', () => {
    const url = buildWhatsAppUrl('+221 77-123-45-67', "Bonjour Awa, l'été ☀️\nÀ bientôt !");
    expect(url).toBe(`https://wa.me/221771234567?text=${encodeURIComponent("Bonjour Awa, l'été ☀️\nÀ bientôt !")}`);
    expect(() => buildWhatsAppUrl('', 'Bonjour')).toThrow(/invalide/);
    expect(() => buildWhatsAppUrl('javascript:alert(1)', 'Bonjour')).toThrow(/invalide/);
    expect(() => buildWhatsAppUrl('+221771234567', '   ')).toThrow(/vide/);
  });
  it('refuse une catégorie invalide', () => {
    expect(MessageTemplateInputSchema.safeParse({ name: 'R', category: 'INCONNUE', content: 'Bonjour' }).success).toBe(false);
  });
});
