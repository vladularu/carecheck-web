import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Start" },
  { to: "/plan", label: "Plan" },
  { to: "/gehalt", label: "Gehalt" },
  { to: "/pruefung", label: "Prüfung" },
  { to: "/profil", label: "Profil" },
  { to: "/kalender", label: "Kalender" },
];

export default function BottomNavigation() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            isActive ? "bottom-nav-link active" : "bottom-nav-link"
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}