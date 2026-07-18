<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Règles SAMTECH CRM

- Lire les documents dans `DOCS` avant une modification importante.
- Respecter l'architecture présentation/application/domaine/infrastructure.
- Garder les règles métier hors des composants React.
- Accéder à Dexie.js par les dépôts et cas d'usage.
- Utiliser des transactions pour les écritures multi-tables.
- Conserver une représentation monétaire exacte.
- Ne pas ajouter de backend, cloud, licence, multi-utilisateur, API WhatsApp Business ou IA dans la V1.
- Ajouter les tests et exécuter lint, TypeScript, tests et build.
- Vérifier le mobile-first et le mode hors ligne.
- Préserver les changements existants.
- Ne faire aucun commit, push ou déploiement sans autorisation.
