import SuppliersManager from '@/modules/suppliers/presentation/SuppliersManager';

export default function SuppliersPage() {
  return <main className="mx-auto max-w-4xl p-4 md:p-8"><header className="mb-6"><h1 className="text-2xl font-bold">Fournisseurs et bénéficiaires</h1><p className="text-muted-foreground">Gérez les contacts utilisés pour vos dépenses.</p></header><SuppliersManager /></main>;
}
