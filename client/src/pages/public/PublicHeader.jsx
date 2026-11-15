import React from "react";
import { Link } from "../../lib/router";
import { ButtonLink } from "../../ui/kit";
import { useAuth } from "../../lib/auth";

const NAVIGATION = [
  ["/", "Accueil"],
  ["/methode", "Notre méthode"],
  ["/programmes", "Programmes"],
  ["/repas", "Repas livrés"],
  ["/a-propos", "À propos"],
  ["/contact", "FAQ & contact"],
];

export default function PublicHeader({ activePath }) {
  const { user } = useAuth();

  return (
    <header className="vac-header">
      <div className="vac-header-inner">
        <Link to="/" className="vac-brand" aria-label="Vélona, accueil">
          <img src="/symbol.png" alt="" width="30" height="30" />
          <img src="/wordmark.png" alt="Vélona" height="22" />
        </Link>
        <nav className="vac-nav" aria-label="Navigation principale">
          {NAVIGATION.map(([path, label]) => {
            const isActive = path === activePath;
            return (
              <Link
                key={path}
                to={path}
                className={`vac-nav-link${isActive ? " vac-nav-link-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="vac-header-actions">
          {!user ? (
            <Link to="/connexion" className="vac-login-link">
              Se connecter
            </Link>
          ) : null}
          <ButtonLink to="/test" variant="primary">
            Faire le test gratuit
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
