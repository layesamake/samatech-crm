export interface VoiceNavigationCommand {
  href: string;
  label: string;
}

const commands: Array<{ href: string; label: string; phrases: string[] }> = [
  { href: '/prospects/nouveau', label: 'Nouveau prospect', phrases: ['nouveau prospect', 'ajouter un prospect', 'creer un prospect'] },
  { href: '/invoices/new', label: 'Nouvelle facture', phrases: ['nouvelle facture', 'creer une facture', 'ajouter une facture'] },
  { href: '/follow-ups/new', label: 'Nouvelle relance', phrases: ['nouvelle relance', 'ajouter une relance', 'creer une relance'] },
  { href: '/', label: 'Accueil', phrases: ['accueil', 'tableau de bord'] },
  { href: '/prospects', label: 'Prospects', phrases: ['prospects', 'liste des prospects'] },
  { href: '/clients', label: 'Clients', phrases: ['clients', 'liste des clients'] },
  { href: '/invoices', label: 'Factures', phrases: ['factures', 'liste des factures'] },
  { href: '/payments', label: 'Paiements', phrases: ['paiements', 'paiement'] },
  { href: '/follow-ups', label: 'Relances', phrases: ['relances', 'relance'] },
  { href: '/treasury', label: 'Trésorerie', phrases: ['tresorerie'] },
  { href: '/catalog', label: 'Catalogue', phrases: ['catalogue', 'produits'] },
  { href: '/settings', label: 'Paramètres', phrases: ['parametres', 'reglages'] },
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseVoiceCommand(transcript: string): VoiceNavigationCommand | null {
  const normalized = normalize(transcript);
  if (!normalized) return null;
  const command = commands.find((item) => item.phrases.some((phrase) => normalized.includes(phrase)));
  return command ? { href: command.href, label: command.label } : null;
}

export const voiceCommandExamples = ['Accueil', 'Prospects', 'Nouveau prospect', 'Clients', 'Factures', 'Nouvelle facture', 'Relances', 'Paiements', 'Paramètres'];
