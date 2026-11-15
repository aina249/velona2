import React from "react";
import { Link } from "../../lib/router";
import { ButtonLink } from "../../ui/kit";
import { Icon } from "../../ui/icons";
import PublicHeader from "./PublicHeader";
import { FooterContactDetails } from "./PublicContactDetails";
import { whatsappLink } from "../../lib/publicContact";

export default function Programmes() {
  return (
    <div className="vac-home">
      <PublicHeader activePath="/programmes" />

      <section className="vac-hero">
        <div className="vac-hero-text">
          <p className="vac-eyebrow">
            Nutrition & hygiène de vie · Antananarivo
          </p>
          <h1 className="vac-h1">
            Nos programmes.
            <br />
            <span style={{ color: "#C25E33" }}>
              Un objectif chiffré, un suivi jusqu'au résultat.
            </span>
          </h1>
          <p className="vac-lead">
            Choisissez la formule qui vous correspond. Chaque programme inclut
            un bilan personnalisé, un suivi hebdomadaire avec Annick, et un
            accès à l'application Vélona.
          </p>
        </div>
        <div className="vac-hero-art">
          <img
            src="/assets/5e5d6aa832fba37544447d717c4d883d.jpg"
            alt="Tableau de bord client de l'application Vélona"
            className="vac-hero-img"
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </section>

      <section className="vac-container">
        <div className="vac-section-head vac-text-center">
          <p className="vac-eyebrow">Nos programmes</p>
          <h2 className="vac-h2">
            30, 60 ou 90 jours pour transformer votre alimentation
          </h2>
        </div>
        <div className="vac-programmes-grid">
          <div className="vac-programme-card fade-up">
            <div className="vac-programme-header">
              <span className="vac-programme-duration">30 jours</span>
              <span className="vac-programme-price">180 000 Ar</span>
            </div>
            <h3 className="vac-programme-title">Essentiel</h3>
            <p className="vac-programme-desc">
              Pour démarrer : bilan nutritionnel, 4 check-ins hebdomadaires, et
              un plan alimentaire sur mesure.
            </p>
            <ul className="vac-programme-list">
              <li>Bilan nutritionnel de 60 min</li>
              <li>4 check-ins (1 par semaine)</li>
              <li>Plan alimentaire personnalisé</li>
              <li>Accès à l'application Vélona</li>
              <li>Support par messagerie</li>
            </ul>
            <a
              href={whatsappLink("Bonjour Vélona, je souhaite choisir le programme Essentiel de 30 jours.")}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
            >
              Choisir Essentiel
            </a>
          </div>
          <div className="vac-programme-card vac-programme-card-featured fade-up">
            <div className="vac-programme-badge">Le plus populaire</div>
            <div className="vac-programme-header">
              <span className="vac-programme-duration">60 jours</span>
              <span className="vac-programme-price">320 000 Ar</span>
            </div>
            <h3 className="vac-programme-title">Équilibre</h3>
            <p className="vac-programme-desc">
              Pour aller plus loin : bilan nutritionnel, 8 check-ins, suivi des
              repas, et ajustements de votre programme.
            </p>
            <ul className="vac-programme-list">
              <li>Bilan nutritionnel de 60 min</li>
              <li>8 check-ins (2 par semaine)</li>
              <li>Plan alimentaire personnalisé</li>
              <li>Suivi des repas et photos</li>
              <li>Accès à l'application Vélona</li>
              <li>Support par messagerie prioritaire</li>
            </ul>
            <a
              href={whatsappLink("Bonjour Vélona, je souhaite choisir le programme Équilibre de 60 jours.")}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Choisir Équilibre
            </a>
          </div>
          <div className="vac-programme-card fade-up">
            <div className="vac-programme-header">
              <span className="vac-programme-duration">90 jours</span>
              <span className="vac-programme-price">450 000 Ar</span>
            </div>
            <h3 className="vac-programme-title">Sérénité</h3>
            <p className="vac-programme-desc">
              Pour un résultat durable : bilan nutritionnel, 12 check-ins, suivi
              complet, et repas livrés en option.
            </p>
            <ul className="vac-programme-list">
              <li>Bilan nutritionnel de 60 min</li>
              <li>12 check-ins (3 par semaine)</li>
              <li>Plan alimentaire personnalisé</li>
              <li>Suivi complet des repas</li>
              <li>Accès à l'application Vélona</li>
              <li>Support par messagerie prioritaire</li>
              <li>Option repas livrés</li>
            </ul>
            <a
              href={whatsappLink("Bonjour Vélona, je souhaite choisir le programme Sérénité de 90 jours.")}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
            >
              Choisir Sérénité
            </a>
          </div>
        </div>
      </section>

      <section className="vac-cta-final">
        <div className="vac-cta-card">
          <img
            src="/assets/e0ef5960ad04c4b8d8720d585ca27240.png"
            alt=""
            className="vac-cta-logo"
            loading="lazy"
            decoding="async"
          />
          <h2 className="vac-h2 vac-white">Prêt à commencer ?</h2>
          <p className="vac-lead vac-white-soft">
            Faites d'abord le test de vitalité pour connaître votre score, puis
            choisissez votre programme.
          </p>
          <div className="vac-cta-actions">
            <ButtonLink to="/test" variant="white">
              Faire le test de vitalité
            </ButtonLink>
            <a
              href={whatsappLink("Bonjour Vélona, je souhaite réserver un bilan nutritionnel.")}
              target="_blank"
              rel="noreferrer"
              className="btn btn-white"
              style={{ marginLeft: "12px" }}
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
