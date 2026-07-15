import { NavLink, useLocation } from "react-router-dom";

type NavigationIconName =
  | "overview"
  | "calendar"
  | "analytics"
  | "profile";

interface NavigationItem {
  to: string;
  label: string;
  icon: NavigationIconName;
  matches: string[];
}

const primaryItems: NavigationItem[] = [
  {
    to: "/",
    label: "Uebersicht",
    icon: "overview",
    matches: ["/"],
  },
  {
    to: "/kalender",
    label: "Kalender",
    icon: "calendar",
    matches: ["/kalender"],
  },
  {
    to: "/pruefung",
    label: "Auswertung",
    icon: "analytics",
    matches: [
      "/pruefung",
      "/bericht",
      "/gehalt",
      "/jahr",
      "/fairness",
    ],
  },
  {
    to: "/profil",
    label: "Profil",
    icon: "profile",
    matches: ["/profil"],
  },
];

function isCurrentPath(
  pathname: string,
  to: string,
): boolean {
  return to === "/"
    ? pathname === "/"
    : pathname.startsWith(to);
}

function NavigationIcon({
  name,
}: {
  name: NavigationIconName;
}) {
  return (
    <span
      className={`bottom-nav-icon bottom-nav-icon-${name}`}
      aria-hidden="true"
    />
  );
}

export default function BottomNavigation() {
  const location = useLocation();

  return (
    <nav
      className="bottom-nav no-print"
      aria-label="Hauptnavigation"
    >
      <div className="bottom-nav-primary">
        {primaryItems.map((item) => {
          const isSectionActive =
            item.matches.some((match) =>
              isCurrentPath(
                location.pathname,
                match,
              ),
            );

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive || isSectionActive
                  ? "bottom-nav-link active"
                  : "bottom-nav-link"
              }
              aria-label={item.label}
            >
              <NavigationIcon
                name={item.icon}
              />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
