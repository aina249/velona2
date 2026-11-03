import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Icon } from "./icons";
import { Link } from "../lib/router";

// ---------- Types ----------

/**
 * @typedef {"primary" | "secondary" | "outline" | "ghost" | "danger" | "white"} ButtonVariant
 * @typedef {"sm" | "md" | "lg"} ButtonSize
 * @typedef {"ok" | "info" | "warning" | "danger" | "muted"} Tone
 * @typedef {import("react").ReactNode} ReactNode
 * @typedef {import("react").ComponentProps<typeof Icon>["name"]} IconName
 */

/**
 * @typedef {Object} ToastItem
 * @property {string} id
 * @property {string} message
 * @property {Tone | string} tone
 */

/**
 * @typedef {Object} AsyncState
 * @property {boolean} loading
 * @property {unknown} [data]
 * @property {Error | null} [error]
 * @property {() => void} [reload]
 */

/**
 * @typedef {string | [string, string]} SelectOption
 */

// ---------- Boutons ----------

/**
 * @param {import("react").ButtonHTMLAttributes<HTMLButtonElement> & {
 *   variant?: ButtonVariant,
 *   size?: ButtonSize,
 *   icon?: IconName,
 *   loading?: boolean
 * }} props
 */
export function Button({
  variant = "primary",
  size,
  icon,
  loading = false,
  children,
  className = "",
  disabled,
  type = "button",
  ...rest
}) {
  return (
    <button
      {...rest}
      type={type}
      disabled={loading || disabled}
      className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`}
    >
      {loading ? (
        <span className="spinner sm" aria-hidden="true" />
      ) : icon ? (
        <Icon name={icon} size={18} />
      ) : null}

      {children ? <span>{children}</span> : null}
    </button>
  );
}

/**
 * @param {{
 *   to: string,
 *   variant?: ButtonVariant,
 *   size?: ButtonSize,
 *   icon?: IconName,
 *   children?: ReactNode,
 *   className?: string
 * }} props
 */
export function ButtonLink({
  to,
  variant = "primary",
  size,
  icon,
  children,
  className = "",
}) {
  return (
    <Link
      to={to}
      className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`}
    >
      {icon ? <Icon name={icon} size={18} /> : null}
      <span>{children}</span>
    </Link>
  );
}

// ---------- Champs ----------

/**
 * @param {{
 *   label?: string,
 *   hint?: string,
 *   error?: string,
 *   children?: ReactNode,
 *   className?: string
 * }} props
 */
export function Field({ label, hint, error, children, className = "" }) {
  const id = useId();

  const child = React.isValidElement(children)
    ? React.cloneElement(children, {
        id,
        "aria-invalid": error ? "true" : undefined,
      })
    : children;

  return (
    <div className={`field ${error ? "has-error" : ""} ${className}`}>
      {label ? <label htmlFor={id}>{label}</label> : null}

      {child}

      {hint && !error ? <p className="hint">{hint}</p> : null}

      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * @param {import("react").InputHTMLAttributes<HTMLInputElement>} props
 */
export function Input(props) {
  return (
    <input
      {...props}
      className={`input ${props.className || ""}`}
      value={props.value ?? ""}
    />
  );
}

/**
 * @param {import("react").TextareaHTMLAttributes<HTMLTextAreaElement>} props
 */
export function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`input ${props.className || ""}`}
      rows={props.rows ?? 3}
      value={props.value ?? ""}
    />
  );
}

/**
 * @param {{
 *   options: SelectOption[],
 *   placeholder?: string,
 *   value?: string,
 *   className?: string,
 *   onChange?: import("react").ChangeEventHandler<HTMLSelectElement>,
 *   name?: string,
 *   id?: string,
 *   disabled?: boolean,
 *   required?: boolean
 * }} props
 */
