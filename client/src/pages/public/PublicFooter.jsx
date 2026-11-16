import React from "react";
import { Link } from "../../lib/router";
import { FooterContactDetails } from "./PublicContactDetails";

/** Footer partagé des pages publiques.
 * Les coordonnées restent centralisées dans publicContact.js, afin que les
 * pages ne retombent jamais sur les anciens textes factices des maquettes.
 */
export default function PublicFooter() {
  return (
    <footer className="vac-footer">
      <div className="vac-container">
        <div className="vac-footer-grid">
          <div>
            <p className="vac-footer-brand">Vélona</p>
            <p className="vac-footer-desc">
              Nutrition &amp; hygiène de vie, à Antananarivo.
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
            <span aria-hidden="true">·</span>
            <Link to="/contact" className="vac-footer-link">
              Mentions légales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
