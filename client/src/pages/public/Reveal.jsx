import React, { useEffect, useRef, useState } from "react";
import "./Reveal.css";

/**
 * Reveals non-essential decorative content when it reaches the viewport.
 * Content deliberately stays visible when JavaScript, IntersectionObserver,
 * or motion is unavailable.
 */
export default function Reveal({
  as: Element = "div",
  children,
  className = "",
  delay = 0,
  variant = "up",
  threshold = 0.15,
  rootMargin = "0px 0px -8% 0px",
  style,
  ...props
}) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer;

    const showWithoutMotion = () => {
      observer?.disconnect();
      observer = undefined;
      setReady(false);
      setVisible(true);
    };

    const observe = () => {
      observer?.disconnect();
      if (!ref.current || !("IntersectionObserver" in window)) {
        showWithoutMotion();
        return;
      }

      setVisible(false);
      setReady(true);
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          setVisible(true);
          observer?.disconnect();
        },
        { threshold, rootMargin }
      );
      observer.observe(ref.current);
    };

    const updatePreference = () => {
      if (media.matches) showWithoutMotion();
      else observe();
    };

    updatePreference();
    if (media.addEventListener) media.addEventListener("change", updatePreference);
    else media.addListener?.(updatePreference);

    return () => {
      observer?.disconnect();
      if (media.removeEventListener) media.removeEventListener("change", updatePreference);
      else media.removeListener?.(updatePreference);
    };
  }, [rootMargin, threshold]);

  const delayMs = Number.isFinite(Number(delay)) ? Math.max(0, Number(delay)) : 0;

  const classes = [
    "velona-reveal",
    `velona-reveal--${variant}`,
    className,
    ready ? "velona-reveal--pending" : "",
    visible ? "velona-reveal--visible" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Element
      ref={ref}
      className={classes}
      style={{ ...style, "--velona-reveal-delay": `${delayMs}ms` }}
      {...props}
    >
      {children}
    </Element>
  );
}

/**
 * Upgrades the existing public-card markup progressively. Cards stay visible
 * by default and gain a single, viewport-based reveal only when supported.
 */
export function PublicRevealObserver() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || !("IntersectionObserver" in window)) return undefined;

    const nodes = [...document.querySelectorAll(".vac-home .fade-up")];
    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("velona-auto-reveal--visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach((node, index) => {
      node.classList.add("velona-auto-reveal");
      node.style.setProperty("--velona-auto-reveal-delay", `${(index % 3) * 70}ms`);
      observer.observe(node);
    });

    return () => {
      observer.disconnect();
      nodes.forEach((node) => {
        node.classList.remove("velona-auto-reveal", "velona-auto-reveal--visible");
        node.style.removeProperty("--velona-auto-reveal-delay");
      });
    };
  }, []);

  return null;
}
