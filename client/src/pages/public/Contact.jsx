import React, { useId, useState } from "react";
import { ButtonLink } from "../../ui/kit";
import { PUBLIC_CONTACT, whatsappLink } from "../../lib/publicContact";
import PublicFooter from "./PublicFooter";
import PublicHeader from "./PublicHeader";
import { EmailLink, WhatsAppLink } from "./PublicContactDetails";

const FAQS = [
  ["Comment se passe le bilan ?", "Le bilan dure environ une heure, au cabinet ou en visio. Annick fait le point avec vous sur vos habitudes, vos contraintes et votre objectif."],
  ["Le suivi est-il en ligne ?", "Oui. Après le bilan, un check-in hebdomadaire dans l'application permet de suivre vos progrès et d'ajuster votre plan."],
  ["Où livrez-vous les repas ?", "Les repas sont livrés à Antananarivo centre. Les jours et quartiers desservis sont confirmés avec vous lors de la commande."],
  ["Comment payer ?", "Le règlement peut se faire par Mobile Money, en espèces ou par virement. Les modalités vous sont confirmées avant le démarrage."],
  ["Puis-je arrêter mon programme ?", "Oui. Le programme est construit avec vous : nous faisons le point ensemble si votre situation ou votre objectif évolue."],
  ["Vélona remplace-t-il mon médecin ?", "Non. Vélona propose un accompagnement en nutrition et hygiène de vie, sans diagnostic ni modification de traitement médical."],
  ["Que deviennent mes données ?", "Vos informations servent uniquement à organiser votre accompagnement nutritionnel. Elles ne sont jamais revendues ni utilisées à d'autres fins."],
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  const answerId = useId();
  return (
    <article className={`contact-faq-item${open ? " is-open" : ""}`}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={answerId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{question}</span>
          <span className="contact-faq-sign" aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
      </h3>
      <div id={answerId} className="contact-faq-answer" hidden={!open}>
        <p>{answer}</p>
      </div>
    </article>
  );
}

export default function Contact() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    format: "cabinet",
    objective: "",
    consent: false,
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  function submitReservation(event) {
    event.preventDefault();
    const format = form.format === "cabinet" ? "Au cabinet" : "En visio";
    const message = [
      "Bonjour Vélona, je souhaite réserver mon bilan.",
      "",
      `Prénom : ${form.firstName.trim()}`,
      `Nom : ${form.lastName.trim()}`,
      `Téléphone / WhatsApp : ${form.phone.trim()}`,
      `Format souhaité : ${format}`,
      form.objective.trim() ? `Objectif : ${form.objective.trim()}` : null,
    ].filter(Boolean).join("\n");
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="vac-home vac-contact-page">
      <PublicHeader activePath="/contact" />

      <main>
        <section className="contact-hero">
          <div className="vac-container">
            <p className="vac-eyebrow">FAQ &amp; contact</p>
            <h1>Une question ? Parlons-en.</h1>
            <p>Réservez votre bilan ou écrivez-nous : réponse sous 24 h.</p>
          </div>
        </section>

        <section className="contact-reservation">
          <div className="vac-container contact-reservation-grid">
            <form className="contact-reservation-form" onSubmit={submitReservation}>
              <h2>Réserver mon bilan</h2>
              <div className="contact-form-two-columns">
                <label>
                  <span>Prénom</span>
                  <input
                    required
                    value={form.firstName}
                    onChange={(event) => update("firstName", event.target.value)}
                    placeholder="Votre prénom"
                    autoComplete="given-name"
                  />
                </label>
                <label>
                  <span>Nom</span>
                  <input
                    required
                    value={form.lastName}
                    onChange={(event) => update("lastName", event.target.value)}
                    placeholder="Votre nom"
                    autoComplete="family-name"
                  />
                </label>
              </div>
              <label>
                <span>Téléphone / WhatsApp</span>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  placeholder="+261 …"
                  autoComplete="tel"
                />
              </label>
              <fieldset className="contact-format">
                <legend>Format du bilan</legend>
                <div>
                  <button
                    type="button"
                    className={form.format === "cabinet" ? "is-selected" : ""}
                    aria-pressed={form.format === "cabinet"}
                    onClick={() => update("format", "cabinet")}
                  >
                    Au cabinet
                  </button>
                  <button
                    type="button"
                    className={form.format === "visio" ? "is-selected" : ""}
                    aria-pressed={form.format === "visio"}
                    onClick={() => update("format", "visio")}
                  >
                    En visio
                  </button>
                </div>
              </fieldset>
              <label>
                <span>Votre objectif <em>(facultatif)</em></span>
                <textarea
                  rows="4"
                  value={form.objective}
                  onChange={(event) => update("objective", event.target.value)}
                  placeholder="Ex. : perdre du poids, retrouver de l'énergie…"
                />
              </label>
              <label className="contact-consent">
                <input
                  required
                  type="checkbox"
                  checked={form.consent}
                  onChange={(event) => update("consent", event.target.checked)}
                />
                <span>J&apos;accepte que mes données soient utilisées pour organiser mon bilan et mon suivi nutritionnel.</span>
              </label>
              <button className="btn btn-p" type="submit">Envoyer ma demande</button>
            </form>

            <aside className="contact-side-stack">
              <section className="contact-details-card">
                <div className="contact-expert">
                  <img src="/assets/b6e44ca90dfa7a2c0b07f1af5853d642.jpg" alt="Annick Tchuidjang" />
                  <p><strong>Annick Tchuidjang</strong><span>Nutritionniste · répond sous 24 h</span></p>
                </div>
                <h2>Nous joindre</h2>
                <dl>
                  <div><dt>WhatsApp</dt><dd><WhatsAppLink message="Bonjour Vélona, j'aimerais avoir plus d'informations." /></dd></div>
                  <div><dt>E-mail</dt><dd><EmailLink /></dd></div>
                  <div><dt>Cabinet</dt><dd>{PUBLIC_CONTACT.cabinetAddress}</dd></div>
                </dl>
              </section>
              <section className="contact-test-card">
                <h2>Pas encore sûr ?</h2>
                <p>Faites d&apos;abord le test de vitalité, gratuit et en 3 minutes.</p>
                <ButtonLink to="/test" variant="primary">Faire le test</ButtonLink>
              </section>
            </aside>
          </div>
        </section>

        <section className="contact-faq">
          <div className="vac-container">
            <h2>Questions fréquentes</h2>
            <div className="contact-faq-list">
              {FAQS.map(([question, answer]) => <FaqItem key={question} question={question} answer={answer} />)}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
