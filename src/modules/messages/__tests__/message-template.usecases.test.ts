import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { ManageMessageTemplatesUseCase } from '../application/manage-message-templates';

describe('Cas d’usage modèles Sprint 3', () => {
  const useCase = new ManageMessageTemplatesUseCase();
  beforeEach(async () => db.messageTemplates.clear());
  it('crée, modifie, duplique et archive sans suppression physique', async () => {
    const item = await useCase.create({ name: 'Relance', category: 'FOLLOW_UP', content: 'Bonjour {{prenom}}' });
    expect(item.variables).toEqual(['prenom']);
    const updated = await useCase.update(item.id, { name: 'Relance 2', category: 'FOLLOW_UP', content: '{{contact}}' });
    const copy = await useCase.duplicate(updated.id); expect(copy.name).toContain('copie');
    await useCase.archive(updated.id);
    expect(await useCase.getActive()).toHaveLength(1);
    expect((await useCase.get(updated.id))?.archivedAt).toBeDefined();
  });
});
