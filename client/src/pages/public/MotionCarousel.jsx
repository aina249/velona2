import React, { useEffect, useId, useRef, useState } from "react";
import "./MotionCarousel.css";

const SCREENS = [
  {
    src: "/assets/942d99f8b39ecd234f5a51825e0a4df4.jpg",
    alt: "Écran Test de vitalité de l’application Vélona",
  },
  {
    src: "/assets/f91289445a3f709ebc8cfed53319cf69.jpg",
    alt: "Écran de résultat du test de vitalité",
  },
  {
    src: "/assets/5e5d6aa832fba37544447d717c4d883d.jpg",
    alt: "Tableau de bord client de l’application Vélona",
  },
  {
    src: "/assets/16e40a1b88fa7643b2dc9ffa0962cd58.jpg",
    alt: "Écran de check-in hebdomadaire",
  },
  {
    src: "/assets/b709240e3771d02fe73bfceb4081e83d.jpg",
    alt: "Écran des menus de la semaine",
  },
  {
    src: "/assets/35934aa8a3521032d36867936477fe43.jpg",
    alt: "Écran des messages avec la nutritionniste",
  },
  {
    src: "/assets/8acc73a904775ee512ea6be802116e33.jpg",
    alt: "Écran du profil client",
    compact: true,
  },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();

    if (query.addEventListener) {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }

    query.addListener?.(update);
    return () => query.removeListener?.(update);
  }, []);

  return reduced;
}

export default function MotionCarousel() {
  const carouselRef = useRef(null);
  const controlId = useId();
  const reducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      !carouselRef.current
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.08 }
    );
    observer.observe(carouselRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const updateVisibility = () => setIsDocumentVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const motionPaused =
    reducedMotion || isPausedByUser || !isVisible || !isDocumentVisible;

  const handleViewportKeyDown = (event) => {
    if (!reducedMotion) return;
    const viewport = event.currentTarget;
    const step = Math.max(160, Math.round(viewport.clientWidth * 0.8));

    if (event.key === "ArrowRight") {
      event.preventDefault();
      viewport.scrollBy({ left: step, behavior: "auto" });
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      viewport.scrollBy({ left: -step, behavior: "auto" });
    } else if (event.key === "Home") {
      event.preventDefault();
      viewport.scrollTo({ left: 0, behavior: "auto" });
    } else if (event.key === "End") {
      event.preventDefault();
      viewport.scrollTo({ left: viewport.scrollWidth, behavior: "auto" });
    }
  };

  return (
    <div
      ref={carouselRef}
      className={`motion-carousel${motionPaused ? " is-paused" : ""}${
        reducedMotion ? " is-reduced-motion" : ""
      }`}
    >
      <div className="motion-carousel__toolbar">
        <p id={controlId} className="motion-carousel__hint">
          Aperçu des écrans de l’application Vélona
        </p>
        {!reducedMotion ? (
          <button
            type="button"
            className="motion-carousel__control"
            aria-pressed={isPausedByUser}
            aria-describedby={controlId}
            aria-label={
              isPausedByUser
                ? "Reprendre le défilement des écrans de l’application"
                : "Mettre en pause le défilement des écrans de l’application"
            }
            onClick={() => setIsPausedByUser((paused) => !paused)}
          >
            {isPausedByUser ? "Reprendre" : "Mettre en pause"}
          </button>
        ) : null}
      </div>
      <div
        className="motion-carousel__viewport"
        role="region"
        aria-label="Aperçu animé de l’application Vélona"
        tabIndex={reducedMotion ? 0 : -1}
        onKeyDown={handleViewportKeyDown}
      >
        <div className="motion-carousel__track">
          {[false, true].map((clone) => (
            <div
              key={clone ? "clone" : "original"}
              className={`motion-carousel__set${clone ? " is-clone" : ""}`}
              aria-hidden={clone ? "true" : undefined}
            >
              {SCREENS.map((screen) => (
                <figure
                  key={`${screen.src}-${clone ? "clone" : "original"}`}
                  className={`motion-carousel__item${screen.compact ? " is-compact" : ""}`}
                >
                  <img
                    src={screen.src}
                    alt={clone ? "" : screen.alt}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
