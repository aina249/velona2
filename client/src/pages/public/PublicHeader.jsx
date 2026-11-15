import React, { useEffect, useId, useRef, useState } from "react";
import { Link } from "../../lib/router";
import { ButtonLink } from "../../ui/kit";
import { Icon } from "../../ui/icons";
import { useAuth } from "../../lib/auth";
import { whatsappLink } from "../../lib/publicContact";
import { PublicRevealObserver } from "./Reveal";
import "./PublicHeader.css";

const NAVIGATION = [
  ["/", "Accueil"],
  ["/methode", "Notre méthode"],
  ["/programmes", "Programmes"],
  ["/repas", "Repas livrés"],
  ["/a-propos", "À propos"],
  ["/contact", "FAQ & contact"],
];

function NavigationLinks({ activePath, onNavigate }) {
  return NAVIGATION.map(([path, label]) => {
    const isActive = path === activePath;
    return (
      <Link
        key={path}
        to={path}
        className={`vac-nav-link${isActive ? " vac-nav-link-active" : ""}`}
        aria-current={isActive ? "page" : undefined}
        onClick={onNavigate}
      >
        {label}
      </Link>
    );
  });
}

export default function PublicHeader({ activePath }) {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    closeMenu();
  }, [activePath]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenu();
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    menuRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  return (
    <>
      <PublicRevealObserver />
      <header className="vac-header vac-public-header">
        <div className="vac-header-inner">
          <Link to="/" className="vac-brand" aria-label="Vélona, accueil">
            <img src="/symbol.png" alt="" width="30" height="30" />
            <img src="/wordmark.png" alt="Vélona" height="22" />
          </Link>

          <nav className="vac-nav vac-nav-desktop" aria-label="Navigation principale">
            <NavigationLinks activePath={activePath} />
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

          <button
            ref={menuButtonRef}
            type="button"
            className="vac-menu-toggle"
            aria-expanded={isMenuOpen}
            aria-controls={menuId}
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div
          id={menuId}
          ref={menuRef}
          className={`vac-mobile-menu${isMenuOpen ? " is-open" : ""}`}
          role="dialog"
          aria-label="Menu principal"
          aria-modal="false"
          aria-hidden={!isMenuOpen}
          tabIndex={-1}
        >
          <nav className="vac-nav vac-nav-mobile" aria-label="Navigation mobile">
            <NavigationLinks activePath={activePath} onNavigate={closeMenu} />
          </nav>
          <div className="vac-mobile-menu-actions">
            {!user ? (
              <Link to="/connexion" className="vac-mobile-login" onClick={closeMenu}>
                Se connecter à mon espace
              </Link>
            ) : null}
            <a
              className="vac-mobile-whatsapp"
              href={whatsappLink("Bonjour Vélona, j'aimerais en savoir plus sur vos programmes.")}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="message" size={18} />
              Écrire sur WhatsApp
            </a>
          </div>
        </div>
      </header>

      <a
        className="vac-whatsapp-fab"
        href={whatsappLink("Bonjour Vélona, j'aimerais en savoir plus sur vos programmes.")}
        target="_blank"
        rel="noreferrer"
        aria-label="Écrire à Vélona sur WhatsApp"
      >
        <Icon name="message" size={18} />
        WhatsApp
      </a>
    </>
  );
}
