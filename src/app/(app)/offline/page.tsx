import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
        <WifiOff className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Vous êtes hors ligne</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        La page que vous essayez d'afficher n'est pas disponible sans connexion internet.
        Cependant, vous pouvez toujours accéder à vos données principales.
      </p>
      <Link 
        href="/"
        className="h-11 px-6 bg-slate-900 text-white inline-flex items-center justify-center rounded-md font-medium"
      >
        Retourner au tableau de bord
      </Link>
    </div>
  );
}
