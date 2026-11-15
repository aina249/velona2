import React from "react";
import { Link } from "../../lib/router";
import { ButtonLink } from "../../ui/kit";
import { whatsappLink } from "../../lib/publicContact";
import PublicHeader from "./PublicHeader";
import { FooterContactDetails } from "./PublicContactDetails";
import Reveal from "./Reveal";

export default function Methode() {
  return (
    <div className="vac-home">
      <PublicHeader activePath="/methode" />

      {/* Présentation */}
      <Reveal as="section" className="methode-hero">
        <div className="methode-hero-inner">
          <div className="methode-hero-text">
            <p className="methode-eyebrow">Notre méthode</p>
            <h1 className="methode-h1">
              Un accompagnement simple, régulier et mesurable
            </h1>
            <p className="methode-lead">
              Inspirée des meilleurs programmes de nutrition au monde, adaptée à
              la cuisine et au rythme de vie d'Antananarivo.
            </p>
          </div>
          <div className="methode-hero-art">
            <img
              src="/assets/942d99f8b39ecd234f5a51825e0a4df4.jpg"
              alt="Écran Test de vitalité"
              className="methode-hero-img"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </Reveal>

      {/* Étape 01 — Test de vitalité */}
      <Reveal as="section" className="methode-step">
        <div className="methode-step-inner">
          <div className="methode-step-content">
            <div className="methode-step-badge">01</div>
            <h2 className="methode-step-title">Le test de vitalité</h2>
            <ul className="methode-step-list">
              <li>
                12 questions sur votre énergie, vos repas, votre sommeil et
                votre activité.
              </li>
              <li>
                En 3 minutes, vous obtenez un score sur 100 et trois axes
                concrets pour progresser.
              </li>
              <li>
                C'est gratuit, sans engagement, et c'est le point de départ de
                votre bilan.
              </li>
            </ul>
            <ButtonLink
              to="/test"
              variant="primary"
              className="methode-step-btn"
            >
              Faire le test
            </ButtonLink>
          </div>
          <div className="methode-step-art">
            <img
              src="/assets/f91289445a3f709ebc8cfed53319cf69.jpg"
              alt="Résultat du test de vitalité"
              className="methode-step-img"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </Reveal>

      {/* Étape 02 — Bilan personnalisé */}
      <Reveal as="section" className="methode-step methode-step-alt">
        <div className="methode-step-inner">
          <div className="methode-step-content">
            <div className="methode-step-badge">02</div>
            <h2 className="methode-step-title">Le bilan personnalisé</h2>
            <ul className="methode-step-list">
              <li>Une heure avec Annick, au cabinet ou en visio.</li>
              <li>
                On fait le point sur vos habitudes, votre mode de vie, vos
                contraintes et vos mesures.
              </li>
              <li>Un objectif chiffré et réaliste.</li>
              <li>Un plan alimentaire avec les produits d'ici.</li>
              <li>Le programme qui vous correspond : 30, 60 ou 90 jours.</li>
            </ul>
            <a
              href={whatsappLink(
                "Bonjour Vélona, je souhaite réserver mon bilan personnalisé."
              )}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary methode-step-btn"
            >
              <span>Réserver mon bilan</span>
            </a>
          </div>
          <div className="methode-step-art">
            <div className="methode-step-duo">
              <img
                src="/assets/b6e44ca90dfa7a2c0b07f1af5853d642.jpg"
                alt="Annick Tchuidjang, nutritionniste"
                className="methode-step-img methode-step-img-main"
                loading="lazy"
                decoding="async"
              />
              <img
                src="/assets/e1683b31616d5b21b789bfb8336e6a18.jpg"
                alt="Écran de réservation du bilan"
                className="methode-step-img methode-step-img-side"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* Étape 03 — Suivi chaque semaine */}
      <Reveal as="section" className="methode-step">
        <div className="methode-step-inner">
          <div className="methode-step-content">
            <div className="methode-step-badge">03</div>
            <h2 className="methode-step-title">Le suivi chaque semaine</h2>
            <ul className="methode-step-list">
              <li>
                Chaque semaine, un check-in de 2 minutes sur l'application :
                poids, tour de taille, énergie, sommeil, photo d'un repas.
              </li>
              <li>
                Annick suit vos courbes, ajuste votre plan et répond à vos
                questions sous 24 h.
              </li>
              <li>C'est la régularité qui fait le résultat.</li>
            </ul>
          </div>
          <div className="methode-step-art">
            <div className="methode-step-duo">
              <img
                src="/assets/16e40a1b88fa7643b2dc9ffa0962cd58.jpg"
                alt="Écran Check-in hebdomadaire"
                className="methode-step-img methode-step-img-main"
                loading="lazy"
                decoding="async"
              />
              <img
                src="/assets/6d8aea6bbdc9c39dbba7cae5a7494c89.jpg"
                alt="Écran de suivi détaillé"
                className="methode-step-img methode-step-img-side"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* Étape 04 — Repas livrés */}
      <Reveal as="section" className="methode-step methode-step-alt">
        <div className="methode-step-inner">
          <div className="methode-step-content">
            <div className="methode-step-badge">04</div>
            <h2 className="methode-step-title">
              Les repas livrés, si vous le souhaitez
            </h2>
            <ul className="methode-step-list">
              <li>Pas le temps de cuisiner ?</li>
              <li>
                Vos repas sont préparés selon votre programme, avec les produits
                frais du marché, et livrés chez vous à Antananarivo.
              </li>
            </ul>
            <ButtonLink
              to="/repas"
              variant="primary"
              className="methode-step-btn"
            >
              Voir les formules repas
            </ButtonLink>
          </div>
          <div className="methode-step-art">
            <img
              src="/assets/b709240e3771d02fe73bfceb4081e83d.jpg"
              alt="Écran Menus de la semaine"
              className="methode-step-img"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </Reveal>

      {/* Engagement */}
      <Reveal as="section" className="methode-engagement">
        <div className="methode-engagement-inner">
          <h2 className="methode-engagement-title">
            Notre engagement, en toute transparence
          </h2>
          <div className="methode-engagement-grid">
            <div className="methode-engagement-col methode-engagement-do">
              <h3 className="methode-engagement-subtitle">
                Ce que fait Vélona
              </h3>
              <ul className="methode-engagement-list">
                <li>
                  Évaluer vos habitudes alimentaires et votre hygiène de vie.
                </li>
                <li>Construire un plan alimentaire adapté à vos objectifs.</li>
                <li>Vous accompagner chaque semaine dans la durée.</li>
              </ul>
            </div>
            <div className="methode-engagement-col methode-engagement-dont">
              <h3 className="methode-engagement-subtitle">
                Ce que Vélona ne fait pas
              </h3>
              <ul className="methode-engagement-list">
                <li>Poser un diagnostic médical.</li>
                <li>Prescrire ou modifier un traitement.</li>
                <li>
                  Remplacer votre médecin : en cas de symptôme, consultez-le.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Section finale */}
      <Reveal as="section" className="methode-final">
        <div className="methode-final-inner">
          <h2 className="methode-final-title">On commence par votre test ?</h2>
          <ButtonLink
            to="/test"
            variant="primary"
            className="methode-final-btn"
          >
            Faire mon test de vitalité
          </ButtonLink>
        </div>
      </Reveal>

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
                <Link to="/" className="vac-footer-link">
                  Accueil
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
