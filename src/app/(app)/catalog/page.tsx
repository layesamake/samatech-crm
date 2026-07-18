'use client';

import { useState } from 'react';
import CategoriesManager from '@/modules/catalog/presentation/CategoriesManager';
import ProductsManager from '@/modules/catalog/presentation/ProductsManager';

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'CATEGORIES'>('PRODUCTS');

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catalogue</h1>
          <p className="text-muted-foreground">Gérez vos produits, services et catégories.</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('PRODUCTS')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'PRODUCTS' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Produits & Services
        </button>
        <button
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'CATEGORIES' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Catégories
        </button>
      </div>

      <div className="pt-4">
        {activeTab === 'PRODUCTS' && <ProductsManager />}
        {activeTab === 'CATEGORIES' && <CategoriesManager />}
      </div>
    </div>
  );
}
