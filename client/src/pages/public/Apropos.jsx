import React from "react";
import { Link } from "../../lib/router";
import { ButtonLink } from "../../ui/kit";
import { Icon } from "../../ui/icons";
import PublicHeader from "./PublicHeader";

export default function Apropos() {
  return (
    <div className="vac-home">
      <PublicHeader activePath="/a-propos" />

      <section className="vac-hero">
        <div className="vac-hero-text">
          <p className="vac-eyebrow">
            Nutrition & hygiène de vie · Antananarivo
          </p>
          <h1 className="vac-h1">
            À propos de Vélona.
            <br />
            <span style={{ color: "#C25E33" }}>
              Une nutrition humaine, pas un algorithme.
            </span>
          </h1>
          <p className="vac-lead">
            Vélona a été fondée par Annick Tchuidjang, nutritionniste, pour
            offrir un accompagnement personnalisé fondé sur la science, les
            produits du marché et l'humain.
          </p>
        </div>
        <div className="vac-hero-art">
          <img
            src="/assets/b6e44ca90dfa7a2c0b07f1af5853d642.jpg"
            alt="Annick Tchuidjang, nutritionniste, au cabinet Vélona"
            className="vac-hero-img"
          />
        </div>
      </section>

      <section className="vac-container">
        <div className="vac-section-head">
          <div>
            <p className="vac-eyebrow">Votre nutritionniste</p>
            <h2 className="vac-h2">Annick Tchuidjang</h2>
          </div>
          <ButtonLink to="/contact" variant="outline">
            Réserver un bilan avec Annick
          </ButtonLink>
        </div>
        <div className="vac-apropos-row">
          <div className="vac-apropos-img">
            <div className="vac-apropos-bg" />
            <img
              src="/assets/b6e44ca90dfa7a2c0b07f1af5853d642.jpg"
              alt="Annick Tchuidjang, nutritionniste, au cabinet Vélona"
            />
            <div className="vac-apropos-badge">
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "#2E9E6A",
                  display: "inline-block",
                }}
              />
              <span style={{ fontWeight: "600", fontSize: "15px" }}>
                Répond sous 24 h
              </span>
            </div>
          </div>
          <div className="vac-apropos-text">
            <p
              className="vac-apropos-sub"
              style={{ fontWeight: "600", color: "#4A4843" }}
            >
              Nutritionniste, fondatrice de Vélona
            </p>
            <p className="vac-apropos-desc">
              « Velona » veut dire « vivant » en malgache. C'est ce qu'Annick
              souhaite à chacun de ses clients : se sentir pleinement vivant,
              grâce à une alimentation qui lui ressemble.
            </p>
            <p className="vac-apropos-desc">
              Une nutrition fondée sur la science, les produits du marché, et un
              accompagnement humain chaque semaine.
            </p>
            <div className="vac-apropos-cta">
              <ButtonLink to="/contact" variant="primary">
                Réserver mon bilan avec Annick
              </ButtonLink>
              <ButtonLink to="/methode" variant="outline">
                Découvrir son approche
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="vac-container">
        <div className="vac-section-head vac-text-center">
          <p className="vac-eyebrow">Notre philosophie</p>
          <h2 className="vac-h2">Pourquoi Vélona est différent</h2>
        </div>
        <div className="vac-philosophie-grid">
          <div className="vac-philosophie-card fade-up">
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C25E33"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 18 L9 12 L13 15 L20 6" />
              <path d="M15 6 H20 V11" />
            </svg>
            <h3 className="vac-philosophie-title">Un accompagnement humain</h3>
            <p className="vac-philosophie-desc">
              Annick lit chaque check-in, ajuste vos menus et vous motive au
              quotidien. La technologie sert à gagner du temps pour l'humain.
            </p>
          </div>
          <div className="vac-philosophie-card fade-up">
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C25E33"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3 C 12 3, 5 11, 5 15 A 7 7 0 0 0 19 15 C 19 11, 12 3, 12 3 Z" />
            </svg>
            <h3 className="vac-philosophie-title">Fondé sur la science</h3>
            <p className="vac-philosophie-desc">
              Une nutrition basée sur des preuves scientifiques, adaptée à votre
              métabolisme et vos objectifs.
            </p>
          </div>
          <div className="vac-philosophie-card fade-up">
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C25E33"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20 C 6 16, 3 12, 3 8.5 A 4.5 4.5 0 0 1 12 6 A 4.5 4.5 0 0 1 21 8.5 C 21 12, 18 16, 12 20 Z" />
            </svg>
            <h3 className="vac-philosophie-title">Produits du marché</h3>
            <p className="vac-philosophie-desc">
              Des ingrédients locaux, frais et de saison, pour une alimentation
              qui respecte votre territoire.
            </p>
          </div>
          <div className="vac-philosophie-card fade-up">
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C25E33"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M13 2 L5 13 H11 L10 22 L19 10 H13 Z" />
            </svg>
            <h3 className="vac-philosophie-title">Sans régime extrême</h3>
            <p className="vac-philosophie-desc">
              Perdez du poids durablement, à votre rythme, sans privation ni
              effet yo-yo.
            </p>
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
          <h2 className="vac-h2 vac-white">Prêt à vous sentir vivant ?</h2>
          <p className="vac-lead vac-white-soft">
            Commencez par le test de vitalité : 3 minutes, gratuit, résultat
            immédiat.
          </p>
          <ButtonLink to="/test" variant="white">
            Faire mon test de vitalité
          </ButtonLink>
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
