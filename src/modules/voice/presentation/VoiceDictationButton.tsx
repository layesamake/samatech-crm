'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecognitionResultEvent { results: ArrayLike<ArrayLike<{ transcript: string }>> }
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

export function VoiceDictationButton({ fieldLabel, onTranscript }: { fieldLabel: string; onTranscript: (value: string) => void }) {
  const recognition = useRef<VoiceRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => () => recognition.current?.abort(), []);

  const toggle = () => {
    if (listening) { recognition.current?.abort(); return; }
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) { setMessage('La dictée n’est pas prise en charge par ce navigateur.'); return; }
    const instance = new Recognition();
    recognition.current = instance;
    instance.lang = 'fr-FR';
    instance.continuous = false;
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    instance.onstart = () => { setListening(true); setMessage(`Dictée du champ ${fieldLabel} en cours…`); };
    instance.onend = () => setListening(false);
    instance.onerror = (event) => setMessage(event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'Autorisez le microphone pour dicter.' : event.error === 'no-speech' ? 'Aucune parole détectée.' : 'La dictée est indisponible pour le moment.');
    instance.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) { setMessage('Aucune parole détectée.'); return; }
      onTranscript(transcript);
      setMessage(`Texte ajouté au champ ${fieldLabel}.`);
    };
    try { instance.start(); } catch { setMessage('La dictée est déjà en cours.'); }
  };

  return <><Button type="button" variant="ghost" size="icon-sm" onClick={toggle} aria-pressed={listening} aria-label={listening ? `Arrêter la dictée du champ ${fieldLabel}` : `Dicter le champ ${fieldLabel}`} title={listening ? 'Arrêter la dictée' : 'Dicter'} className={listening ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}>{listening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}</Button><span role="status" aria-live="polite" className="sr-only">{message}</span></>;
}
