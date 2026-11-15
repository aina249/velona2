import React from "react";
import { Link } from "../../lib/router";
import { ButtonLink } from "../../ui/kit";
import { Icon } from "../../ui/icons";
import { whatsappLink } from "../../lib/publicContact";
import PublicHeader from "./PublicHeader";
import { FooterContactDetails } from "./PublicContactDetails";

export default function Home() {
  return (
    <div className="vac-home vac-home--landing">
      <PublicHeader activePath="/" />

      <section className="vac-hero">
        <div className="vac-hero-text">
          <p className="vac-eyebrow">
            Nutrition & hygiène de vie · Antananarivo
          </p>
          <h1 className="vac-h1">
            Mangez mieux.
            <br />
            <span style={{ color: "var(--terra)" }}>Sentez-vous vivant.</span>
          </h1>
          <p className="vac-lead">
            Bilan nutritionnel, suivi chaque semaine sur l'application et repas
            sains livrés chez vous à Antananarivo.
          </p>
          <div className="vac-cta">
            <ButtonLink to="/test" variant="primary" className="vac-btn-pulse">
              <Icon name="heart" size={20} />
              Faire mon test de vitalité · 3 min
            </ButtonLink>
            <a
              className="btn btn-o"
              href={whatsappLink("Bonjour Vélona, je souhaite réserver un bilan nutritionnel.")}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="calendar" size={20} />
              Réserver mon bilan
            </a>
          </div>
          <div className="vac-stats">
            <div>
              <p className="vac-stat-value">3 min</p>
              <p className="vac-stat-label">pour votre test gratuit</p>
            </div>
            <div>
              <p className="vac-stat-value">1×/sem.</p>
              <p className="vac-stat-label">un suivi régulier</p>
            </div>
            <div>
              <p className="vac-stat-value">100 %</p>
              <p className="vac-stat-label">produits locaux</p>
            </div>
          </div>
        </div>
        <div className="vac-hero-art">
          <div className="vac-hero-bg" />
          <img
            src="/assets/e0ef5960ad04c4b8d8720d585ca27240.png"
            alt=""
            className="vac-hero-logo"
          />
          <div className="vac-float float2">
            <img
              src="/assets/b709240e3771d02fe73bfceb4081e83d.jpg"
              alt="Écran Menus de la semaine de l'application Vélona"
            />
          </div>
          <div className="vac-float float1">
            <img
              src="/assets/5e5d6aa832fba37544447d717c4d883d.jpg"
              alt="Tableau de bord client de l'application Vélona"
            />
          </div>
          <div className="vac-float float3">
            <img
              src="/assets/f91289445a3f709ebc8cfed53319cf69.jpg"
              alt="Résultat du test de vitalité"
            />
          </div>
        </div>
      </section>

      <section className="vac-confiance">
        <div className="vac-confiance-inner">
          <span>Bilan personnalisé de 60 min</span>
          <span style={{ color: "var(--terra-soft)" }}>•</span>
          <span>Check-in chaque semaine</span>
          <span style={{ color: "var(--terra-soft)" }}>•</span>
          <span>Repas livrés à Tana</span>
          <span style={{ color: "var(--terra-soft)" }}>•</span>
          <span>Paiement mobile money</span>
        </div>
      </section>

      <section className="vac-methode">
        <div className="vac-container">
          <div className="vac-section-head">
            <div>
              <p className="vac-eyebrow">Notre méthode</p>
              <h2 className="vac-h2">Quatre étapes, un résultat durable</h2>
            </div>
            <ButtonLink to="/methode" variant="ghost">
              Découvrir la méthode →
            </ButtonLink>
          </div>
          <div className="vac-steps-grid">
            <div className="vac-step-card fade-up">
              <p className="vac-step-num">01</p>
              <h3 className="vac-step-title">Test de vitalité</h3>
              <p className="vac-step-desc">
                12 questions, un score sur 100 et vos premiers axes
                d'amélioration.
              </p>
            </div>
            <div className="vac-step-card fade-up">
              <p className="vac-step-num">02</p>
              <h3 className="vac-step-title">Bilan personnalisé</h3>
              <p className="vac-step-desc">
                Une heure au cabinet ou en visio pour fixer un objectif chiffré.
              </p>
            </div>
            <div className="vac-step-card fade-up">
              <p className="vac-step-num">03</p>
              <h3 className="vac-step-title">Suivi chaque semaine</h3>
              <p className="vac-step-desc">
                Un check-in de 2 minutes sur l'application, des ajustements au
                fil des progrès.
              </p>
            </div>
            <div className="vac-step-card fade-up">
              <p className="vac-step-num">04</p>
              <h3 className="vac-step-title">Repas livrés</h3>
              <p className="vac-step-desc">
                En option : vos repas préparés selon votre programme, livrés
                chez vous.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="vac-services">
        <div className="vac-container">
          <div className="vac-section-head vac-text-center">
            <p className="vac-eyebrow">Nos services</p>
            <h2 className="vac-h2">
              De l'assiette au résultat, on vous accompagne
            </h2>
          </div>
          <div className="vac-services-grid">
            <a href="/contact" className="vac-service-card fade-up">
              <div className="vac-service-img">
                <img
                  src="/assets/e1683b31616d5b21b789bfb8336e6a18.jpg"
                  alt="Écran de réservation du bilan"
                />
              </div>
              <div className="vac-service-body">
                <h3 className="vac-service-title">Bilan nutritionnel</h3>
                <p className="vac-service-desc">
                  Habitudes, mesures, objectifs : un plan alimentaire fait pour
                  vous.
                </p>
                <span className="vac-service-link">Réserver →</span>
              </div>
            </a>
            <a href="/programmes" className="vac-service-card fade-up">
              <div className="vac-service-img">
                <img
                  src="/assets/6d8aea6bbdc9c39dbba7cae5a7494c89.jpg"
                  alt="Écran de suivi détaillé"
                />
              </div>
              <div className="vac-service-body">
                <h3 className="vac-service-title">
                  Programmes 30 / 60 / 90 jours
                </h3>
                <p className="vac-service-desc">
                  Un objectif chiffré et un suivi chaque semaine jusqu'au
                  résultat.
                </p>
                <span className="vac-service-link">Voir les programmes →</span>
              </div>
            </a>
            <a href="/repas" className="vac-service-card fade-up">
              <div className="vac-service-img">
                <img
                  src="/assets/ebbe43bc23c1796148e2df2b5464cdb5.jpg"
                  alt="Écran de choix de la formule repas"
                />
              </div>
              <div className="vac-service-body">
                <h3 className="vac-service-title">Repas sains livrés</h3>
                <p className="vac-service-desc">
                  Préparés avec les produits du marché, livrés à Antananarivo
                  centre.
                </p>
                <span className="vac-service-link">Voir les formules →</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section className="vac-app">
        <div className="vac-container">
          <div className="vac-app-head">
            <div>
              <p className="vac-eyebrow">L'application Vélona</p>
              <h2 className="vac-h2">Votre suivi, dans votre poche</h2>
            </div>
            <p className="vac-app-desc">
              Progrès, menus, messages et paiement : tout au même endroit, sur
              votre téléphone.
            </p>
          </div>
          <div className="vac-marquee-window">
            <div className="vac-marquee">
            <img
              src="/assets/942d99f8b39ecd234f5a51825e0a4df4.jpg"
              alt="Écran Test de vitalité"
            />
            <img
              src="/assets/f91289445a3f709ebc8cfed53319cf69.jpg"
              alt="Écran Résultat"
            />
            <img
              src="/assets/5e5d6aa832fba37544447d717c4d883d.jpg"
              alt="Écran Tableau de bord"
            />
            <img
              src="/assets/16e40a1b88fa7643b2dc9ffa0962cd58.jpg"
              alt="Écran Check-in"
            />
            <img
              src="/assets/b709240e3771d02fe73bfceb4081e83d.jpg"
              alt="Écran Menus"
            />
            <img
              src="/assets/35934aa8a3521032d36867936477fe43.jpg"
              alt="Écran Messages"
            />
            <img
              src="/assets/8acc73a904775ee512ea6be802116e33.jpg"
              alt="Écran Profil"
            />
            <img src="/assets/942d99f8b39ecd234f5a51825e0a4df4.jpg" alt="" />
            <img src="/assets/f91289445a3f709ebc8cfed53319cf69.jpg" alt="" />
            <img src="/assets/5e5d6aa832fba37544447d717c4d883d.jpg" alt="" />
            <img src="/assets/16e40a1b88fa7643b2dc9ffa0962cd58.jpg" alt="" />
            <img src="/assets/b709240e3771d02fe73bfceb4081e83d.jpg" alt="" />
            <img src="/assets/35934aa8a3521032d36867936477fe43.jpg" alt="" />
              <img src="/assets/8acc73a904775ee512ea6be802116e33.jpg" alt="" />
            </div>
          </div>
        </div>
      </section>

      <section className="vac-pourqui">
        <div className="vac-container">
          <h2 className="vac-h2 vac-text-center">
            Vélona est fait pour vous si vous voulez…
          </h2>
          <div className="vac-pourqui-grid">
            <div className="vac-pourqui-card fade-up">
              <svg
                width="38"
                height="38"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--terra)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 18 L9 12 L13 15 L20 6" />
                <path d="M15 6 H20 V11" />
              </svg>
              <h3 className="vac-pourqui-title">Perdre du poids durablement</h3>
              <p className="vac-pourqui-desc">
                Sans régime extrême, à votre rythme.
              </p>
            </div>
            <div className="vac-pourqui-card fade-up">
              <svg
                width="38"
                height="38"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--terra)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3 C 12 3, 5 11, 5 15 A 7 7 0 0 0 19 15 C 19 11, 12 3, 12 3 Z" />
              </svg>
              <h3 className="vac-pourqui-title">Mieux gérer votre glycémie</h3>
              <p className="vac-pourqui-desc">
                Une alimentation adaptée, en lien avec votre médecin.
              </p>
            </div>
            <div className="vac-pourqui-card fade-up">
              <svg
                width="38"
                height="38"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--terra)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 20 C 6 16, 3 12, 3 8.5 A 4.5 4.5 0 0 1 12 6 A 4.5 4.5 0 0 1 21 8.5 C 21 12, 18 16, 12 20 Z" />
              </svg>
              <h3 className="vac-pourqui-title">Bien manger enceinte</h3>
              <p className="vac-pourqui-desc">
                Les bons apports pour vous et votre bébé.
              </p>
            </div>
            <div className="vac-pourqui-card fade-up">
              <svg
                width="38"
                height="38"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--terra)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M13 2 L5 13 H11 L10 22 L19 10 H13 Z" />
              </svg>
              <h3 className="vac-pourqui-title">Retrouver de l'énergie</h3>
              <p className="vac-pourqui-desc">
                Moins de fatigue, un meilleur sommeil.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="vac-parcours">
        <div className="vac-container">
          <div className="vac-section-head vac-text-center">
            <p className="vac-eyebrow">Parcours illustratifs</p>
            <h2 className="vac-h2">Un accompagnement qui part de votre quotidien</h2>
            <p className="vac-parcours-note">
              Illustrations fictives inspirées des objectifs fréquents. Chaque
              accompagnement est personnalisé et les résultats varient selon
              chaque personne.
            </p>
          </div>
          <div className="vac-parcours-grid">
            <article className="vac-parcours-card fade-up">
              <Icon name="bolt" size={30} />
              <h3>Retrouver de l’énergie</h3>
              <p>
                Faire le point sur le rythme des repas, le sommeil et les
                habitudes qui comptent le plus au quotidien.
              </p>
              <span>Le bilan, puis un suivi simple chaque semaine.</span>
            </article>
            <article className="vac-parcours-card fade-up">
              <Icon name="menu" size={30} />
              <h3>Mieux organiser ses repas</h3>
              <p>
                Construire des repas adaptés à votre rythme, avec des idées de
                menus et une livraison possible.
              </p>
              <span>Un cadre souple, pensé pour durer.</span>
            </article>
            <article className="vac-parcours-card fade-up">
              <Icon name="heart" size={30} />
              <h3>Préparer un objectif santé</h3>
              <p>
                Poser un objectif réaliste avec Annick et avancer pas à pas,
                au cabinet ou en visio.
              </p>
              <span>Des décisions éclairées, sans régime extrême.</span>
            </article>
          </div>
          <div className="vac-parcours-cta">
            <a
              className="btn btn-p"
              href={whatsappLink("Bonjour Vélona, je souhaite échanger sur mon objectif nutritionnel.")}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="message" size={19} />
              Parler de mon objectif
            </a>
          </div>
        </div>
      </section>

      <section className="vac-nutritionniste">
        <div className="vac-container">
          <div className="vac-nutritionniste-row">
            <div className="vac-nutritionniste-img">
              <div className="vac-nutritionniste-bg" />
              <img
                src="/assets/b6e44ca90dfa7a2c0b07f1af5853d642.jpg"
                alt="Annick Tchuidjang, nutritionniste, au cabinet Vélona"
              />
              <div className="vac-nutritionniste-badge">
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "var(--green)",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontWeight: "600", fontSize: "15px" }}>
                  Répond sous 24 h
                </span>
              </div>
            </div>
            <div className="vac-nutritionniste-text">
              <p className="vac-eyebrow">Votre nutritionniste</p>
              <h2 className="vac-h2">Annick Tchuidjang</h2>
              <p
                className="vac-nutritionniste-sub"
                style={{ fontWeight: "600", color: "var(--ink-2)" }}
              >
                Nutritionniste, fondatrice de Vélona
              </p>
              <p className="vac-nutritionniste-desc">
                « Velona » veut dire « vivant » en malgache. C'est ce qu'Annick
                souhaite à chacun de ses clients : se sentir pleinement vivant,
                grâce à une alimentation qui lui ressemble.
              </p>
              <p className="vac-nutritionniste-desc">
                Une nutrition fondée sur la science, les produits du marché, et
                un accompagnement humain chaque semaine.
              </p>
              <div className="vac-nutritionniste-cta">
                <a
                  className="btn btn-p"
                  href={whatsappLink("Bonjour Vélona, je souhaite réserver un bilan avec Annick.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Réserver mon bilan avec Annick
                </a>
                <ButtonLink to="/a-propos" variant="outline">
                  Découvrir son approche
                </ButtonLink>
              </div>
            </div>
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
              <span style={{ color: "var(--muted)", margin: "0 6px" }}>·</span>
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
