import React from "react";
import { Link } from "../../lib/router";
import { ButtonLink } from "../../ui/kit";
import { Icon } from "../../ui/icons";

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
    a: "Paiement par mobile money ou carte bancaire, selon la formule choisie.",
  },
];

export default function Contact() {
  return (
    <div className="vac-home">
      <header className="vac-header">
        <div className="vac-header-inner">
          <Link to="/" className="vac-brand" aria-label="Vélona, accueil">
            <img src="/symbol.png" alt="" width="30" height="30" />
            <img src="/wordmark.png" alt="Vélona" height="22" />
          </Link>
          <nav className="vac-nav" aria-label="Navigation principale">
            <Link to="/" className="vac-nav-link">
              Accueil
            </Link>
            <Link to="/methode" className="vac-nav-link">
              Notre méthode
            </Link>
            <Link to="/programmes" className="vac-nav-link">
              Programmes
            </Link>
            <Link to="/repas" className="vac-nav-link">
              Repas livrés
            </Link>
            <Link to="/a-propos" className="vac-nav-link">
              À propos
            </Link>
            <Link to="/contact" className="vac-nav-link vac-nav-link-active">
              FAQ & contact
            </Link>
          </nav>
          <ButtonLink to="/test" variant="primary">
            Faire le test gratuit
          </ButtonLink>
        </div>
      </header>

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
          {FAQS.map((faq, i) => (
            <div className="vac-faq-card fade-up" key={i}>
              <h3 className="vac-faq-question">{faq.q}</h3>
              <p className="vac-faq-reponse">{faq.a}</p>
            </div>
          ))}
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
                <p className="vac-contact-value">[NUMÉRO]</p>
              </div>
            </div>
            <div className="vac-contact-item">
              <Icon name="message" size={20} />
              <div>
                <p className="vac-contact-label">E-mail</p>
                <p className="vac-contact-value">[ADRESSE]</p>
              </div>
            </div>
            <div className="vac-contact-item">
              <Icon name="map-pin" size={20} />
              <div>
                <p className="vac-contact-label">Livraison</p>
                <p className="vac-contact-value">Antananarivo centre</p>
              </div>
            </div>
          </div>
          <div className="vac-contact-form">
            <form className="vac-contact-form-inner">
              <div className="vac-field">
                <label className="vac-field-label">Votre nom</label>
                <input
                  className="vac-field-input"
                  type="text"
                  placeholder="Jean Rakoto"
                />
              </div>
              <div className="vac-field">
                <label className="vac-field-label">Votre e-mail</label>
                <input
                  className="vac-field-input"
                  type="email"
                  placeholder="jean@example.com"
                />
              </div>
              <div className="vac-field">
                <label className="vac-field-label">Votre message</label>
                <textarea
                  className="vac-field-textarea"
                  rows={4}
                  placeholder="Décrivez votre besoin…"
                />
              </div>
              <ButtonLink
                to="/test"
                variant="primary"
                className="vac-submit-btn"
              >
                Envoyer le message
              </ButtonLink>
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
            <ButtonLink
              to="/contact"
              variant="white"
              className="vac-cta-btn-second"
            >
              Réserver un bilan
            </ButtonLink>
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
                WhatsApp : [NUMÉRO]
                <br />
                E-mail : [ADRESSE]
                <br />
                Livraison : Antananarivo centre
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
