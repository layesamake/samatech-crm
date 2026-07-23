'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { opportunityUseCases } from '@/modules/opportunities/application/opportunity.usecases';
import { OPPORTUNITY_STAGES, OpportunityStage } from '@/modules/opportunities/domain/opportunity';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, DollarSign, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMinor } from '@/modules/invoices/domain/invoice';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OpportunityListProps {
  contactId: string;
}

export function OpportunityList({ contactId }: OpportunityListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<OpportunityStage>('NOUVEAU');
  
  const opportunities = useLiveQuery(
    () => opportunityUseCases.getContactOpportunities(contactId),
    [contactId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Le titre est requis');
      return;
    }
    
    try {
      await opportunityUseCases.createOpportunity({
        contactId,
        title,
        valueMinor: value ? parseInt(value) * 100 : undefined,
        stage,
      });
      // alert('Opportunité créée');
      setIsOpen(false);
      setTitle('');
      setValue('');
      setStage('NOUVEAU');
    } catch (err) {
      alert('Erreur lors de la création');
    }
  };

  if (!opportunities) {
    return <div className="text-sm text-muted-foreground p-4">Chargement des opportunités...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" /> Opportunités
        </h2>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-1">
              <Plus className="w-4 h-4" /> Créer
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle Opportunité</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Titre</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Devis refonte site web" required />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Montant (XOF)</label>
                <Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="Ex: 500000" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Étape</label>
                <Select value={stage} onValueChange={(v) => setStage(v as OpportunityStage)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une étape" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPPORTUNITY_STAGES.filter(s => s !== 'GAGNE' && s !== 'PERDU').map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {opportunities.length === 0 ? (
        <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg border border-dashed text-center">
          Aucune opportunité pour ce contact.
        </p>
      ) : (
        <div className="grid gap-3">
          {opportunities.map(opp => (
            <Card key={opp.id} className="overflow-hidden">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm">{opp.title}</div>
                  <Badge variant={opp.status === 'WON' ? 'default' : opp.status === 'LOST' ? 'destructive' : 'secondary'}>
                    {opp.stage}
                  </Badge>
                </div>
                {opp.valueMinor !== undefined && (
                  <div className="flex items-center gap-1 text-sm font-medium text-primary">
                    <DollarSign className="w-3.5 h-3.5" />
                    {formatMinor(opp.valueMinor, opp.currency || 'XOF', 0)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
