import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { DatabaseInfo } from '../domain/maintenance';

interface DeleteDatabaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  database: DatabaseInfo | null;
  onConfirm: (dbName: string) => Promise<void>;
  onBackupFirst: () => void;
}

export function DeleteDatabaseDialog({ isOpen, onOpenChange, database, onConfirm, onBackupFirst }: DeleteDatabaseDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!database) return;
    if (confirmation !== 'SUPPRIMER') return;
    setIsDeleting(true);
    try {
      await onConfirm(database.name);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
      setConfirmation('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isDeleting) {
        onOpenChange(open);
        setConfirmation('');
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Suppression définitive
          </DialogTitle>
          <DialogDescription className="pt-2 space-y-3">
            <p>
              Vous êtes sur le point de supprimer physiquement la base de données locale :
            </p>
            <div className="bg-muted p-2 rounded-md font-mono text-xs overflow-hidden text-ellipsis">
              {database?.name}
            </div>
            {database?.deletionReason && (
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Raison : {database.deletionReason}
              </p>
            )}
            <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-md text-sm mt-2">
              <strong>Action irréversible.</strong> Toutes les données non sauvegardées contenues dans cet espace seront perdues à jamais.
            </div>
            
            <p className="text-sm">Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :</p>
            <Input 
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="SUPPRIMER"
              disabled={isDeleting}
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          <Button type="button" variant="outline" onClick={onBackupFirst} disabled={isDeleting} className="w-full sm:w-auto">
            Sauvegarder d'abord
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isDeleting || confirmation !== 'SUPPRIMER'}
            className="w-full sm:w-auto"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Supprimer la base
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
