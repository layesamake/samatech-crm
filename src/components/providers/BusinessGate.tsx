'use client';

import React, { useState } from 'react';
import { useBusiness } from './BusinessProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Building2, AlertTriangle } from 'lucide-react';

export function BusinessGate({ children }: { children: React.ReactNode }) {
  const { status, businesses, createBusiness, switchBusiness } = useBusiness();
  const [newBusinessName, setNewBusinessName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (status === 'INITIALIZING') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Initialisation de votre espace...</p>
      </div>
    );
  }

  if (status === 'ERROR') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erreur</CardTitle>
            <CardDescription>Impossible de charger le système multi-business.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.reload()}>Réessayer</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (status === 'RESTORE_INTERRUPTED') {
    const handleClearRestore = () => {
      localStorage.removeItem('samtech_restore_in_progress');
      window.location.reload();
    };

    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-4 bg-muted/50">
        <Card className="w-full max-w-lg shadow-lg border-destructive/50">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-destructive/10 w-12 h-12 flex items-center justify-center rounded-full mb-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">Restauration interrompue</CardTitle>
            <CardDescription className="text-base text-foreground mt-2">
              Une restauration globale a été brutalement interrompue avant de pouvoir se terminer.
              Vos anciennes données sont toujours sécurisées, mais des bases partielles ont pu être créées.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground text-center">
            Vous devriez vérifier l'intégrité de vos espaces dans les paramètres, ou relancer la restauration globale si nécessaire.
          </CardContent>
          <CardFooter className="flex flex-col gap-2 mt-4">
            <Button onClick={handleClearRestore} className="w-full" variant="destructive">
              Effacer l'erreur et redémarrer
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (status === 'NO_BUSINESS') {
    const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBusinessName.trim()) return;
      setIsCreating(true);
      try {
        await createBusiness({ name: newBusinessName.trim() });
      } catch (err) {
        console.error(err);
        setIsCreating(false);
      }
    };

    return (
      <div className="flex h-screen w-full items-center justify-center p-4 bg-muted/50">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-primary/10 w-12 h-12 flex items-center justify-center rounded-full mb-2">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Bienvenue dans SAMTECH CRM</CardTitle>
            <CardDescription>Créez votre premier espace professionnel pour commencer.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Nom de votre entreprise"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  disabled={isCreating}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={isCreating || !newBusinessName.trim()}>
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Créer mon espace
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'BUSINESS_SELECTION_REQUIRED') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-4 bg-muted/50">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Choisissez votre espace</h1>
            <p className="text-muted-foreground">Sélectionnez l'entreprise à ouvrir</p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {businesses.filter(b => b.status !== 'archived').map((business) => (
              <Card 
                key={business.id} 
                className="cursor-pointer hover:border-primary transition-colors hover:shadow-md"
                onClick={() => switchBusiness(business.id)}
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">
                    {business.logoBase64 ? (
                      <img src={business.logoBase64} alt={business.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      business.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{business.name}</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // status === 'READY'
  return <>{children}</>;
}
