import React from "react";
import { Link } from "../../lib/router";
import PublicHeader from "./PublicHeader";
import { FooterContactDetails } from "./PublicContactDetails";
import { whatsappLink } from "../../lib/publicContact";
import "./Apropos.css";

const PILLARS = [
  {
    title: "La science",
    description:
      "Des conseils fondés sur les connaissances actuelles en nutrition, sans régime à la mode.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 3h6" />
        <path d="M10 3v6.2l-4.8 7.6A2.8 2.8 0 0 0 7.6 21h8.8a2.8 2.8 0 0 0 2.4-4.2L14 9.2V3" />
        <path d="M8 16h8" />
      </svg>
    ),
  },
  {
    title: "Le local",
    description:
      "La cuisine d'ici et les produits du marché, pour des menus faciles à suivre au quotidien.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21V10" />
        <path d="M12 13c-4.4 0-7-2.7-7-7 4.4 0 7 2.7 7 7Z" />
        <path d="M12 17c4.4 0 7-2.7 7-7-4.4 0-7 2.7-7 7Z" />
      </svg>
    ),
  },
  {
    title: "L'humain",
    description:
      "Un suivi chaque semaine, une écoute réelle et des ajustements à votre rythme.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.8 4.8a5.3 5.3 0 0 0-7.5 0L12 6.1l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-8.7a5.3 5.3 0 0 0 0-7.5Z" />
      </svg>
    ),
  },
];

const JOURNEY = [
  {
    year: "À confirmer",
    title: "Formation en nutrition",
    description: "Établissement et année à valider avec Annick.",
  },
  {
    year: "À confirmer",
    title: "Expérience professionnelle",
    description: "Parcours professionnel à valider avec Annick.",
  },
  {
    year: "2026",
    title: "Création de Vélona à Antananarivo",
    description:
      "Un accompagnement nutritionnel pensé pour le quotidien et les produits d'ici.",
  },
];

export default function Apropos() {
  return (
    <div className="vac-home vac-about-page">
      <PublicHeader activePath="/a-propos" />

      <main>
        <section className="about-intro">
          <div className="vac-container about-intro-inner">
            <div className="about-intro-copy">
              <p className="about-kicker">À propos</p>
              <h1 className="vac-h1">Annick Tchuidjang</h1>
              <p className="about-role">
                Nutritionniste, fondatrice de Vélona
              </p>
              <blockquote className="about-quote">
                « Je crois qu&apos;on peut bien manger avec ce qu&apos;on trouve au
                marché, sans se priver et sans se compliquer la vie. Mon rôle,
                c&apos;est de vous montrer comment, et de rester à vos côtés jusqu&apos;au
                résultat. »
              </blockquote>
              <p className="about-quote-note">Citation à valider avec Annick</p>
              <a
                className="btn btn-primary"
                href={whatsappLink(
                  "Bonjour Vélona, je souhaite échanger avec Annick au sujet d'un bilan nutritionnel."
                )}
                target="_blank"
                rel="noreferrer"
              >
                Parler avec Annick
              </a>
            </div>

            <div className="about-intro-image">
              <div aria-hidden="true" />
              <img
                src="/assets/b6e44ca90dfa7a2c0b07f1af5853d642.jpg"
                alt="Annick Tchuidjang, nutritionniste, fondatrice de Vélona"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </div>
        </section>

        <section className="about-purpose">
          <div className="vac-container">
            <div className="about-purpose-copy fade-up">
              <p className="about-kicker">Pourquoi Vélona ?</p>
              <p className="about-word">vélona</p>
              <p className="about-word-meaning">
                en malgache : <strong>vivant, en vie</strong>
              </p>
              <p>
                C&apos;est ce que nous souhaitons à chacun : se sentir pleinement
                vivant, plein d&apos;énergie, grâce à une alimentation qui lui
                ressemble.
              </p>
            </div>
          </div>
        </section>

        <section className="about-pillars">
          <div className="vac-container">
            <div className="about-section-heading">
              <p className="about-kicker">Notre approche</p>
              <h2 className="vac-h2">Trois piliers</h2>
            </div>
            <div className="about-pillars-grid">
              {PILLARS.map((pillar) => (
                <article className="about-pillar fade-up" key={pillar.title}>
                  <span className="about-pillar-icon">{pillar.icon}</span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-journey">
          <div className="vac-container about-journey-inner">
            <div className="about-journey-image fade-up">
              <div aria-hidden="true" />
              <img
                src="/assets/b6e44ca90dfa7a2c0b07f1af5853d642.jpg"
                alt="Annick Tchuidjang au cabinet Vélona"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="about-timeline">
              <p className="about-kicker">Son histoire</p>
              <h2 className="vac-h2">Parcours</h2>
              <p className="about-timeline-intro">
                Les détails de formation et d&apos;expérience seront publiés après
                validation par Annick.
              </p>
              <ol>
                {JOURNEY.map((item) => (
                  <li className="about-timeline-item" key={item.title}>
                    <p className="about-timeline-year">{item.year}</p>
                    <div className="about-timeline-copy">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="about-cta">
          <div className="vac-container">
            <div className="about-cta-card">
              <p className="about-kicker">Premier échange</p>
              <h2 className="vac-h2">Envie d&apos;en parler avec Annick ?</h2>
              <p>
                Faites le point sur votre objectif et choisissez le prochain
                pas qui vous convient.
              </p>
              <a
                className="btn btn-white"
                href={whatsappLink(
                  "Bonjour Vélona, je souhaite réserver mon bilan avec Annick."
                )}
                target="_blank"
                rel="noreferrer"
              >
                Réserver mon bilan
              </a>
            </div>
          </div>
        </section>
      </main>

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
