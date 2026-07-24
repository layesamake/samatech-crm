'use client';

import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function AppearanceSettingsForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thème de l&apos;application</CardTitle>
        <CardDescription>
          Personnalisez l&apos;apparence visuelle. Le thème sombre est inspiré de &quot;Salytics&quot;, et le thème clair est inspiré de &quot;Pipeliner&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Light Theme Option */}
          <button
            onClick={() => setTheme('light')}
            className={cn(
              "flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all hover:bg-muted",
              theme === 'light' ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
              <Sun className="w-8 h-8 text-[#1d4ed8]" />
            </div>
            <span className="font-semibold">Clair</span>
            <span className="text-xs text-muted-foreground mt-1">Pipeliner Style</span>
          </button>

          {/* Dark Theme Option */}
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              "flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all hover:bg-muted",
              theme === 'dark' ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <div className="p-4 bg-[#111827] rounded-full shadow-sm mb-4">
              <Moon className="w-8 h-8 text-[#3b82f6]" />
            </div>
            <span className="font-semibold">Sombre</span>
            <span className="text-xs text-muted-foreground mt-1">Salytics Style</span>
          </button>

          {/* Emerald night Theme Option */}
          <button
            onClick={() => setTheme('theme-emerald-night')}
            className={cn(
              "flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all hover:bg-muted",
              theme === 'theme-emerald-night' ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <div className="mb-4 rounded-full bg-[#111216] p-4 shadow-sm ring-1 ring-[#2a2d34]">
              <Activity className="h-8 w-8 text-[#3ecf8e]" />
            </div>
            <span className="font-semibold">Émeraude nuit</span>
            <span className="mt-1 text-xs text-muted-foreground">Noir & vert émeraude</span>
          </button>

          {/* Phantom Theme Option */}
          <button
            onClick={() => setTheme('theme-phantom')}
            className={cn(
              "flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all hover:bg-muted",
              theme === 'theme-phantom' ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <div className="p-4 bg-[#150000] rounded-full shadow-sm mb-4">
              {/* Le fond de Phantom est très sombre, presque noir. */}
              <Moon className="w-8 h-8 text-[#9b6bf3]" />
            </div>
            <span className="font-semibold">Phantom</span>
            <span className="text-xs text-muted-foreground mt-1">Crypto Style</span>
          </button>

          {/* Chase Theme Option */}
          <button
            onClick={() => setTheme('theme-chase')}
            className={cn(
              "flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all hover:bg-muted",
              theme === 'theme-chase' ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <div className="p-4 bg-[#f4f6f9] border rounded-full shadow-sm mb-4">
              <Sun className="w-8 h-8 text-[#0a2540]" />
            </div>
            <span className="font-semibold">Chase</span>
            <span className="text-xs text-muted-foreground mt-1">Banking Style</span>
          </button>

          {/* System Theme Option */}
          <button
            onClick={() => setTheme('system')}
            className={cn(
              "flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all hover:bg-muted",
              theme === 'system' ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <div className="p-4 bg-muted rounded-full shadow-sm mb-4">
              <Monitor className="w-8 h-8 text-foreground" />
            </div>
            <span className="font-semibold">Système</span>
            <span className="text-xs text-muted-foreground mt-1">Adaptatif</span>
          </button>

        </div>
      </CardContent>
    </Card>
  );
}
