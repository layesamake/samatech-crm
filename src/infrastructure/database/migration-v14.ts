import Dexie from 'dexie';

export async function migrateToV14(db: Dexie) {
  // Rien de spécifique à faire sur les anciennes tables pour la création de la table 'opportunities'.
  // Dexie se chargera de créer la nouvelle table définie dans le stores() du constructor.
  return Promise.resolve();
}
