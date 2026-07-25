'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, CircleHelp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { parseVoiceCommand, voiceCommandExamples } from '../domain/voice-command';

interface VoiceRecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface VoiceRecognitionErrorEvent { error: string }

interface VoiceRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: VoiceRecognitionResultEvent) => void) | null;
  onerror: ((event: VoiceRecognitionErrorEvent) => void) | null;
  start(): void;
  abort(): void;
}

interface VoiceRecognitionConstructor { new (): VoiceRecognition }

declare global {
  interface Window {
    SpeechRecognition?: VoiceRecognitionConstructor;
    webkitSpeechRecognition?: VoiceRecognitionConstructor;
  }
}

function speechError(error: string): string {
  if (error === 'not-allowed' || error === 'service-not-allowed') return 'Autorisez le microphone pour utiliser la commande vocale.';
  if (error === 'no-speech') return 'Aucune parole détectée. Réessayez.';
  return 'La reconnaissance vocale est indisponible pour le moment.';
}

export function VoiceControl() {
  const router = useRouter();
  const recognition = useRef<VoiceRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => () => recognition.current?.abort(), []);

  const startListening = () => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setMessage('La commande vocale n’est pas prise en charge par ce navigateur.');
      return;
    }

    const instance = new Recognition();
    recognition.current = instance;
    instance.lang = 'fr-FR';
    instance.continuous = false;
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    instance.onstart = () => { setListening(true); setMessage('Écoute en cours…'); };
    instance.onend = () => setListening(false);
    instance.onerror = (event) => setMessage(speechError(event.error));
    instance.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      const command = parseVoiceCommand(transcript);
      if (!command) { setMessage(`Commande non reconnue : « ${transcript} »`); return; }
      setMessage(`Ouverture : ${command.label}`);
      router.push(command.href);
    };
    try { instance.start(); } catch { setMessage('La commande vocale est déjà en cours.'); }
  };

  const stopListening = () => recognition.current?.abort();

  return <div className="flex items-center gap-1">
    <Button type="button" variant="ghost" size="icon" onClick={listening ? stopListening : startListening} aria-pressed={listening} aria-label={listening ? 'Arrêter la commande vocale' : 'Démarrer la commande vocale'} className={listening ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'text-nav-muted hover:text-nav-fg hover:bg-white/10'}>
      {listening ? <MicOff className="h-5 w-5" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
    </Button>
    <Popover>
      <PopoverTrigger aria-label="Voir les commandes vocales" className="hidden sm:inline-flex size-8 items-center justify-center rounded-lg text-nav-muted hover:bg-white/10 hover:text-nav-fg"><CircleHelp className="h-5 w-5" aria-hidden="true" /></PopoverTrigger>
      <PopoverContent align="end" className="w-72 text-sm"><p className="font-semibold">Commandes vocales</p><p className="mt-1 text-muted-foreground">Touchez le micro puis prononcez, par exemple :</p><ul className="mt-3 grid grid-cols-2 gap-1 text-foreground">{voiceCommandExamples.map((command) => <li key={command} className="rounded bg-muted px-2 py-1">{command}</li>)}</ul></PopoverContent>
    </Popover>
    <p role="status" aria-live="polite" className="sr-only">{message}</p>
  </div>;
}
