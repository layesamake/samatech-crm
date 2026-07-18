'use client';

import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function AppearanceSettingsForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
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
