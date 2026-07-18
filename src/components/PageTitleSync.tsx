'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const TITLES: Array<[RegExp, string]> = [
  [/^\/$/, 'Tableau de bord'], [/^\/statistics/, 'Statistiques'], [/^\/prospects\/nouveau/, 'Nouveau prospect'], [/^\/prospects\/.+\/modifier/, 'Modifier le prospect'], [/^\/prospects\/.+/, 'Fiche prospect'], [/^\/prospects/, 'Prospects'],
  [/^\/clients\/.+/, 'Fiche client'], [/^\/clients/, 'Clients'], [/^\/catalog/, 'Catalogue'], [/^\/follow-ups\/new/, 'Nouvelle relance'], [/^\/follow-ups\/.+/, 'Relance'], [/^\/follow-ups/, 'Relances'],
  [/^\/message-templates/, 'Modèles de messages'], [/^\/campaigns\/new/, 'Nouvelle campagne'], [/^\/campaigns\/.+\/run/, 'Exécuter la campagne'], [/^\/campaigns\/.+/, 'Campagne'], [/^\/campaigns/, 'Campagnes'],
  [/^\/invoices\/new/, 'Nouvelle facture'], [/^\/invoices\/.+/, 'Facture'], [/^\/invoices/, 'Factures'], [/^\/payments/, 'Paiements'], [/^\/settings\/backup/, 'Sauvegarde'], [/^\/settings\/security/, 'Sécurité'], [/^\/settings/, 'Paramètres'], [/^\/dev-diagnostic/, 'Diagnostic'],
];

export default function PageTitleSync() {
  const pathname = usePathname();
  useEffect(() => {
    const label = TITLES.find(([pattern]) => pattern.test(pathname))?.[1] ?? 'Application';
    document.title = `${label} — SAMTECH CRM`;
  }, [pathname]);
  return null;
}

