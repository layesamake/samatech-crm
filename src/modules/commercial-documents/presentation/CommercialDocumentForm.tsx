'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ManageCommercialDocumentsUseCase } from '../application/manage-commercial-documents';
import { CommercialDocumentFormOptions } from '../infrastructure/dexie-commercial-document-repository';
import { DraftCommercialDocumentInput } from '../domain/commercial-document';
import { calculateInvoiceLine, calculateInvoiceTotals, currencyScaleFor, DraftLineInput, formatMinor, formatQuantity, parseScaledDecimal, percentageToBasisPoints } from '@/modules/invoices/domain/invoice';
import dynamic from 'next/dynamic';
const BarcodeScannerComponent = dynamic(() => import('react-qr-barcode-scanner'), { ssr: false });
import { ScanBarcode, X } from 'lucide-react';

const manage = new ManageCommercialDocumentsUseCase();
type EditableLine = Omit<DraftLineInput, 'quantityScaled' | 'quantityScale'> & { quantityText: string; };
const blankLine = (): EditableLine => ({ id: crypto.randomUUID(), position: 0, designation: '', quantityText: '1', unitPriceMinor: 0, discountType: 'NONE', discountValue: 0, taxRateBasisPoints: 0 });

export default function CommercialDocumentForm({ documentId }: { documentId?: string }) {
  const router = useRouter(); 
  const search = useSearchParams(); 
  const [options, setOptions] = useState<CommercialDocumentFormOptions>(); 
  const [clientId, setClientId] = useState(search.get('clientId') ?? ''); 
  const [lines, setLines] = useState<EditableLine[]>([]); 
  const [selectedProduct, setSelectedProduct] = useState(''); 
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10)); 
  const [validUntil, setValidUntil] = useState(''); 
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [customerReference, setCustomerReference] = useState('');
  const [notes, setNotes] = useState(''); 
  const [terms, setTerms] = useState(''); 
  const [error, setError] = useState(''); 
  const [pending, setPending] = useState(false);
  const [docType, setDocType] = useState<DraftCommercialDocumentInput['type']>((search.get('type') as any) || 'QUOTE');
  const [productMode, setProductMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [newProductName, setNewProductName] = useState('');
  const [clientMode, setClientMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  useEffect(() => { 
    void Promise.all([
      manage.formOptions(), 
      documentId ? manage.get(documentId) : Promise.resolve(null)
    ]).then(([formOptions, current]) => { 
      setOptions(formOptions); 
      if (!current && !clientId) setClientId(formOptions.clients[0]?.profile.id || ''); 
      if (current) { 
        if (current.document.status !== 'DRAFT') throw new Error('Ce document n’est plus modifiable'); 
        setDocType(current.document.type); 
        setClientId(current.document.clientProfileId); 
        setIssueDate(current.document.issueDate ?? ''); 
        setValidUntil(current.document.validUntil ?? ''); 
        setDeliveryDate(current.document.deliveryDate ?? '');
        setDeliveryAddress(current.document.deliveryAddress ?? '');
        setRecipientName(current.document.recipientName ?? '');
        setCustomerReference(current.document.customerReference ?? '');
        setNotes(current.document.notes ?? ''); 
        setTerms(current.document.terms ?? ''); 
        setLines(current.lines.map((line) => ({ 
          id: line.id, 
          productId: line.productId, 
          position: line.position, 
          designation: line.designationSnapshot, 
          description: line.descriptionSnapshot, 
          unitLabel: line.unitLabelSnapshot, 
          quantityText: formatQuantity(line.quantityScaled, line.quantityScale), 
          unitPriceMinor: line.unitPriceMinor, 
          discountType: line.discountType, 
          discountValue: line.discountValue, 
          taxRateBasisPoints: line.taxRateBasisPoints 
        }))); 
      } 
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement impossible')); 
  }, [documentId]);

  const taxesEnabled = options?.settings?.enableTaxes ?? false; 
  const currency = options?.settings?.currencyCode ?? options?.company?.currencyCode ?? 'XOF'; 
  const scale = currencyScaleFor(currency);
  
  const calculated = useMemo(() => { 
    try { 
      const values = lines.map((line, position) => { 
        const quantity = parseScaledDecimal(line.quantityText); 
        return calculateInvoiceLine({ ...line, position, quantityScaled: quantity.scaled, quantityScale: quantity.scale }, taxesEnabled); 
      }); 
      return { lines: values, totals: calculateInvoiceTotals(values), error: '' }; 
    } catch (caught) { 
      return { lines: [], totals: calculateInvoiceTotals([]), error: caught instanceof Error ? caught.message : 'Calcul invalide' }; 
    } 
  }, [lines, taxesEnabled]);

  const updateLine = (id: string, change: Partial<EditableLine>) => setLines((current) => current.map((line) => line.id === id ? { ...line, ...change } : line));
  const move = (index: number, offset: number) => setLines((current) => { const target = index + offset; if (target < 0 || target >= current.length) return current; const copy = [...current]; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy; });
  
  const addProduct = () => { 
    const product = options?.products.find((item) => item.id === selectedProduct); 
    if (!product) return; 
    setLines((current) => [...current, { id: crypto.randomUUID(), productId: product.id, position: current.length, designation: product.name, description: product.description, unitLabel: product.unitLabel, quantityText: '1', unitPriceMinor: product.unitPriceMinor, discountType: 'NONE', discountValue: 0, taxRateBasisPoints: taxesEnabled ? product.defaultTaxRateBasisPoints ?? percentageToBasisPoints(options?.settings?.defaultTaxRate ?? 0) : 0 }]); 
    setSelectedProduct(''); 
  };
  
  const addProductById = (productId: string) => { 
    const product = options?.products.find((item) => item.id === productId); 
    if (!product) return; 
    setLines((current) => { 
      const existing = current.find(l => l.productId === productId); 
      if (existing) { 
        return current.map(l => l.id === existing.id ? { ...l, quantityText: String(Number(l.quantityText) + 1) } : l); 
      } 
      return [...current, { id: crypto.randomUUID(), productId: product.id, position: current.length, designation: product.name, description: product.description, unitLabel: product.unitLabel, quantityText: '1', unitPriceMinor: product.unitPriceMinor, discountType: 'NONE', discountValue: 0, taxRateBasisPoints: taxesEnabled ? product.defaultTaxRateBasisPoints ?? percentageToBasisPoints(options?.settings?.defaultTaxRate ?? 0) : 0 }]; 
    }); 
  };
  
  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;
    try {
      const { DexieCatalogRepository } = await import('@/modules/catalog/infrastructure/dexie-catalog-repository');
      const { ManageCatalogUseCase } = await import('@/modules/catalog/application/manage-catalog');
      const manageCat = new ManageCatalogUseCase(new DexieCatalogRepository());
      const newProduct = await manageCat.createProduct({
        name: newProductName.trim(),
        type: 'SERVICE',
        currency,
        currencyScale: scale,
        unitPriceMinor: 0,
        defaultTaxRateBasisPoints: 0,
      });
      setOptions(prev => prev ? { ...prev, products: [...prev.products, newProduct] } : prev);
      setSelectedProduct('');
      setProductMode('SELECT');
      setNewProductName('');
      setLines((current) => [...current, { id: crypto.randomUUID(), productId: newProduct.id, position: current.length, designation: newProduct.name, description: newProduct.description, unitLabel: newProduct.unitLabel, quantityText: '1', unitPriceMinor: newProduct.unitPriceMinor, discountType: 'NONE', discountValue: 0, taxRateBasisPoints: taxesEnabled ? newProduct.defaultTaxRateBasisPoints ?? percentageToBasisPoints(options?.settings?.defaultTaxRate ?? 0) : 0 }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur création produit");
    }
  };
  
  const handleCreateClient = async () => {
    if (!newClientName.trim() || !newClientPhone.trim()) {
      setError("Le nom et le numéro WhatsApp sont obligatoires pour créer un client.");
      return;
    }
    try {
      const { DexieProspectRepository } = await import('@/modules/prospects/infrastructure/dexie-prospect-repository');
      const { CreateProspectUseCase } = await import('@/modules/prospects/application/create-prospect');
      const { DexieClientRepository } = await import('@/modules/clients/infrastructure/dexie-client-repository');
      const { ConvertProspectUseCase } = await import('@/modules/clients/application/convert-prospect');
      const createProspect = new CreateProspectUseCase(new DexieProspectRepository());
      const convertProspect = new ConvertProspectUseCase(new DexieClientRepository(), new DexieProspectRepository());
      
      const p = await createProspect.execute({ displayName: newClientName.trim(), whatsappPhone: newClientPhone.trim(), source: 'OTHER' });
      await convertProspect.execute(p.id);
      
      const newOpts = await manage.formOptions();
      setOptions(newOpts);
      const newClient = newOpts.clients.find(c => c.contact.id === p.id);
      if (newClient) setClientId(newClient.profile.id);
      
      setClientMode('SELECT');
      setNewClientName('');
      setNewClientPhone('');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur création client");
    }
  };

  const save = async () => { 
    if (!clientId) return setError('Veuillez sélectionner un client'); 
    if (calculated.error) return setError(calculated.error); 
    setPending(true); setError(''); 
    try { 
      const input: DraftCommercialDocumentInput = { 
        type: docType, 
        clientProfileId: clientId, 
        issueDate: issueDate || undefined, 
        validUntil: validUntil || undefined, 
        deliveryDate: deliveryDate || undefined,
        deliveryAddress: deliveryAddress || undefined,
        recipientName: recipientName || undefined,
        customerReference: customerReference || undefined,
        notes: notes || undefined, 
        terms: terms || undefined, 
        currency, 
        currencyScale: scale, 
        taxesEnabled, 
        lines: calculated.lines 
      }; 
      if (documentId) { 
        await manage.updateDraft(documentId, input); 
        router.push(`/commercial-documents/${documentId}`); 
      } else { 
        const created = await manage.createDraft(input); 
        router.push(`/commercial-documents/${created!.document.id}`); 
      } 
    } catch (caught) { 
      setError(caught instanceof Error ? caught.message : 'Erreur inattendue'); setPending(false); 
    } 
  };

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {documentId ? `Modifier le ${docType === 'QUOTE' ? 'devis' : docType === 'PROFORMA' ? 'proforma' : 'bon de livraison'} brouillon` : `Créer un nouveau document`}
      </h1>
      
      {error && <div className="rounded-xl bg-red-100 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-200">{error}</div>}
      
      <section className="grid gap-4 rounded-xl border bg-card text-card-foreground p-6 sm:grid-cols-2">
        {!documentId && (
          <label className="text-sm sm:col-span-2">
            Type de document
            <select className="mt-1 h-11 w-full rounded-md border px-3" value={docType} onChange={(e) => setDocType(e.target.value as any)}>
              <option value="QUOTE">Devis</option>
              <option value="PROFORMA">Facture Proforma</option>
              <option value="DELIVERY_NOTE">Bon de Livraison</option>
            </select>
          </label>
        )}
        
        <div className="sm:col-span-2">
          <label className="text-sm">Client</label>
          {clientMode === 'SELECT' ? (
            <select aria-label="Client" className="mt-1 h-11 w-full rounded-md border px-3" value={clientId} onChange={(event) => {
              if (event.target.value === 'NEW') setClientMode('NEW');
              else setClientId(event.target.value);
            }}>
              <option value="">Sélectionner un client...</option>
              {options?.clients.map((client) => <option key={client.profile.id} value={client.profile.id}>{client.contact.displayName}</option>)}
              <option value="NEW">+ Nouveau client...</option>
            </select>
          ) : (
            <div className="mt-1 flex flex-col sm:flex-row gap-2">
              <input aria-label="Nom" placeholder="Nom du client" autoFocus className="h-11 flex-1 rounded-md border px-3" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
              <input aria-label="WhatsApp" placeholder="WhatsApp (ex: +22177...)" className="h-11 flex-1 rounded-md border px-3" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
              <div className="flex gap-2">
                <button type="button" className="rounded-md border px-2 py-1 text-sm bg-secondary text-secondary-foreground" onClick={handleCreateClient}>Créer</button>
                <button type="button" className="rounded-md border px-2 py-1 text-sm" onClick={() => { setClientMode('SELECT'); setNewClientName(''); setNewClientPhone(''); }}>Annuler</button>
              </div>
            </div>
          )}
        </div>
        
        <label className="text-sm">Date d’émission<input type="date" className="mt-1 h-11 w-full rounded-md border px-3" value={issueDate} onChange={(event) => setIssueDate(event.target.value)}/></label>
        
        {docType !== 'DELIVERY_NOTE' && (
          <label className="text-sm">Valable jusqu'au<input type="date" className="mt-1 h-11 w-full rounded-md border px-3" value={validUntil} onChange={(event) => setValidUntil(event.target.value)}/></label>
        )}
        
        {docType === 'DELIVERY_NOTE' && (
          <label className="text-sm">Date de livraison<input type="date" className="mt-1 h-11 w-full rounded-md border px-3" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)}/></label>
        )}
        
        <label className="text-sm sm:col-span-2">Référence client<input type="text" placeholder="Numéro BC, référence projet..." className="mt-1 h-11 w-full rounded-md border px-3" value={customerReference} onChange={(event) => setCustomerReference(event.target.value)}/></label>
        
        {docType === 'DELIVERY_NOTE' && (
          <>
            <label className="text-sm">Destinataire<input type="text" className="mt-1 h-11 w-full rounded-md border px-3" value={recipientName} onChange={(event) => setRecipientName(event.target.value)}/></label>
            <label className="text-sm">Adresse de livraison<textarea className="mt-1 w-full rounded-md border p-3" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)}/></label>
          </>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {productMode === 'SELECT' ? (
            <select aria-label="Produit à ajouter" className="h-11 flex-1 rounded-md border px-3" value={selectedProduct} onChange={(event) => {
              if (event.target.value === 'NEW') { setProductMode('NEW'); setSelectedProduct(''); } 
              else { setSelectedProduct(event.target.value); }
            }}>
              <option value="">Choisir un produit actif</option>
              {options?.products.map((product) => <option key={product.id} value={product.id}>{product.name} — {formatMinor(product.unitPriceMinor, product.currency, product.currencyScale)}</option>)}
              <option value="NEW">+ Nouveau produit au catalogue...</option>
            </select>
          ) : (
            <div className="flex gap-2 flex-1">
              <input aria-label="Nom du nouveau produit" autoFocus placeholder="Nom du nouveau produit..." className="h-11 flex-1 rounded-md border px-3" value={newProductName} onChange={e => setNewProductName(e.target.value)} />
              <button type="button" className="rounded-md border px-4 whitespace-nowrap bg-secondary text-secondary-foreground" onClick={handleCreateProduct}>Créer & Ajouter</button>
              <button type="button" className="rounded-md border px-4 whitespace-nowrap" onClick={() => { setProductMode('SELECT'); setNewProductName(''); }}>Annuler</button>
            </div>
          )}
          {productMode === 'SELECT' && <button type="button" className="rounded-md border px-4" onClick={addProduct}>Ajouter</button>}
          <button type="button" className="rounded-md border px-4 flex items-center gap-2" onClick={() => { setScanning(true); setScanMessage(''); }}><ScanBarcode className="w-5 h-5" /> Scanner</button>
          <button type="button" className="rounded-md border px-4" onClick={() => setLines((current) => [...current, { ...blankLine(), position: current.length }])}>Ligne libre</button>
        </div>

        {lines.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center">Le brouillon ne contient aucune ligne.</p> : lines.map((line, index) => 
          <article key={line.id} className="space-y-3 rounded-xl border bg-card text-card-foreground p-4">
            <div className="flex justify-between">
              <strong>Ligne {index + 1}</strong>
              <div className="flex gap-2">
                <button type="button" className="min-h-11 border px-3" onClick={() => move(index, -1)}>↑</button>
                <button type="button" className="min-h-11 border px-3" onClick={() => move(index, 1)}>↓</button>
                <button type="button" className="min-h-11 border px-3 text-red-800 dark:text-red-200" onClick={() => { if (confirm('Retirer cette ligne ?')) setLines((current) => current.filter((item) => item.id !== line.id)); }}>Retirer</button>
              </div>
            </div>
            <input aria-label="Désignation" className="h-11 w-full rounded-md border px-3" value={line.designation} onChange={(event) => updateLine(line.id!, { designation: event.target.value })}/>
            <textarea aria-label="Description" className="w-full rounded-md border px-3 py-2" value={line.description ?? ''} onChange={(event) => updateLine(line.id!, { description: event.target.value })}/>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm">Quantité<input inputMode="decimal" className="mt-1 h-11 w-full rounded-md border px-3" value={line.quantityText} onChange={(event) => updateLine(line.id!, { quantityText: event.target.value })}/></label>
              {docType !== 'DELIVERY_NOTE' && (
                <>
                  <label className="text-sm">Prix unitaire ({currency})<input type="number" min="0" inputMode="numeric" className="mt-1 h-11 w-full rounded-md border px-3" value={line.unitPriceMinor} onChange={(event) => updateLine(line.id!, { unitPriceMinor: Number(event.target.value) })}/></label>
                  <label className="text-sm">Remise
                    <select className="mt-1 h-11 w-full rounded-md border px-3" value={line.discountType} onChange={(event) => updateLine(line.id!, { discountType: event.target.value as EditableLine['discountType'], discountValue: 0 })}>
                      <option value="NONE">Aucune</option>
                      <option value="PERCENT">Pourcentage</option>
                      <option value="AMOUNT">Montant</option>
                    </select>
                  </label>
                </>
              )}
            </div>
            {docType !== 'DELIVERY_NOTE' && line.discountType !== 'NONE' && (
              <label className="block text-sm">{line.discountType === 'PERCENT' ? 'Pourcentage (points de base, 100 = 1 %)' : `Montant (${currency})`}
                <input type="number" min="0" className="mt-1 h-11 w-full rounded-md border px-3" value={line.discountValue} onChange={(event) => updateLine(line.id!, { discountValue: Number(event.target.value) })}/>
              </label>
            )}
            {docType !== 'DELIVERY_NOTE' && taxesEnabled && (
              <label className="block text-sm">Taxe (points de base)
                <input type="number" min="0" max="10000" className="mt-1 h-11 w-full rounded-md border px-3" value={line.taxRateBasisPoints} onChange={(event) => updateLine(line.id!, { taxRateBasisPoints: Number(event.target.value) })}/>
              </label>
            )}
            {docType !== 'DELIVERY_NOTE' && (
              <p className="text-right font-semibold">Total ligne : {formatMinor(calculated.lines[index]?.lineTotalMinor ?? 0, currency, scale)}</p>
            )}
          </article>
        )}
      </section>

      <section className="grid gap-3 rounded-xl border bg-muted/50 p-4 sm:grid-cols-2">
        <label>Notes<textarea className="mt-1 w-full rounded-md border p-3" value={notes} onChange={(event) => setNotes(event.target.value)}/></label>
        <label>Conditions<textarea className="mt-1 w-full rounded-md border p-3" value={terms} onChange={(event) => setTerms(event.target.value)}/></label>
        {docType !== 'DELIVERY_NOTE' && (
          <div className="sm:col-span-2 space-y-1 text-right">
            <p>Sous-total : {formatMinor(calculated.totals.subtotalMinor, currency, scale)}</p>
            <p>Remises : {formatMinor(calculated.totals.discountTotalMinor, currency, scale)}</p>
            <p>Taxes : {formatMinor(calculated.totals.taxTotalMinor, currency, scale)}</p>
            <strong className="text-lg">Total : {formatMinor(calculated.totals.grandTotalMinor, currency, scale)}</strong>
          </div>
        )}
      </section>

      <button type="button" disabled={pending || !clientId} onClick={() => void save()} className="h-12 w-full rounded-md bg-blue-700 text-white">
        {pending ? 'Enregistrement...' : 'Enregistrer le brouillon'}
      </button>

      {scanning && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative">
            <div className="p-4 flex justify-between items-center border-b">
              <h2 className="font-bold">Scanner un code-barres</h2>
              <button onClick={() => setScanning(false)} className="p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-black aspect-square w-full relative">
              <BarcodeScannerComponent width="100%" height="100%" onUpdate={(err: unknown, result: Record<string, unknown>) => {
                if (result?.text) {
                  const p = options?.products.find(x => x.barcode === result.text);
                  if (p) { addProductById(p.id); setScanning(false); } else { setScanMessage(`Code ${result.text} inconnu`); }
                }
              }} />
            </div>
            <div className="p-4 text-center text-sm min-h-[60px]">
              {scanMessage ? <span className="text-amber-600 font-medium">{scanMessage}</span> : <span className="text-muted-foreground">Placez le code-barres dans le cadre</span>}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