export function Select({ options, placeholder, ...props }) {
  return (
    <select
      {...props}
      className={`input ${props.className || ""}`}
      value={props.value ?? ""}
    >
      {placeholder !== undefined ? (
        <option value="">{placeholder}</option>
      ) : null}

      {options.map((option) => {
        const [value, label] = Array.isArray(option)
          ? option
          : [option, option];

        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

// ---------- Choix en pastilles ----------

/**
 * @param {{
 *   options: [string, string][],
 *   value: string | string[] | null,
 *   onChange: (value: string | string[] | null) => void,
 *   multiple?: boolean,
 *   label?: string
 * }} props
 */
export function Pills({ options, value, onChange, multiple = false, label }) {
  const isOn = (key) =>
    multiple ? Array.isArray(value) && value.includes(key) : value === key;

  const handleClick = (key) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];

      onChange(
        isOn(key)
          ? currentValues.filter((item) => item !== key)
          : [...currentValues, key]
      );
    } else {
      onChange(isOn(key) ? null : key);
    }
  };

  return (
    <div
      className="pills"
      role={multiple ? "group" : "radiogroup"}
      aria-label={label}
    >
      {options.map(([key, text]) => (
        <button
          type="button"
          key={key}
          className={`pill ${isOn(key) ? "on" : ""}`}
          role={multiple ? "checkbox" : "radio"}
          aria-checked={isOn(key)}
          onClick={() => handleClick(key)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

// ---------- Mise en page ----------

/**
 * @param {{
 *   title?: ReactNode,
 *   action?: ReactNode,
 *   children?: ReactNode,
 *   className?: string,
 *   pad?: boolean
 * }} props
 */
export function Card({ title, action, children, className = "", pad = true }) {
  return (
    <section className={`card ${pad ? "" : "nopad"} ${className}`}>
      {title || action ? (
        <header className="card-head">
          <h2>{title}</h2>
          {action}
        </header>
      ) : null}

      {children}
    </section>
  );
}

// ---------- Notifications informatives ----------

/**
 * @param {{
 *   tone?: Tone | string,
 *   title?: string,
 *   children?: ReactNode,
 *   className?: string
 * }} props
 */
export function Notice({ tone = "info", title, children, className = "" }) {
  return (
    <div
      className={`notice notice-${tone} ${className}`}
      role={tone === "danger" ? "alert" : "status"}
    >
      {title ? <strong className="notice-title">{title}</strong> : null}
      {children ? <div className="notice-content">{children}</div> : null}
    </div>
  );
}

/**
 * @param {{tone?: Tone | string, children?: ReactNode}} props
 */
export function Badge({ tone = "muted", children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

/**
 * @param {{
 *   map: Record<string, [string, Tone | string]>,
 *   value: string
 * }} props
 */
export function StatusBadge({ map, value }) {
  const [label, tone] = map[value] || [value, "muted"];

  return <Badge tone={tone}>{label}</Badge>;
}

/**
 * @param {{
 *   user?: {first_name?: string, last_name?: string} | null,
 *   src?: string,
 *   size?: number
 * }} props
 */
export function Avatar({ user, src, size = 40 }) {
  if (src) {
    return (
      <img
        className="avatar"
        src={src}
        alt=""
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = user
    ? `${(user.first_name || "?")[0]}${
        (user.last_name || "")[0] || ""
      }`.toUpperCase()
    : "?";

  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/**
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   back?: string,
 *   actions?: ReactNode
 * }} props
 */
export function PageHeader({ title, subtitle, back, actions }) {
  return (
    <div className="page-head">
      <div className="page-head-main">
        {back ? (
          <Link to={back} className="icon-btn" aria-label="Retour">
            <Icon name="back" />
          </Link>
        ) : null}

        <div>
          <h1>{title}</h1>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
      </div>

      {actions ? <div className="page-head-actions">{actions}</div> : null}
    </div>
  );
}

/**
 * @param {{
 *   label: ReactNode,
 *   value: ReactNode,
 *   sub?: ReactNode,
 *   icon?: IconName,
 *   tone?: string
 * }} props
 */
export function Stat({ label, value, sub, icon, tone }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ""}`}>
      {icon ? (
        <span className="stat-icon">
          <Icon name={icon} />
        </span>
      ) : null}

      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {sub ? <p className="stat-sub">{sub}</p> : null}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   tabs: [string, string, (string | number)?][],
 *   value: string,
 *   onChange: (value: string) => void
 * }} props
 */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([key, label, count]) => (
        <button
          key={key}
          role="tab"
          type="button"
          aria-selected={value === key}
          className={`tab ${value === key ? "on" : ""}`}
          onClick={() => onChange(key)}
        >
          {label}
          {count ? <span className="tab-count">{count}</span> : null}
        </button>
      ))}
    </div>
  );
}

/**
 * @param {{icon?: IconName, title: string, children?: ReactNode}} props
 */
export function Empty({ icon = "leaf", title, children }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={28} />
      </span>

      <p className="empty-title">{title}</p>

      {children ? <div className="muted">{children}</div> : null}
    </div>
  );
}

/**
 * @param {{label?: string}} props
 */
export function Loading({ label = "Chargement…" }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

/**
 * @param {{error: unknown, retry?: () => void}} props
 */
export function ErrorBox({ error, retry }) {
  if (!error) return null;

  const message = error instanceof Error ? error.message : String(error);

  return (
    <div className="alert alert-danger" role="alert">
      <Icon name="alert" size={20} />

      <span>{message}</span>

      {retry ? (
        <Button variant="ghost" size="sm" onClick={retry}>
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}

/**
 * @param {{
 *   state: AsyncState,
 *   children: (data: NonNullable<AsyncState["data"]>) => ReactNode,
 *   label?: string
 * }} props
 */
export function Async({ state, children, label }) {
  if (state.loading && !state.data) {
    return <Loading label={label} />;
  }

  if (state.error && !state.data) {
    return <ErrorBox error={state.error} retry={state.reload} />;
  }

  if (!state.data) return null;

  return children(state.data);
}

// ---------- Fenêtre modale ----------

/**
 * @param {{
 *   title: string,
 *   onClose: () => void,
 *   children?: ReactNode,
 *   footer?: ReactNode,
 *   wide?: boolean
 * }} props
 */
export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null);

  useEffect(() => {
    const previousElement = document.activeElement;
    const element = ref.current;

    if (!element) return;

    const getFocusableElements = () =>
      Array.from(
        element.querySelectorAll(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );

    const initialFocus =
      element.querySelector("[autofocus]") ||
      getFocusableElements()[0] ||
      element;

    initialFocus.focus();

    /**
     * @param {KeyboardEvent} event
     */
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();

      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("no-scroll");

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("no-scroll");

      if (previousElement instanceof HTMLElement) {
        previousElement.focus();
      }
    };
  }, [onClose]);

  /**
   * @param {import("react").MouseEvent<HTMLDivElement>} event
   */
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdropClick}>
      <div
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
      >
        <header className="modal-head">
          <h2>{title}</h2>

          <button
            className="icon-btn"
            type="button"
            onClick={onClose}
            aria-label="Fermer"
          >
            <Icon name="x" />
          </button>
        </header>

        <div className="modal-body">{children}</div>

        {footer ? <footer className="modal-foot">{footer}</footer> : null}
      </div>
    </div>
  );
}

// ---------- Notifications éphémères ----------

/** @type {React.Context<(message: string, tone?: Tone | string) => void>} */
const ToastCtx = createContext(() => {});

/**
 * @param {{children?: ReactNode}} props
 */
export function ToastProvider({ children }) {
  const [items, setItems] = useState(/** @type {ToastItem[]} */ ([]));

  /**
   * @param {string} message
   * @param {Tone | string} [tone]
   */
  const push = (message, tone = "ok") => {
    const id = Math.random().toString(36).slice(2);

    setItems((currentItems) => [...currentItems, { id, message, tone }]);

    setTimeout(() => {
      setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    }, 4000);
  };

  return (
    <ToastCtx.Provider value={push}>
      {children}

      <div className="toasts" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`toast toast-${item.tone}`}>
            <Icon name={item.tone === "danger" ? "alert" : "check"} size={18} />
            {item.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

// ---------- Soumission d'un formulaire ----------

/**
 * @template {(...args: any[]) => any} T
 * @param {T} fn
 * @param {{success?: string}} [options]
 */
export function useSubmit(fn, { success } = {}) {
  const toast = useToast();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(/** @type {Error | null} */ (null));

  /**
   * @param {Parameters<T>} args
   * @returns {Promise<Awaited<ReturnType<T>> | undefined>}
   */
  const run = async (...args) => {
    setBusy(true);
    setError(null);

    try {
      const result = /** @type {Awaited<ReturnType<T>>} */ (await fn(...args));

      if (success) {
        toast(success);
      }

      return result;
    } catch (cause) {
      const submitError =
        cause instanceof Error ? cause : new Error(String(cause));

      setError(submitError);
      toast(submitError.message, "danger");

      return undefined;
    } finally {
      setBusy(false);
    }
  };

  return {
    run,
    busy,
    error,
    setError,
  };
}

// ---------- Barre de progression ----------

/**
 * @param {{value?: number, tone?: string}} props
 */
export function Progress({ value, tone }) {
  const progress = Math.max(0, Math.min(100, value ?? 0));

  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`progress-bar ${tone ? `tone-${tone}` : ""}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ---------- Curseur de 1 à 5 ----------

/**
 * @param {{
 *   value: number,
 *   onChange: (value: number) => void,
 *   labels?: string[]
 * }} props
 */
export function Scale({
  value,
  onChange,
  labels = ["Très faible", "Faible", "Moyenne", "Bonne", "Excellente"],
}) {
  return (
    <div className="scale" role="radiogroup">
      {[1, 2, 3, 4, 5].map((number) => (
        <button
          key={number}
          type="button"
          role="radio"
          aria-checked={value === number}
          aria-label={labels[number - 1]}
          className={`scale-dot ${value >= number ? "on" : ""}`}
          onClick={() => onChange(number)}
        >
          {number}
        </button>
      ))}

      <span className="scale-label">
        {value ? labels[value - 1] : "Choisissez"}
      </span>
    </div>
  );
}
