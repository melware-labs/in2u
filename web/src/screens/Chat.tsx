import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { api, type ChatMessage, type Me } from '../api';
import { t } from '../i18n';
import { SendIcon } from '../icons';
import { firstName, localIsoDate } from '../lib';

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (localIsoDate(d) === localIsoDate(today)) return t.chat.today;
  if (localIsoDate(d) === localIsoDate(yesterday)) return t.chat.yesterday;
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export function Chat({
  me,
  version,
  draft,
  onDraftUsed,
}: {
  me: Me;
  /** Cambia cuando llega un mensaje nuevo por tiempo real. */
  version: number;
  /** Texto para precargar (p. ej. la pregunta del día). */
  draft: string | null;
  onDraftUsed: () => void;
}) {
  const partnerName = firstName(me.partner?.name, '—');
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const stickToEnd = useRef(true);

  useEffect(() => {
    if (draft) {
      setText(draft);
      onDraftUsed();
    }
  }, [draft, onDraftUsed]);

  useEffect(() => {
    api.chat().then(
      (latest) => {
        stickToEnd.current = true;
        // Se conservan los mensajes viejos ya cargados con "ver anteriores".
        setMessages((prev) => {
          const ids = new Set(latest.map((m) => m.id));
          const older = (prev ?? []).filter((m) => !ids.has(m.id) && (!latest[0] || m.createdAt < latest[0].createdAt));
          return [...older, ...latest];
        });
        setHasOlder((has) => has || latest.length === 50);
      },
      () => setMessages([]),
    );
  }, [version]);

  useLayoutEffect(() => {
    if (stickToEnd.current) end.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  async function loadOlder() {
    if (!messages?.length) return;
    stickToEnd.current = false;
    const older = await api.chat(messages[0].createdAt);
    setHasOlder(older.length === 50);
    setMessages((list) => [...older, ...(list ?? [])]);
  }

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const sent = await api.sendChat(body);
      stickToEnd.current = true;
      setMessages((list) => [...(list ?? []).filter((m) => m.id !== sent.id), sent]);
      setText('');
    } catch {
      setError(t.chat.sendError);
    } finally {
      setSending(false);
    }
  }

  let lastDay = '';
  return (
    <div className="chat">
      <header className="row" style={{ gap: 12 }}>
        <div className="avatar partner" aria-hidden>
          {(partnerName[0] ?? '·').toUpperCase()}
        </div>
        <h1>{partnerName}</h1>
      </header>

      <div className="chat-list" aria-live="polite">
        {hasOlder && (
          <button className="btn link" onClick={loadOlder} style={{ alignSelf: 'center' }}>
            {t.chat.older}
          </button>
        )}
        {messages?.length === 0 && <p className="muted chat-empty">{t.chat.empty(partnerName)}</p>}
        {messages?.map((m) => {
          const day = localIsoDate(new Date(m.createdAt));
          const separator = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id} className="chat-item">
              {separator && <p className="chat-day cap">{dayLabel(m.createdAt)}</p>}
              <div className={`msg ${m.mine ? 'mine' : 'theirs'}`}>
                <p>{m.body}</p>
                <span className="msg-time">{time(m.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        {error && <p className="error">{error}</p>}
        <div className="composer-row">
          <textarea
            className="input"
            rows={1}
            maxLength={2000}
            value={text}
            placeholder={t.chat.placeholder}
            aria-label={t.chat.placeholder}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button className="send-btn" type="submit" disabled={!text.trim() || sending} aria-label={t.chat.send}>
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
}
