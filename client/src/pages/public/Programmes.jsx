import React from "react";
import { ButtonLink } from "../../ui/kit";
import { whatsappLink } from "../../lib/publicContact";
import PublicFooter from "./PublicFooter";
import PublicHeader from "./PublicHeader";

const PROGRAMMES = [
  {
    eyebrow: "Démarrer",
    duration: "30 jours",
    summary: "Pour prendre de bonnes habitudes et voir les premiers effets.",
    progress: "33%",
    items: [
      "Bilan initial de 60 min",
      "Plan alimentaire personnalisé",
      "4 check-ins hebdomadaires",
      "Messagerie avec Annick",
    ],
    action: "Choisir 30 jours",
  },
  {
    eyebrow: "Transformer",
    duration: "60 jours",
    summary: "Le temps qu'il faut pour que les nouvelles habitudes s'installent.",
    progress: "66%",
    featured: true,
    items: [
      "Bilan initial de 60 min",
      "Plan alimentaire ajusté chaque mois",
      "8 check-ins hebdomadaires",
      "Messagerie prioritaire",
      "Bilan de mi-parcours",
    ],
    action: "Choisir 60 jours",
  },
  {
    eyebrow: "Ancrer",
    duration: "90 jours",
    summary: "Pour un résultat durable et un nouveau mode de vie.",
    progress: "100%",
    items: [
      "Bilan initial de 60 min",
      "Plan alimentaire ajusté chaque mois",
      "12 check-ins hebdomadaires",
      "Messagerie prioritaire",
      "Bilan final et plan de maintien",
    ],
    action: "Choisir 90 jours",
  },
];

const OBJECTIFS = [
  ["Perte de poids", "Des repas rassasiants, des portions adaptées et un objectif réaliste semaine après semaine."],
  ["Glycémie et diabète", "Des repas équilibrés pour stabiliser l'énergie, en complément du suivi de votre médecin."],
  ["Grossesse et allaitement", "Les bons apports à chaque étape, avec des aliments faciles à trouver à Tana."],
  ["Énergie et sommeil", "Mieux répartir les repas, mieux s'hydrater, mieux dormir."],
];

export default function Programmes() {
  return (
    <div className="vac-home vac-programmes-page">
      <PublicHeader activePath="/programmes" />

      <main>
        <section className="programmes-hero">
          <img
            className="programmes-hero-mark"
            src="/assets/e0ef5960ad04c4b8d8720d585ca27240.png"
            alt=""
            aria-hidden="true"
          />
          <div className="vac-container programmes-hero-inner">
            <p className="vac-eyebrow">Programmes</p>
            <h1>Choisissez la durée qui vous ressemble</h1>
            <p>
              Chaque programme commence par un bilan et fixe un objectif chiffré.
              La durée est choisie avec vous pendant le bilan.
            </p>
          </div>
        </section>

        <section className="programmes-offers" aria-label="Choisir un programme">
          <div className="vac-container">
            <div className="programmes-offers-grid">
              {PROGRAMMES.map((programme) => (
                <article
                  className={`programme-offer fade-up${programme.featured ? " programme-offer--featured" : ""}`}
                  key={programme.duration}
                >
                  {programme.featured ? <span className="programme-recommended">Recommandé</span> : null}
                  <p className="programme-offer-eyebrow">{programme.eyebrow}</p>
                  <h2>{programme.duration}</h2>
                  <div className="programme-progress" aria-hidden="true">
                    <span style={{ width: programme.progress }} />
                  </div>
                  <p className="programme-offer-summary">{programme.summary}</p>
                  <ul>
                    {programme.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="programme-price">[PRIX] MGA</p>
                  <a
                    className={programme.featured ? "btn btn-white" : "btn btn-outline"}
                    href={whatsappLink(`Bonjour Vélona, je souhaite en savoir plus sur le programme ${programme.duration}.`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {programme.action}
                  </a>
                </article>
              ))}
            </div>
            <p className="programmes-meals-note">
              Ajoutez les repas livrés à n&apos;importe quel programme. <a href="/repas">Voir les formules repas →</a>
            </p>
          </div>
        </section>

        <section className="programmes-objectives">
          <div className="vac-container">
            <h2>Un programme pour chaque objectif</h2>
            <div className="programmes-objectives-grid">
              {OBJECTIFS.map(([title, description]) => (
                <article className="programme-objective fade-up" key={title}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="programmes-help">
          <div className="vac-container">
            <div className="programmes-help-card">
              <h2>Vous hésitez sur la durée ?</h2>
              <p>Faites le test : votre résultat nous aide à choisir ensemble le bon programme.</p>
              <ButtonLink to="/test" variant="primary">Faire mon test de vitalité</ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
