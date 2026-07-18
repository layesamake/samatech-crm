'use client'

import { useEffect, useState } from 'react'
import { DatabaseDiagnosticService } from '@/infrastructure/database/database-diagnostic'

const diagnosticService = new DatabaseDiagnosticService()
import { seedDatabase } from '@/infrastructure/database/seeder'

export default function DevDiagnostic() {
  const [dbStatus, setDbStatus] = useState<string>('Vérification en cours...')

  useEffect(() => {
    async function checkDb() {
      try {
        const result = await diagnosticService.inspect()
        setDbStatus(result.available && result.missingTables.length === 0
          ? `✅ IndexedDB disponible — ${result.databaseName} V${result.version} — ${result.tables.length} tables`
          : `❌ Diagnostic incomplet — tables manquantes : ${result.missingTables.join(', ')}`)
      } catch (error) {
        console.error(error)
        setDbStatus('❌ Erreur de connexion à Dexie.js')
      }
    }
    checkDb()
  }, [])

  const handleSeed = async () => {
    try {
      await seedDatabase()
      setDbStatus('Base de données remplie avec succès ! (Rechargez pour voir)')
    } catch (error) {
      console.error(error)
      setDbStatus('Erreur lors du remplissage de la base de données.')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Diagnostic Sprint 0</h2>
      <div className="p-4 border rounded shadow-sm bg-card text-card-foreground">
        <h3 className="font-semibold mb-2">État de la Base de Données</h3>
        <p className="text-sm">{dbStatus}</p>
      </div>
      <div className="p-4 border rounded shadow-sm bg-card text-card-foreground">
        <h3 className="font-semibold mb-2">État PWA</h3>
        <p className="text-sm">Le manifeste PWA et le service worker doivent être actifs si l&apos;application est construite.</p>
      </div>
      <div className="p-4 border rounded shadow-sm bg-card text-card-foreground">
        <h3 className="font-semibold mb-2">Données de test</h3>
        <button 
          onClick={handleSeed}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Générer des données de test
        </button>
        <p className="text-xs text-gray-500 mt-2">Ceci ajoutera des prospects, contacts, catégories et produits fictifs.</p>
      </div>
    </div>
  )
}
