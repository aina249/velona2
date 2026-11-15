import React, { useId, useState } from "react";
import { Link } from "../../lib/router";
import { ButtonLink } from "../../ui/kit";
import { Icon } from "../../ui/icons";
import {
  PRACTICAL_INFORMATION,
  PUBLIC_CONTACT,
  whatsappLink,
} from "../../lib/publicContact";
import PublicHeader from "./PublicHeader";
import {
  EmailLink,
  FooterContactDetails,
  WhatsAppLink,
} from "./PublicContactDetails";

const FAQS = [
  {
    q: "Qu'est-ce que le test de vitalité ?",
    a: "Un questionnaire de 12 questions sur votre énergie, vos repas, votre sommeil et votre activité. Vous obtenez un score sur 100 et trois conseils concrets, gratuitement en 3 minutes.",
  },
  {
    q: "Comment se déroule un bilan nutritionnel ?",
    a: "Une heure au cabinet ou en visio avec Annick pour comprendre vos objectifs, vos habitudes et fixer un objectif chiffré personnalisé.",
  },
  {
    q: "Les repas sont-ils livrés partout ?",
    a: "La livraison couvre Antananarivo centre. Les repas sont préparés avec les produits du marché et livrés selon la formule choisie.",
  },
  {
    q: "Puis-je adapter les menus à mes allergies ?",
    a: "Oui. Chaque programme et chaque formule repas tient compte de vos allergies et préférences alimentaires.",
  },
  {
    q: "Comment fonctionne le suivi hebdomadaire ?",
    a: "Un check-in de 2 minutes sur l'application chaque semaine. Annick vous répond sous 24 h et ajuste votre plan au fil des progrès.",
  },
  {
    q: "Quels sont les moyens de paiement ?",
    a: "Le règlement peut se faire par Mobile Money (MVola, Orange Money ou Airtel Money), en espèces ou par virement. Après paiement, indiquez votre référence afin qu’elle soit confirmée.",
  },
];

