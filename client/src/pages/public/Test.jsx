import React, { useState } from 'react';
import { post } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Link } from '../../lib/router';
import { Button, ButtonLink, Field, Input, ErrorBox, Notice } from '../../ui/kit';
import { Icon } from '../../ui/icons';

export const QUESTIONS = [
  { topic: 'Énergie', text: 'Comment est votre énergie au quotidien ?', opts: ['Stable toute la journée', 'Fatigue en fin de journée seulement', 'Fatigue dès le matin, besoin de café', 'Épuisement permanent, même au réveil'], tip: ['Mieux répartir vos repas', 'Pour une énergie plus stable toute la journée.'] },
  { topic: 'Repas', text: 'Mangez-vous à heures régulières ?', opts: ['Trois repas à heures fixes', 'Trois repas, mais à des heures variables', 'Je saute souvent un repas', 'Je mange quand je peux'], tip: ['Retrouver des horaires réguliers', 'Trois repas à heures fixes aident le corps à se caler.'] },
  { topic: 'Petit-déjeuner', text: 'Que prenez-vous au petit-déjeuner ?', opts: ['Un petit-déjeuner complet chaque jour', 'Quelque chose de léger, mais régulier', 'Juste un café ou un thé', 'Rien, je ne déjeune pas'], tip: ['Un petit-déjeuner qui tient', 'Pour éviter le coup de fatigue et le grignotage avant midi.'] },
  { topic: 'Légumes et fruits', text: 'À quelle fréquence mangez-vous des légumes ou des fruits ?', opts: ['À chaque repas', 'Une fois par jour', 'Quelques fois par semaine', 'Rarement'], tip: ['Plus de légumes et de fruits', 'Des brèdes, légumes ou fruits locaux à chaque repas.'] },
  { topic: 'Hydratation', text: "Combien d'eau buvez-vous par jour ?", opts: ['Plus de 1,5 litre', 'Environ 1 litre', 'Moins de 1 litre', "Presque pas, surtout d'autres boissons"], tip: ["Augmenter l'hydratation", "Viser 1,5 à 2 litres d'eau par jour, répartis dans la journée."] },
  { topic: 'Boissons sucrées', text: 'Buvez-vous des sodas ou des jus sucrés ?', opts: ['Jamais', 'Une ou deux fois par semaine', 'Presque chaque jour', 'Plusieurs par jour'], tip: ['Réduire les boissons sucrées', "Les remplacer peu à peu par de l'eau ou des infusions."] },
  { topic: 'Fritures et snacks', text: 'Mangez-vous des fritures ou des snacks gras ?', opts: ['Rarement', 'Une ou deux fois par semaine', 'Presque chaque jour', 'Plusieurs fois par jour'], tip: ['Moins de fritures', 'Privilégier le grillé, le vapeur et le mijoté.'] },
  { topic: 'Sommeil', text: 'Comment dormez-vous ?', opts: ['7 heures ou plus, sommeil réparateur', '6 à 7 heures, plutôt bien', 'Moins de 6 heures', 'Mal, sommeil agité'], tip: ['Stabiliser le sommeil', 'Un sommeil régulier favorise une meilleure vitalité.'] },
  { topic: 'Activité physique', text: 'Bougez-vous au moins 30 minutes par jour ?', opts: ['La plupart des jours', '2 à 3 fois par semaine', 'Rarement', 'Jamais'], tip: ['Bouger un peu chaque jour', '30 minutes de marche, même en plusieurs fois, font la différence.'] },
  { topic: 'Stress', text: 'Quel est votre niveau de stress ?', opts: ['Faible', 'Modéré', 'Élevé', 'Très élevé, en permanence'], tip: ['Apaiser le stress', 'Des repas calmes et réguliers aident aussi à mieux le gérer.'] },
  { topic: 'Digestion', text: 'Comment se passe votre digestion ?', opts: ['Confortable', 'Parfois lourde', 'Souvent des ballonnements', 'Inconfortable presque chaque jour'], tip: ['Améliorer la digestion', 'Manger plus lentement et ajouter des fibres progressivement.'] },
  { topic: 'Grignotage', text: 'Vous arrive-t-il de grignoter entre les repas ?', opts: ['Jamais', 'Parfois', "Souvent l'après-midi", 'Toute la journée'], tip: ['Remplacer le grignotage', 'Prévoir une collation saine : fruit, yaourt, poignée de cacahuètes.'] },
];

export function tipsFor(answers) {
  return answers.map((pts, idx) => ({ idx, pts })).sort((a, b) => a.pts - b.pts || a.idx - b.idx).slice(0, 3).map((r) => QUESTIONS[r.idx].tip);
}
export function levelFor(score) {
  if (score >= 75) return ['Votre vitalité est bonne', 'Vous avez de bonnes bases. Voici où progresser pour aller encore plus loin.'];
  if (score >= 50) return ['Votre vitalité peut progresser', 'Quelques habitudes freinent votre énergie. Elles se corrigent bien avec un accompagnement.'];
  return ['Votre vitalité a besoin d’attention', 'Plusieurs habitudes pèsent sur votre énergie. Un bilan vous aidera à reprendre les choses en main, pas à pas.'];
}

