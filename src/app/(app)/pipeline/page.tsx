'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/infrastructure/database/db';
import { OPPORTUNITY_STAGES, OpportunityStage } from '@/modules/opportunities/domain/opportunity';
import { opportunityUseCases } from '@/modules/opportunities/application/opportunity.usecases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, ArrowLeft, MoreVertical, DollarSign, Briefcase } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatMinor } from '@/modules/invoices/domain/invoice';
import Link from 'next/link';

export default function PipelinePage() {
  const [movingId, setMovingId] = useState<string | null>(null);

  const opportunities = useLiveQuery(
    () => db.opportunities.where('status').equals('OPEN').toArray(),
    []
  );

  const contacts = useLiveQuery(
    () => db.contacts.toArray(),
    []
  );

  const contactMap = React.useMemo(() => {
    const map = new Map();
    contacts?.forEach(c => map.set(c.id, c));
    return map;
  }, [contacts]);

  if (!opportunities || !contacts) {
    return <div className="p-4">Chargement du pipeline...</div>;
  }

  const handleMove = async (id: string, newStage: OpportunityStage) => {
    try {
      setMovingId(id);
      await opportunityUseCases.changeStage(id, newStage);
      // alert('Étape mise à jour');
    } catch (e) {
      alert('Erreur lors du déplacement');
    } finally {
      setMovingId(null);
    }
  };

  const handleMarkWon = async (id: string) => {
    try {
      setMovingId(id);
      await opportunityUseCases.markAsWon(id);
      // alert('Opportunité gagnée ! 🎉');
    } catch (e) {
      alert('Erreur');
    } finally {
      setMovingId(null);
    }
  };

  const handleMarkLost = async (id: string) => {
    try {
      setMovingId(id);
      await opportunityUseCases.markAsLost(id);
      // alert('Opportunité perdue');
    } catch (e) {
      alert('Erreur');
    } finally {
      setMovingId(null);
    }
  };

  const stages = OPPORTUNITY_STAGES.filter(s => s !== 'GAGNE' && s !== 'PERDU');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5" /> Pipeline Commercial
          </h1>
          <p className="text-sm text-muted-foreground">Gérez vos opportunités en cours</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 min-w-max h-full">
          {stages.map((stage, index) => {
            const oppsInStage = opportunities.filter(o => o.stage === stage);
            const totalValue = oppsInStage.reduce((acc, o) => acc + (o.valueMinor || 0), 0);
            
            const isFirst = index === 0;
            const isLast = index === stages.length - 1;
            
            return (
              <div key={stage} className="w-80 flex flex-col gap-3 flex-shrink-0">
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{stage}</h3>
                    <Badge variant="secondary" className="text-xs">{oppsInStage.length}</Badge>
                  </div>
                  {totalValue > 0 && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatMinor(totalValue, 'XOF', 0)}
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pb-10">
                  {oppsInStage.map(opp => {
                    const contact = contactMap.get(opp.contactId);
                    const isMoving = movingId === opp.id;
                    
                    return (
                      <Card key={opp.id} className={`transition-opacity ${isMoving ? 'opacity-50' : ''}`}>
                        <CardHeader className="p-3 pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-semibold leading-tight">
                              {opp.title}
                            </CardTitle>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors focus-visible:outline-none">
                                  <MoreVertical className="w-4 h-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!isFirst && (
                                  <DropdownMenuItem onClick={() => handleMove(opp.id, stages[index - 1])}>
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Reculer ({stages[index - 1]})
                                  </DropdownMenuItem>
                                )}
                                {!isLast && (
                                  <DropdownMenuItem onClick={() => handleMove(opp.id, stages[index + 1])}>
                                    <ArrowRight className="w-4 h-4 mr-2" /> Avancer ({stages[index + 1]})
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleMarkWon(opp.id)} className="text-green-600">
                                  Gagnée
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMarkLost(opp.id)} className="text-destructive">
                                  Perdue
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {contact && (
                            <Link href={`/prospects/${contact.id}`} className="text-xs text-muted-foreground hover:underline line-clamp-1">
                              {contact.displayName}
                            </Link>
                          )}
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          {opp.valueMinor ? (
                            <div className="flex items-center gap-1 text-sm font-medium text-primary">
                              <DollarSign className="w-3.5 h-3.5" />
                              {formatMinor(opp.valueMinor, opp.currency || 'XOF', 0)}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground italic">Pas de montant</div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {oppsInStage.length === 0 && (
                    <div className="text-center p-6 border-2 border-dashed rounded-lg text-sm text-muted-foreground">
                      Vide
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