function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  const answerId = useId();

  return (
    <div className={`vac-faq-card fade-up${isOpen ? " is-open" : ""}`}>
      <h3 className="vac-faq-question">
        <button
          type="button"
          className="vac-faq-trigger"
          aria-expanded={isOpen}
          aria-controls={answerId}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span>{question}</span>
          <Icon name="chevron" size={20} className="vac-faq-chevron" />
        </button>
      </h3>
      <div id={answerId} className="vac-faq-answer" aria-hidden={!isOpen}>
        <p>{answer}</p>
      </div>
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(event) {
    event.preventDefault();
    const lines = [
      "Bonjour Vélona,",
      "",
      `Nom : ${form.name.trim()}`,
      form.email.trim() ? `E-mail : ${form.email.trim()}` : null,
      "",
      `Message : ${form.message.trim()}`,
    ].filter(Boolean);

    window.open(whatsappLink(lines.join("\n")), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="vac-home">
      <PublicHeader activePath="/contact" />

      <section className="vac-hero">
        <div className="vac-hero-text">
          <p className="vac-eyebrow">
            Nutrition & hygiène de vie · Antananarivo
          </p>
          <h1 className="vac-h1">
            FAQ & contact.
            <br />
            <span style={{ color: "#C25E33" }}>
              Vous avez une question ? Nous avons la réponse.
            </span>
          </h1>
          <p className="vac-lead">
            Retrouvez ici les réponses aux questions les plus fréquentes, et nos
            coordonnées pour nous joindre directement.
          </p>
        </div>
        <div className="vac-hero-art">
          <img
            src="/assets/35934aa8a3521032d36867936477fe43.jpg"
            alt="Écran Messages de l'application Vélona"
            className="vac-hero-img"
          />
        </div>
      </section>

      <section className="vac-container">
        <div className="vac-section-head vac-text-center">
          <p className="vac-eyebrow">Foire aux questions</p>
          <h2 className="vac-h2">Tout ce que vous voulez savoir</h2>
        </div>
        <div className="vac-faq-grid">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>

      <section className="vac-practical">
        <div className="vac-container">
          <div className="vac-section-head vac-text-center">
            <p className="vac-eyebrow">Informations pratiques</p>
            <h2 className="vac-h2">Tout est prêt pour votre premier bilan</h2>
          </div>
          <div className="vac-practical-grid">
            <article className="vac-practical-card fade-up">
              <Icon name="calendar" size={28} />
              <h3>Votre bilan</h3>
              <p>{PRACTICAL_INFORMATION.consultation}</p>
            </article>
            <article className="vac-practical-card fade-up">
              <Icon name="clock" size={28} />
              <h3>Horaires</h3>
              <p>{PRACTICAL_INFORMATION.schedule}</p>
            </article>
            <article className="vac-practical-card fade-up">
              <Icon name="pin" size={28} />
              <h3>Réserver sereinement</h3>
              <p>{PRACTICAL_INFORMATION.booking}</p>
            </article>
            <article className="vac-practical-card fade-up">
              <Icon name="invoice" size={28} />
              <h3>Paiement</h3>
              <p>{PRACTICAL_INFORMATION.payment}</p>
            </article>
          </div>
          <div className="vac-practical-cta">
            <a
              className="btn btn-p"
              href={whatsappLink("Bonjour Vélona, je souhaite demander un créneau pour un bilan nutritionnel.")}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="calendar" size={19} />
              Demander un créneau sur WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="vac-container">
        <div className="vac-section-head">
          <div>
            <p className="vac-eyebrow">Contactez-nous</p>
            <h2 className="vac-h2">Parlons de votre projet</h2>
          </div>
        </div>
        <div className="vac-contact-row">
          <div className="vac-contact-info">
            <div className="vac-contact-item">
              <Icon name="phone" size={20} />
              <div>
                <p className="vac-contact-label">WhatsApp</p>
                <p className="vac-contact-value">
                  <WhatsAppLink
                    className="vac-contact-value-link"
                    message="Bonjour Vélona, j'aimerais avoir plus d'informations."
                  />
                </p>
              </div>
            </div>
            <div className="vac-contact-item">
              <Icon name="pin" size={20} />
              <div>
                <p className="vac-contact-label">Cabinet</p>
                <p className="vac-contact-value">
                  {PUBLIC_CONTACT.cabinetAddress}
                </p>
              </div>
            </div>
            <div className="vac-contact-item">
              <Icon name="message" size={20} />
              <div>
                <p className="vac-contact-label">E-mail</p>
                <p className="vac-contact-value">
                  <EmailLink className="vac-contact-value-link" />
                </p>
              </div>
            </div>
            <div className="vac-contact-item">
              <Icon name="truck" size={20} />
              <div>
                <p className="vac-contact-label">Livraison</p>
                <p className="vac-contact-value">
                  {PUBLIC_CONTACT.deliveryArea}
                </p>
              </div>
            </div>
          </div>
          <div className="vac-contact-form">
            <form className="vac-contact-form-inner" onSubmit={handleSubmit}>
              <div className="vac-field">
                <label className="vac-field-label" htmlFor="contact-name">
                  Votre nom
                </label>
                <input
                  id="contact-name"
                  className="vac-field-input"
                  type="text"
                  placeholder="Jean Rakoto"
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </div>
              <div className="vac-field">
                <label className="vac-field-label" htmlFor="contact-email">
                  Votre e-mail <span aria-hidden="true">(facultatif)</span>
                </label>
                <input
                  id="contact-email"
                  className="vac-field-input"
                  type="email"
                  placeholder="jean@example.com"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </div>
              <div className="vac-field">
                <label className="vac-field-label" htmlFor="contact-message">
                  Votre message
                </label>
                <textarea
                  id="contact-message"
                  className="vac-field-textarea"
                  rows={4}
                  placeholder="Décrivez votre besoin…"
                  required
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, message: event.target.value }))
                  }
                />
              </div>
              <button type="submit" className="btn btn-p vac-submit-btn">
                <Icon name="message" size={19} />
                Envoyer sur WhatsApp
              </button>
              <p className="vac-contact-form-note">
                Votre message s’ouvrira dans WhatsApp ; aucune donnée n’est
                enregistrée par ce formulaire.
              </p>
            </form>
          </div>
        </div>
      </section>

      <section className="vac-cta-final">
        <div className="vac-cta-card">
          <img
            src="/assets/e0ef5960ad04c4b8d8720d585ca27240.png"
            alt=""
            className="vac-cta-logo"
          />
          <h2 className="vac-h2 vac-white">Prêt à commencer ?</h2>
          <p className="vac-lead vac-white-soft">
            Faites le test de vitalité en 3 minutes, puis réservez votre bilan
            avec Annick.
          </p>
          <div className="vac-cta-actions">
            <ButtonLink to="/test" variant="white">
              Faire le test
            </ButtonLink>
            <a
              className="btn btn-w vac-cta-btn-second"
              href={whatsappLink("Bonjour Vélona, je souhaite réserver un bilan nutritionnel.")}
              target="_blank"
              rel="noreferrer"
            >
              Réserver un bilan
            </a>
          </div>
        </div>
      </section>

      <footer className="vac-footer">
        <div className="vac-container">
          <div className="vac-footer-grid">
            <div>
              <p className="vac-footer-brand">Vélona</p>
              <p className="vac-footer-desc">
                Nutrition & hygiène de vie, à Antananarivo.
              </p>
            </div>
            <div>
              <p className="vac-footer-title">Le site</p>
              <div className="vac-footer-links">
                <Link to="/methode" className="vac-footer-link">
                  Notre méthode
                </Link>
                <Link to="/programmes" className="vac-footer-link">
                  Programmes
                </Link>
                <Link to="/repas" className="vac-footer-link">
                  Repas livrés
                </Link>
                <Link to="/a-propos" className="vac-footer-link">
                  À propos
                </Link>
              </div>
            </div>
            <div>
              <p className="vac-footer-title">Contact</p>
              <p className="vac-footer-desc">
                <FooterContactDetails />
              </p>
            </div>
            <div>
              <p className="vac-footer-title">Suivez-nous</p>
              <p className="vac-footer-desc">
                Instagram · Facebook · TikTok
                <br />
                @velona
              </p>
            </div>
          </div>
          <div className="vac-footer-bottom">
            <p className="vac-footer-legal">
              Conseils en nutrition et hygiène de vie, ne remplace pas un avis
              médical.
            </p>
            <div className="vac-footer-legal-links">
              <Link to="/contact" className="vac-footer-link">
                Confidentialité
              </Link>
              <span style={{ color: "#B8B3A9", margin: "0 6px" }}>·</span>
              <Link to="/contact" className="vac-footer-link">
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