export function ScoreRing({ score, size = 180 }) {
  const r = 70; const c = 2 * Math.PI * r;
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 180 180" width={size} height={size} role="img" aria-label={`Score de vitalité : ${score} sur 100`}>
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--line)" strokeWidth="14" />
        <circle className="ring-anim" cx="90" cy="90" r={r} fill="none" stroke="var(--green)" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} transform="rotate(-90 90 90)" style={{ '--c': c }} />
      </svg>
      <div className="score-ring-text"><strong>{score}</strong><span>/ 100</span></div>
    </div>
  );
}

export default function Test() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [contact, setContact] = useState({ first_name: '', contact: '', sent: false });

  const pick = async (i) => {
    const next = answers.slice(); next[step - 1] = 3 - i; setAnswers(next);
    if (step < 12) { setStep(step + 1); return; }
    setStep(13);
    try { setResult(await post('/public/vitality', { answers: next })); }
    catch (e) { setError(e); }
  };
  const sendContact = async (e) => {
    e.preventDefault();
    try { await post(`/public/vitality/${result.id}/contact`, contact); setContact({ ...contact, sent: true }); }
    catch (err) { setError(err); }
  };

  return (
    <div className="test-page">
      <header className="test-top">
        <Link to={user ? '/app' : '/'} className="auth-brand" aria-label="Vélona"><img src="/symbol.png" alt="" width="36" height="36" /><img src="/wordmark.png" alt="Vélona" height="24" /></Link>
        {!user ? <Link to="/connexion" className="link">Se connecter</Link> : null}
      </header>
      <main className="test-main">
        {step === 0 ? (
          <div className="test-intro fade-up">
            <span className="chip chip-warm">Gratuit · 3 minutes</span>
            <h1>Votre test de vitalité</h1>
            <p className="lead">12 questions sur votre énergie, vos repas, votre sommeil et votre activité. Vous obtenez votre score sur 100 et trois conseils concrets, tout de suite.</p>
            <Button size="lg" onClick={() => setStep(1)}>Commencer le test</Button>
          </div>
        ) : null}

        {step >= 1 && step <= 12 ? (
          <div className="test-q" key={step}>
            <div className="test-q-top">
              <button type="button" className="link" onClick={() => setStep(step - 1)}>← Retour</button>
              <span className="muted">Question {step} sur 12</span>
            </div>
            <div className="progress"><div className="progress-bar" style={{ width: `${((step - 1) / 12) * 100}%` }} /></div>
            <p className="eyebrow">{QUESTIONS[step - 1].topic}</p>
            <h2 className="fade-up">{QUESTIONS[step - 1].text}</h2>
            <div className="options">
              {QUESTIONS[step - 1].opts.map((o, i) => (
                <button key={i} type="button" className={`option fade-up ${answers[step - 1] === 3 - i ? 'on' : ''}`} style={{ animationDelay: `${i * 50}ms` }} onClick={() => pick(i)}>
                  <span className="option-letter">{'ABCD'[i]}</span><span>{o}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 13 ? (
          <div className="test-result">
            <ErrorBox error={error} />
            {result ? (
              <div className="grid-result">
                <div className="card center fade-up">
                  <ScoreRing score={result.score} />
                  <h1 className="h2">{levelFor(result.score)[0]}</h1>
                  <p className="muted">{levelFor(result.score)[1]}</p>
                </div>
                <div className="stack">
                  <h2>Vos 3 axes d'amélioration</h2>
                  {tipsFor(answers).map(([t, d], i) => (
                    <div className="tip-row fade-up" key={i} style={{ animationDelay: `${150 + i * 100}ms` }}>
                      <span className="tip-n">{i + 1}</span><div><strong>{t}</strong><p className="muted">{d}</p></div>
                    </div>
                  ))}
                  <Notice icon="heart"><strong>Annick reprend vos réponses lors du bilan</strong> pour construire votre plan personnalisé.</Notice>
                  {user && user.role === 'client' ? (
                    <ButtonLink to="/app/rdv" icon="calendar">Réserver mon bilan</ButtonLink>
                  ) : (
                    <>
                      <ButtonLink to={`/inscription?test=${result.id}`} icon="calendar">Créer mon compte et réserver mon bilan</ButtonLink>
                      {!contact.sent ? (
                        <form className="card stack" onSubmit={sendContact}>
                          <p><strong>Vous préférez être recontacté ?</strong></p>
                          <div className="grid-2">
                            <Field label="Prénom"><Input required value={contact.first_name} onChange={(e) => setContact({ ...contact, first_name: e.target.value })} /></Field>
                            <Field label="Téléphone ou e-mail"><Input required value={contact.contact} onChange={(e) => setContact({ ...contact, contact: e.target.value })} /></Field>
                          </div>
                          <Button variant="secondary" type="submit">Être recontacté</Button>
                        </form>
                      ) : <Notice tone="ok" icon="check">Merci ! Annick vous recontacte très vite.</Notice>}
                    </>
                  )}
                  <button type="button" className="link" onClick={() => { setStep(0); setAnswers([]); setResult(null); }}>Refaire le test</button>
                </div>
              </div>
            ) : !error ? <div className="loading"><span className="spinner" />Calcul de votre score…</div> : null}
            <p className="auth-legal"><Icon name="leaf" size={14} /> Conseils en nutrition et hygiène de vie, ne remplace pas un avis médical.</p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
