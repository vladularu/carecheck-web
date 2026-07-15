import { Link, useLocation } from "react-router-dom";

export default function PrimaryAddShiftButton() {
  const location = useLocation();

  if (location.pathname === "/plan") {
    return null;
  }

  return (
    <Link
      to="/plan"
      className="primary-add-shift-button"
      aria-label="Dienst hinzufuegen"
    >
      <span aria-hidden="true">+</span>
      <strong>Dienst</strong>
    </Link>
  );
}
