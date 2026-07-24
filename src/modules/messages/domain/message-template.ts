import { z } from 'zod';

export const MESSAGE_CATEGORIES = ['FIRST_CONTACT', 'FOLLOW_UP', 'QUOTE', 'PROMOTION', 'LOYALTY', 'PAYMENT', 'OTHER'] as const;
export const ALLOWED_MESSAGE_VARIABLES = ['prenom', 'nom', 'contact', 'entreprise', 'produit', 'localite', 'nom_entreprise'] as const;
export type MessageVariable = typeof ALLOWED_MESSAGE_VARIABLES[number];

export const MESSAGE_CATEGORY_LABELS: Record<typeof MESSAGE_CATEGORIES[number], string> = {
  FIRST_CONTACT: 'Premier contact',
  FOLLOW_UP: 'Relance',
  QUOTE: 'Devis',
  PROMOTION: 'Promotion',
  LOYALTY: 'Fidélisation',
  PAYMENT: 'Paiement',
  OTHER: 'Autre',
};

export interface MessageTemplateRecord {
  id: string; name: string; category: typeof MESSAGE_CATEGORIES[number]; content: string; variables: string[];
  attachment?: { name: string; type: string; data: string };
  isActive: boolean; createdAt: string; updatedAt: string; archivedAt?: string;
}

export function extractVariables(content: string): string[] {
  return [...new Set(Array.from(content.matchAll(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g), (match) => match[1]))];
}
export const MessageTemplateInputSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire'),
  category: z.enum(MESSAGE_CATEGORIES),
  content: z.string().trim().min(1, 'Le contenu est obligatoire'),
  attachment: z.object({
    name: z.string(),
    type: z.string(),
    data: z.string() // base64 string
  }).optional(),
}).superRefine((value, context) => {
  const unknownVariables = extractVariables(value.content).filter((variable) => !ALLOWED_MESSAGE_VARIABLES.includes(variable as MessageVariable));
  if (unknownVariables.length) context.addIssue({ code: 'custom', path: ['content'], message: `Variables inconnues : ${unknownVariables.join(', ')}` });
});
export type MessageTemplateInput = z.infer<typeof MessageTemplateInputSchema>;

export interface MessageResolutionContext {
  prenom?: string; nom?: string; contact?: string; entreprise?: string; produits?: string[]; localite?: string; nomEntreprise?: string;
}
export interface MessageResolution { text: string; unresolved: MessageVariable[]; }
export function resolveMessage(content: string, values: MessageResolutionContext, allowEmpty = false): MessageResolution {
  const map: Record<MessageVariable, string | undefined> = {
    prenom: values.prenom, nom: values.nom, contact: values.contact, entreprise: values.entreprise,
    produit: values.produits?.filter(Boolean).join(', '), localite: values.localite, nom_entreprise: values.nomEntreprise,
  };
  const unresolved: MessageVariable[] = [];
  const text = content.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (token, variable: string) => {
    if (!ALLOWED_MESSAGE_VARIABLES.includes(variable as MessageVariable)) return token;
    const value = map[variable as MessageVariable];
    if (!value) { unresolved.push(variable as MessageVariable); return allowEmpty ? '' : token; }
    return value;
  });
  return { text, unresolved: [...new Set(unresolved)] };
}

export function buildWhatsAppUrl(normalizedPhone: string, message: string): string {
  const phone = normalizedPhone.replace(/\D/g, '');
  if (phone.length < 8) throw new Error('Numéro WhatsApp invalide ou absent');
  if (!message.trim()) throw new Error('Le message WhatsApp est vide');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
