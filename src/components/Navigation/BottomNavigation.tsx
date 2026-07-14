import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const primaryItems = [
  { to: "/", label: "Start", shortLabel: "Start" },
  { to: "/plan", label: "Plan", shortLabel: "Plan" },
  { to: "/kalender", label: "Kalender", shortLabel: "Kal." },
  { to: "/pruefung", label: "Prüfung", shortLabel: "Check" },
];

const secondaryItems = [
  { to: "/bericht", label: "Bericht" },
  { to: "/gehalt", label: "Gehalt" },
  { to: "/jahr", label: "Jahr" },
  { to: "/fairness", label: "Fairness" },
  { to: "/profil", label: "Profil" },
];

function isCurrentPath(pathname: string, to: string): boolean {
  return to === "/"
    ? pathname === "/"
    : pathname.startsWith(to);
}

export default function BottomNavigation() {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] =
    useState(false);
  const isSecondaryActive = secondaryItems.some(
    (item) => isCurrentPath(location.pathname, item.to),
  );

  function closeMoreMenu() {
    setIsMoreOpen(false);
  }

  return (
    <nav
      className="bottom-nav"
      aria-label="Hauptnavigation"
    >
      <div className="bottom-nav-primary">
        {primaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              isActive
                ? "bottom-nav-link active"
                : "bottom-nav-link"
            }
            onClick={closeMoreMenu}
            aria-label={item.label}
          >
            <span>{item.shortLabel}</span>
          </NavLink>
        ))}

        <button
          className={
            isMoreOpen || isSecondaryActive
              ? "bottom-nav-link bottom-nav-more-button active"
              : "bottom-nav-link bottom-nav-more-button"
          }
          type="button"
          aria-expanded={isMoreOpen}
          aria-controls="bottom-nav-more"
          onClick={() =>
            setIsMoreOpen((current) => !current)
          }
        >
          <span>Mehr</span>
        </button>
      </div>

      <div
        className={
          isMoreOpen
            ? "bottom-nav-more-panel open"
            : "bottom-nav-more-panel"
        }
        id="bottom-nav-more"
      >
        {secondaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive
                ? "bottom-nav-link active"
                : "bottom-nav-link"
            }
            onClick={closeMoreMenu}
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
