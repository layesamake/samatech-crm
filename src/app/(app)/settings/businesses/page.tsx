'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBusiness } from '@/components/providers/BusinessProvider';
import { Loader2, Plus, Archive, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { masterDb } from '@/infrastructure/database/master-db';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function BusinessesSettings() {
  const { businesses, activeBusiness, switchBusiness, createBusiness, refreshBusinesses } = useBusiness();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [archiveCandidate, setArchiveCandidate] = useState<string | null>(null);

  const activeCount = businesses.filter(b => b.status !== 'archived').length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true); setError('');
    try {
      await createBusiness({ name: newName.trim() });
      setNewName('');
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (activeCount <= 1) {
      setError('Impossible d\'archiver le dernier espace actif.');
      return;
    }
    if (id === activeBusiness?.id) {
      setError('Impossible d\'archiver l\'espace actuellement sélectionné. Veuillez changer d\'espace d\'abord.');
      return;
    }
    setArchiveCandidate(id);
  };
  
  const confirmArchive = async () => {
    if (!archiveCandidate) return;
    setBusy(true); setError('');
    try {
      await masterDb.businesses.update(archiveCandidate, { status: 'archived' });
      await refreshBusinesses();
      setArchiveCandidate(null);
    } catch (err) {
      setError('Erreur lors de l\'archivage.');
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (id: string) => {
    setBusy(true); setError('');
    try {
      await masterDb.businesses.update(id, { status: 'active' });
      await refreshBusinesses();
    } catch (err) {
      setError('Erreur lors de la restauration.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 pt-4 px-4 sm:px-8">
      <PageHeader 
        title="Mes espaces professionnels" 
        description="Gérez les différentes entreprises et bases de données locales."
      />
      {error && <div className="p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20">{error}</div>}
      
      {!isCreating ? (
        <Button onClick={() => setIsCreating(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un espace
        </Button>
      ) : (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Créer un nouvel espace</CardTitle>
            <CardDescription>Une nouvelle base de données locale isolée sera créée.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'entreprise</Label>
                <Input 
                  id="name" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  autoFocus 
                  required 
                  disabled={busy} 
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={busy || !newName.trim()}>
                  {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Créer
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} disabled={busy}>Annuler</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 mt-6">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          Espaces actifs <span className="bg-secondary text-secondary-foreground text-xs rounded-full px-2 py-0.5">{activeCount}</span>
        </h3>
        {businesses.filter(b => b.status !== 'archived').map(b => (
          <Card key={b.id} className={b.id === activeBusiness?.id ? 'border-primary' : ''}>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 py-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">
                {b.logoBase64 ? (
                  <img src={b.logoBase64} alt={b.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  b.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {b.name}
                  {b.id === activeBusiness?.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </CardTitle>
                <CardDescription className="text-xs mt-1">Créé le {new Date(b.createdAt).toLocaleDateString()}</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {b.id !== activeBusiness?.id && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => switchBusiness(b.id)} disabled={busy}>Ouvrir</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleArchive(b.id)} disabled={busy || activeCount <= 1}>
                      <Archive className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Archiver</span>
                    </Button>
                  </>
                )}
                {b.id === activeBusiness?.id && (
                  <span className="text-sm text-primary font-medium px-3 py-1 bg-primary/10 rounded-full">Actif</span>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}

        {businesses.filter(b => b.status === 'archived').length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-lg text-muted-foreground mb-4">Espaces archivés</h3>
            <div className="space-y-4 opacity-70">
              {businesses.filter(b => b.status === 'archived').map(b => (
                <Card key={b.id} className="bg-muted/50 border-dashed">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 py-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base text-muted-foreground">{b.name}</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleRestore(b.id)} disabled={busy}>Restaurer</Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!archiveCandidate} onOpenChange={(open) => !open && setArchiveCandidate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmer l'archivage
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-3">
              <p>Êtes-vous sûr de vouloir archiver cet espace ?</p>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>L'espace n'apparaîtra plus dans le menu principal.</li>
                <li><strong>Aucune donnée ne sera supprimée</strong> de votre appareil.</li>
                <li>Vous pourrez restaurer cet espace à tout moment depuis cette page.</li>
              </ul>
              <div className="bg-amber-500/10 text-amber-900 dark:text-amber-400 p-3 rounded-md text-sm mt-2 border border-amber-500/20">
                <strong>Conseil :</strong> Pensez à faire une sauvegarde de cet espace depuis les paramètres avant de l'archiver si vous prévoyez de le désinstaller plus tard.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setArchiveCandidate(null)} disabled={busy}>Annuler</Button>
            <Button variant="destructive" onClick={confirmArchive} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Oui, archiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
