'use client';

import { useCallback, useEffect, useState } from 'react';
import { ALLOWED_MESSAGE_VARIABLES, MessageTemplateRecord, MessageVariable, buildWhatsAppUrl, extractVariables } from '../domain/message-template';
import { ManageMessageTemplatesUseCase } from '../application/manage-message-templates';
import { ResolveProspectMessageUseCase } from '../application/resolve-prospect-message';
import { MessageCircle, ChevronDown, Send, X, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const templateUseCase = new ManageMessageTemplatesUseCase();
const resolveUseCase = new ResolveProspectMessageUseCase();

interface WhatsAppMessagePanelProps {
  contactId: string;
  normalizedPhone: string;
  displayName: string;
  iconOnly?: boolean;
}

export function WhatsAppMessagePanel({ contactId, normalizedPhone, displayName, iconOnly }: WhatsAppMessagePanelProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplateRecord[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateRecord | null>(null);
  const [resolvedText, setResolvedText] = useState('');
  const [customText, setCustomText] = useState('');
  const [mode, setMode] = useState<'template' | 'custom'>('template');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');
  const [unresolved, setUnresolved] = useState<MessageVariable[]>([]);

  const selectTemplate = useCallback(async (template: MessageTemplateRecord) => {
    setSelectedTemplate(template);
    setError('');
    setResolving(true);
    try {
      const result = await resolveUseCase.execute(contactId, template.content);
      setResolvedText(result.text);
      setUnresolved(result.unresolved);
      if (result.unresolved.length > 0) {
        setError(`Variables sans valeur : ${result.unresolved.join(', ')}. Remplacez-les avant de continuer.`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de résolution');
      setResolvedText(template.content);
    } finally {
      setResolving(false);
    }
  }, [contactId]);

  useEffect(() => {
    if (!open) return;
    templateUseCase.getActive().then((activeTemplates) => {
      setTemplates(activeTemplates);
      if (activeTemplates[0]) void selectTemplate(activeTemplates[0]);
    }).catch(() => {
      setTemplates([]);
      setError('Impossible de charger les modèles de messages.');
    });
  }, [open, selectTemplate]);

  const messageText = mode === 'template' ? resolvedText : customText;
  const linkDisabled = !messageText.trim() || resolving || (mode === 'template' && unresolved.length > 0);
  let whatsAppUrl: string | undefined;
  if (!linkDisabled) {
    try {
      whatsAppUrl = buildWhatsAppUrl(normalizedPhone, messageText);
    } catch {
      whatsAppUrl = undefined;
    }
  }

  const updateResolvedText = (text: string) => {
    const remaining = extractVariables(text).filter((variable): variable is MessageVariable =>
      ALLOWED_MESSAGE_VARIABLES.includes(variable as MessageVariable),
    );
    setResolvedText(text);
    setUnresolved(remaining);
    setError(remaining.length > 0 ? `Variables à compléter : ${remaining.join(', ')}` : '');
  };

  const closePanel = () => {
    setOpen(false);
    setSelectedTemplate(null);
    setResolvedText('');
    setCustomText('');
    setUnresolved([]);
    setError('');
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        size={iconOnly ? "icon" : "default"}
        className={iconOnly ? "bg-[#0B6B2D] hover:bg-[#085725] text-white rounded-full h-8 w-8" : "bg-[#0B6B2D] hover:bg-[#085725] text-white flex gap-2"}
        title={iconOnly ? "Message WhatsApp" : undefined}
      >
        <MessageCircle className={iconOnly ? "h-4 w-4" : "h-5 w-5"} />
        {!iconOnly && "Message WhatsApp"}
      </Button>
    );
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-[#0B6B2D]/5">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-[#0B6B2D]" />
          <h3 className="font-semibold text-sm">Envoyer un message WhatsApp</h3>
        </div>
        <button type="button" aria-label="Fermer la préparation du message" onClick={closePanel} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode Selector */}
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setMode('template')}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${mode === 'template' ? 'bg-[#0B6B2D] text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
          >
            <ChevronDown className="h-3.5 w-3.5 inline mr-1" />
            Modèle
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${mode === 'custom' ? 'bg-[#0B6B2D] text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
          >
            <Edit3 className="h-3.5 w-3.5 inline mr-1" />
            Message libre
          </button>
        </div>

        {mode === 'template' ? (
          <>
            {/* Template Selection */}
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun modèle actif. Créez-en un dans Modèles de messages.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTemplate(t)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors text-sm ${selectedTemplate?.id === t.id ? 'border-[#0B6B2D] bg-[#0B6B2D]/5 ring-1 ring-[#0B6B2D]/20' : 'hover:bg-muted/50'}`}
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{t.category}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Resolved Preview */}
            {selectedTemplate && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Aperçu du message pour {displayName}
                </label>
                {resolving ? (
                  <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground animate-pulse">
                    Résolution des variables...
                  </div>
                ) : (
                  <textarea
                    value={resolvedText}
                    onChange={(e) => updateResolvedText(e.target.value)}
                    aria-label={`Message WhatsApp pour ${displayName}`}
                    rows={4}
                    className="w-full rounded-lg border p-3 text-sm bg-background resize-none"
                  />
                )}
              </div>
            )}
          </>
        ) : (
          /* Custom message mode */
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Message pour {displayName}
            </label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              aria-label={`Message WhatsApp pour ${displayName}`}
              placeholder={`Bonjour ${displayName.split(' ')[0]}, ...`}
              rows={4}
              className="w-full rounded-lg border p-3 text-sm bg-background resize-none"
              autoFocus
            />
          </div>
        )}

        {error && <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">{error}</p>}

        <p className="text-xs text-muted-foreground">
          WhatsApp s’ouvrira avec ce texte prérempli. Vous gardez le contrôle de l’envoi final.
        </p>

        {/* Un vrai lien évite le blocage de window.open dans les navigateurs mobiles et les PWA. */}
        {whatsAppUrl ? (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0B6B2D] px-4 text-sm font-medium text-white hover:bg-[#085725]"
          >
            <Send className="h-4 w-4" />
            Ouvrir dans WhatsApp
          </a>
        ) : (
          <Button disabled className="flex h-11 w-full gap-2 bg-[#0B6B2D] text-white">
            <Send className="h-4 w-4" />
            Ouvrir dans WhatsApp
          </Button>
        )}
      </div>
    </div>
  );
}
