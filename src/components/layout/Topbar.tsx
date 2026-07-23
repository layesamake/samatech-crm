import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Topbar() {

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-nav-bg/95 text-nav-fg backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
           {/* Espace pour la recherche ou le titre global si on est sur grand écran */}
           <h1 className="text-lg font-semibold lg:hidden">SAMTECH CRM</h1>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Button variant="ghost" size="icon" className="-m-2.5 p-2.5 text-nav-muted hover:text-nav-fg hover:bg-white/10">
            <span className="sr-only">Voir les notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </Button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

          {/* Profile dropdown Placeholder */}
          <div className="hidden lg:flex lg:items-center">
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
               AS
             </div>
          </div>
        </div>
      </div>
    </header>
  )
}
