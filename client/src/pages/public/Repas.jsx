import React from "react";
import { Link } from "../../lib/router";
import { ButtonLink } from "../../ui/kit";
import { Icon } from "../../ui/icons";
import PublicHeader from "./PublicHeader";

export default function Repas() {
  return (
    <div className="vac-home">
      <PublicHeader activePath="/repas" />

      <section className="vac-hero">
        <div className="vac-hero-text">
          <p className="vac-eyebrow">
            Nutrition & hygiène de vie · Antananarivo
          </p>
          <h1 className="vac-h1">
            Repas sains livrés.
            <br />
            <span style={{ color: "#C25E33" }}>
              Préparés avec les produits du marché.
            </span>
          </h1>
          <p className="vac-lead">
            Des formules équilibrées, adaptées à vos goûts et vos allergies,
            livrées chez vous à Antananarivo centre. Choisissez votre formule et
            laissez-vous guider.
          </p>
        </div>
        <div className="vac-hero-art">
          <img
            src="/assets/ebbe43bc23c1796148e2df2b5464cdb5.jpg"
            alt="Écran de choix de la formule repas"
            className="vac-hero-img"
          />
        </div>
      </section>

      <section className="vac-container">
        <div className="vac-section-head vac-text-center">
          <p className="vac-eyebrow">Nos formules repas</p>
          <h2 className="vac-h2">
            Essentiel, Équilibre, Sérénité — à vous de choisir
          </h2>
        </div>
        <div className="vac-formules-grid">
          <div className="vac-formule-card fade-up">
            <div className="vac-formule-header">
              <span className="vac-formule-nom">Essentiel</span>
              <span className="vac-formule-prix">12 000 Ar / semaine</span>
            </div>
            <p className="vac-formule-desc">
              5 repas équilibrés par semaine, adaptés à vos préférences et
              allergies.
            </p>
            <ul className="vac-formule-list">
              <li>5 repas livrés par semaine</li>
              <li>Menus adaptés à vos allergies</li>
              <li>Produits du marché local</li>
              <li>Livraison à Antananarivo centre</li>
            </ul>
            <ButtonLink to="/contact" variant="outline">
              Commander Essentiel
            </ButtonLink>
          </div>
          <div className="vac-formule-card vac-formule-card-featured fade-up">
            <div className="vac-formule-badge">Le plus populaire</div>
            <div className="vac-formule-header">
              <span className="vac-formule-nom">Équilibre</span>
              <span className="vac-formule-prix">18 000 Ar / semaine</span>
            </div>
            <p className="vac-formule-desc">
              7 repas par semaine avec suivi nutritionnel et ajustements selon
              vos progrès.
            </p>
            <ul className="vac-formule-list">
              <li>7 repas livrés par semaine</li>
              <li>Suivi nutritionnel personnalisé</li>
              <li>Menus adaptés à vos allergies</li>
              <li>Produits du marché local</li>
              <li>Livraison à Antananarivo centre</li>
            </ul>
            <ButtonLink to="/contact" variant="primary">
              Commander Équilibre
            </ButtonLink>
          </div>
          <div className="vac-formule-card fade-up">
            <div className="vac-formule-header">
              <span className="vac-formule-nom">Sérénité</span>
              <span className="vac-formule-prix">25 000 Ar / semaine</span>
            </div>
            <p className="vac-formule-desc">
              10 repas par semaine, suivi complet et menus sur mesure conçus
              avec Annick.
            </p>
            <ul className="vac-formule-list">
              <li>10 repas livrés par semaine</li>
              <li>Menus sur mesure avec Annick</li>
              <li>Suivi nutritionnel complet</li>
              <li>Produits du marché local</li>
              <li>Livraison à Antananarivo centre</li>
            </ul>
            <ButtonLink to="/contact" variant="outline">
              Commander Sérénité
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="vac-container">
        <div className="vac-section-head vac-text-center">
          <p className="vac-eyebrow">Comment ça marche</p>
          <h2 className="vac-h2">De la commande à votre assiette</h2>
        </div>
        <div className="vac-etapes-grid">
          <div className="vac-etape-card fade-up">
            <span className="vac-etape-num">1</span>
            <h3 className="vac-etape-title">Choisissez votre formule</h3>
            <p className="vac-etape-desc">
              Essentiel, Équilibre ou Sérénité selon vos besoins et votre
              budget.
            </p>
          </div>
          <div className="vac-etape-card fade-up">
            <span className="vac-etape-num">2</span>
            <h3 className="vac-etape-title">Précisez vos préférences</h3>
            <p className="vac-etape-desc">
              Allergies, goûts, objectifs : nous adaptons chaque menu à vous.
            </p>
          </div>
          <div className="vac-etape-card fade-up">
            <span className="vac-etape-num">3</span>
            <h3 className="vac-etape-title">Recevez vos repas</h3>
            <p className="vac-etape-desc">
              Livraison à Antananarivo centre, prêts à être dégustés.
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
          <h2 className="vac-h2 vac-white">
            Envie de bien manger sans effort ?
          </h2>
          <p className="vac-lead vac-white-soft">
            Commandez vos repas sains livrés à Antananarivo, préparés avec les
            produits du marché.
          </p>
          <ButtonLink to="/contact" variant="white">
            Passer ma commande
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
