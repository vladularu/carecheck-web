import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAppContext } from "../context/AppContext";
import type { FederalState, PayGroup, PayLevel } from "../types/index";

const federalStates: { value: FederalState; label: string }[] = [
  { value: "BW", label: "Baden-Württemberg" },
  { value: "BY", label: "Bayern" },
  { value: "BE", label: "Berlin" },
  { value: "BB", label: "Brandenburg" },
  { value: "HB", label: "Bremen" },
  { value: "HH", label: "Hamburg" },
  { value: "HE", label: "Hessen" },
  { value: "MV", label: "Mecklenburg-Vorpommern" },
  { value: "NI", label: "Niedersachsen" },
  { value: "NW", label: "Nordrhein-Westfalen" },
  { value: "RP", label: "Rheinland-Pfalz" },
  { value: "SL", label: "Saarland" },
  { value: "SN", label: "Sachsen" },
  { value: "ST", label: "Sachsen-Anhalt" },
  { value: "SH", label: "Schleswig-Holstein" },
  { value: "TH", label: "Thüringen" },
];

const payGroups: PayGroup[] = [
  "P7",
  "P8",
  "P9",
  "P10",
  "P11",
  "P12",
  "P13",
  "P14",
  "P15",
  "P16",
];

const payLevels: PayLevel[] = [1, 2, 3, 4, 5, 6];

export default function Profile() {
  const { profile, setProfile } = useAppContext();

  return (
    <section className="page">
      <PageHeader
        eyebrow="Einstellungen"
        title="Profil"
        description="Grunddaten für Dienstplan, Feiertage, Sollstunden und Zuschläge."
      />

      <Card>
        <div className="form-grid">
          <label className="field">
            <span>Bundesland</span>
            <select
              value={profile.federalState}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  federalState: event.target.value as FederalState,
                })
              }
            >
              {federalStates.map((state) => (
                <option value={state.value} key={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Wochenarbeitszeit</span>
            <input
              type="number"
              min="1"
              step="0.1"
              value={profile.weeklyHours}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  weeklyHours: Number(event.target.value),
                })
              }
            />
          </label>

          <label className="field">
            <span>TVöD-P Gruppe</span>
            <select
              value={profile.payGroup}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  payGroup: event.target.value as PayGroup,
                })
              }
            >
              {payGroups.map((group) => (
                <option value={group} key={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Stufe</span>
            <select
              value={profile.payLevel}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  payLevel: Number(event.target.value) as PayLevel,
                })
              }
            >
              {payLevels.map((level) => (
                <option value={level} key={level}>
                  Stufe {level}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Zuschlags-Stundenwert in €</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="z. B. 25.00"
              value={profile.premiumHourlyRate ?? ""}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  premiumHourlyRate:
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                })
              }
            />
          </label>

          <p className="profile-helper">
            Der Zuschlags-Stundenwert wird vorerst manuell eingetragen. Später
            kann CareCheck ihn automatisch aus TVöD-Gruppe, Stufe und
            Tabellenentgelt berechnen.
          </p>

          <Button type="button" variant="secondary">
            Profil wird automatisch gespeichert
          </Button>
        </div>
      </Card>
    </section>
  );
}