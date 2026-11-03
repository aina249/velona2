import React, { useEffect, useRef, useState } from 'react';
import { get, post, compressImage } from '../../lib/api';
import { fmtDateTime } from '../../lib/util';
import { Loading, ErrorBox, useToast } from '../../ui/kit';
import { Icon } from '../../ui/icons';

// Conversation client ↔ Annick. path : '/me/messages' ou '/admin/clients/:id/messages'
export default function Chat({ path, otherName = 'Annick', placeholder = 'Écrire un message…', templates = [] }) {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  const toast = useToast();

  const load = async () => {
    try { const d = await get(path); setMessages(d.messages); setError(null); } catch (e) { setError(e); }
  };
  useEffect(() => {
    setMessages(null); load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [path]);
  useEffect(() => { if (end.current) end.current.scrollIntoView({ block: 'end' }); }, [messages && messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() && !photo) return;
    setBusy(true);
    try { await post(path, { body: text.trim(), photo }); setText(''); setPhoto(null); await load(); }
    catch (err) { toast(err.message, 'danger'); }
    finally { setBusy(false); }
  };

  if (error && !messages) return <ErrorBox error={error} retry={load} />;
  if (!messages) return <Loading />;
  let lastDay = '';
  return (
    <div className="chat">
      <div className="chat-scroll" aria-live="polite">
        {!messages.length ? <p className="muted center chat-empty">Aucun message pour l'instant. Écrivez à {otherName} !</p> : null}
        {messages.map((m) => {
          const day = new Date(m.created_at).toDateString();
          const sep = day !== lastDay; lastDay = day;
          return (
            <React.Fragment key={m.id}>
              {sep ? <p className="chat-day">{new Date(m.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p> : null}
              <div className={`bubble ${m.mine ? 'mine' : ''} ${m.automatic ? 'auto' : ''}`}>
                {m.photo ? <img src={`/api/files/${m.photo}`} alt="Photo jointe" loading="lazy" /> : null}
                {m.body ? <p>{m.body}</p> : null}
                <span className="bubble-time">{m.automatic ? 'Réponse automatique · ' : ''}{fmtDateTime(m.created_at).split(' ').slice(-1)[0]}</span>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={end} />
      </div>
      {templates.length ? (
        <div className="chat-templates">{templates.map((t) => <button type="button" key={t} className="pill" onClick={() => setText(t)}>{t.length > 40 ? t.slice(0, 38) + '…' : t}</button>)}</div>
      ) : null}
      <form className="composer" onSubmit={send}>
        {photo ? <div className="composer-photo"><img src={photo} alt="Photo à envoyer" /><button type="button" aria-label="Retirer la photo" onClick={() => setPhoto(null)}><Icon name="x" size={14} /></button></div> : null}
        <label className="icon-btn" aria-label="Joindre une photo">
          <Icon name="camera" />
          <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files[0]; if (f) { try { setPhoto(await compressImage(f)); } catch (err) { toast(err.message, 'danger'); } } e.target.value = ''; }} />
        </label>
        <textarea rows={1} className="input" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 800) { e.preventDefault(); send(e); } }} aria-label="Message" />
        <button type="submit" className="send-btn" disabled={busy || (!text.trim() && !photo)} aria-label="Envoyer"><Icon name="send" /></button>
      </form>
    </div>
  );
}
