import React from "react";
import { ButtonLink } from "../../ui/kit";
import { Icon } from "../../ui/icons";
import { whatsappLink } from "../../lib/publicContact";
import PublicFooter from "./PublicFooter";
import PublicHeader from "./PublicHeader";

const FORMULES = [
  {
    name: "Essentiel",
    amount: "5 repas par semaine",
    description: "Vos déjeuners de la semaine, pour bien manger au travail.",
  },
  {
    name: "Équilibre",
    amount: "10 repas par semaine",
    description: "Déjeuners et dîners du lundi au vendredi, pour des résultats durables.",
    featured: true,
  },
  {
    name: "Sérénité",
    amount: "14 repas par semaine",
    description: "Deux repas par jour, toute la semaine. Vous ne pensez plus à rien.",
  },
];

const MENUS = [
  ["Romazava traditionnel", "Bœuf maigre, brèdes, tomates, gingembre", "Déjeuner"],
  ["Poisson grillé sauce citron", "Riz complet, achards de légumes", "Dîner"],
  ["Salade de fruits locaux", "Mangue, ananas, banane, fruit de la passion", "Petit-déjeuner"],
  ["Brèdes sautées", "Brèdes mafana, ail, oignon", "Accompagnement"],
];

export default function Repas() {
  return (
    <div className="vac-home vac-meals-page">
      <PublicHeader activePath="/repas" />

      <main>
        <section className="meals-hero">
          <div className="vac-container meals-hero-inner">
            <div className="meals-hero-copy">
              <p className="vac-eyebrow">Repas livrés</p>
              <h1>Vos repas sains, prêts et livrés chez vous</h1>
              <p>
                Préparés selon votre programme, avec les produits frais du marché
                d&apos;Antananarivo. Vous n&apos;avez plus qu&apos;à réchauffer.
              </p>
              <div className="meals-hero-actions">
                <a
                  className="btn btn-p"
                  href={whatsappLink("Bonjour Vélona, je souhaite choisir ma formule repas.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Choisir ma formule
                </a>
                <ButtonLink to="/test" variant="outline">Faire d&apos;abord le test</ButtonLink>
              </div>
            </div>
            <div className="meals-hero-art" aria-label="Aperçu de l'application Vélona">
              <img
                src="/assets/e0ef5960ad04c4b8d8720d585ca27240.png"
                alt=""
                aria-hidden="true"
                className="meals-hero-mark"
              />
              <img
                src="/assets/ebbe43bc23c1796148e2df2b5464cdb5.jpg"
                alt="Choix d'une formule repas dans l'application Vélona"
                className="meals-hero-phone meals-hero-phone--formula"
                fetchPriority="high"
                decoding="async"
              />
              <img
                src="/assets/b709240e3771d02fe73bfceb4081e83d.jpg"
                alt="Menus de la semaine dans l'application Vélona"
                className="meals-hero-phone meals-hero-phone--menu"
                decoding="async"
              />
            </div>
          </div>
        </section>

        <section className="meals-how">
          <div className="vac-container">
            <h2>Comment ça marche</h2>
            <div className="meals-how-line" aria-hidden="true">
              <span className="meals-how-bike"><Icon name="bike" size={29} stroke={2} /></span>
            </div>
            <div className="meals-how-grid">
              <article className="fade-up">
                <p>1</p>
                <h3>Vous choisissez</h3>
                <span>Votre formule et vos jours de livraison, dans l&apos;application.</span>
              </article>
              <article className="fade-up">
                <p>2</p>
                <h3>Annick prépare</h3>
                <span>Des menus adaptés à votre programme, avec les produits du marché.</span>
              </article>
              <article className="fade-up">
                <p>3</p>
                <h3>On vous livre</h3>
                <span>Le lundi et le jeudi, chez vous ou au bureau, à Antananarivo centre.</span>
              </article>
            </div>
          </div>
        </section>

        <section className="meals-formulas">
          <div className="vac-container">
            <div className="meals-section-heading">
              <h2>Trois formules au choix</h2>
              <p>Le prix dépend de votre programme et de vos besoins. Il vous est indiqué après le bilan.</p>
            </div>
            <div className="meals-formulas-grid">
              {FORMULES.map((formule) => (
                <article
                  key={formule.name}
                  className={`meal-formula fade-up${formule.featured ? " meal-formula--featured" : ""}`}
                >
                  <h3>{formule.name}</h3>
                  <p className="meal-formula-amount">{formule.amount}</p>
                  <p>{formule.description}</p>
                  <a
                    href={whatsappLink(`Bonjour Vélona, je souhaite choisir la formule ${formule.name}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className={formule.featured ? "btn btn-white" : "btn btn-outline"}
                  >
                    Choisir {formule.name}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="meals-menu">
          <div className="vac-container meals-menu-inner">
            <div className="meals-menu-copy">
              <p className="vac-eyebrow">Exemples au menu</p>
              <h2>La cuisine d&apos;ici, en plus léger</h2>
              <div className="meals-menu-list">
                {MENUS.map(([title, description, type]) => (
                  <article key={title} className="fade-up">
                    <div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                    <span>{type}</span>
                  </article>
                ))}
              </div>
            </div>
            <img
              src="/assets/b709240e3771d02fe73bfceb4081e83d.jpg"
              alt="Exemple des menus de la semaine"
              className="meals-menu-phone"
              loading="lazy"
              decoding="async"
            />
          </div>
        </section>

        <section className="meals-commitment">
          <div className="vac-container">
            <h2>Nos engagements en cuisine</h2>
            <div className="meals-commitment-grid">
              <article><h3>Produits frais</h3><p>Achetés chaque semaine au marché.</p></article>
              <article><h3>Hygiène stricte</h3><p>Préparation et conditionnement soignés, chaîne du froid respectée.</p></article>
              <article><h3>Allergies respectées</h3><p>Vos allergies et interdits sont notés dans votre dossier.</p></article>
              <article><h3>Étiquettes claires</h3><p>Nom, date, repas et conseils de conservation sur chaque boîte.</p></article>
            </div>
            <p className="meals-delivery-note">Livraison à Antananarivo centre · Quartiers desservis : à confirmer</p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
