import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAppContext } from "../context/AppContext";
import {
  getTvoedPHourlyRate,
  getTvoedPMonthlySalary,
  getTvoedPPremiumHourlyRate,
  getTvoedPTariffLabel,
} from "../services/tariff/tvoedPTariffService";
import type {
  FederalState,
  PayGroup,
  PayLevel,
  ShiftTemplate,
  ShiftType,
} from "../types/index";

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

const templateLabels: { type: ShiftType; label: string }[] = [
  { type: "EARLY", label: "Frühdienst" },
  { type: "LATE", label: "Spätdienst" },
  { type: "NIGHT", label: "Nachtdienst" },
  { type: "DAY", label: "Tagdienst" },
  { type: "TRAINING", label: "Fortbildung" },
  { type: "VACATION", label: "Urlaub" },
  { type: "SICK", label: "Krank" },
  { type: "FREE", label: "Frei" },
  { type: "CUSTOM", label: "Individuell" },
];

function formatEuro(value: number | null): string {
  if (value === null) {
    return "nicht verfügbar";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default function Profile() {
  const {
    profile,
    setProfile,
    shiftTemplates,
    updateShiftTemplate,
    resetShiftTemplates,
  } = useAppContext();

  const monthlySalary = getTvoedPMonthlySalary(
    profile.payGroup,
    profile.payLevel,
  );

  const individualHourlyRate = getTvoedPHourlyRate(
    profile.payGroup,
    profile.payLevel,
  );

  const premiumHourlyRate = getTvoedPPremiumHourlyRate(profile.payGroup);

  function handleTemplateChange(
    type: ShiftType,
    field: keyof ShiftTemplate,
    value: string,
  ) {
    const current = shiftTemplates[type];

    updateShiftTemplate(type, {
      ...current,
      [field]: field === "breakMinutes" ? Number(value) : value,
    });
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Einstellungen"
        title="Profil"
        description="Grunddaten für Dienstplan, Feiertage, Sollstunden, Zuschläge und Dienstvorlagen."
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

          <div className="tariff-box">
            <span>Automatische TVöD-P Werte</span>

            <div className="tariff-row">
              <p>Tarifstand</p>
              <strong>{getTvoedPTariffLabel()}</strong>
            </div>

            <div className="tariff-row">
              <p>Monatsentgelt laut Gruppe/Stufe</p>
              <strong>{formatEuro(monthlySalary)}</strong>
            </div>

            <div className="tariff-row">
              <p>Individueller Stundenwert</p>
              <strong>{formatEuro(individualHourlyRate)}</strong>
            </div>

            <div className="tariff-row highlight">
              <p>Zuschlags-Stundenwert</p>
              <strong>{formatEuro(premiumHourlyRate)}</strong>
            </div>

            <p className="profile-helper">
              Für TVöD-Zeitzuschläge verwendet CareCheck automatisch Stufe 3 der
              jeweiligen Entgeltgruppe. Bei {profile.payGroup} ist das{" "}
              {formatEuro(premiumHourlyRate)}.
            </p>
          </div>

          <div className="template-settings">
            <div className="template-settings-header">
              <div>
                <span className="card-label">Dienstvorlagen</span>
                <strong>Standardzeiten</strong>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={resetShiftTemplates}
              >
                Zurücksetzen
              </Button>
            </div>

            <p className="profile-helper">
              Diese Zeiten werden automatisch übernommen, wenn du im Dienstplan
              eine Dienstart auswählst. Du kannst sie pro Dienst weiterhin
              manuell ändern.
            </p>

            <div className="template-grid">
              {templateLabels.map((item) => {
                const template = shiftTemplates[item.type];

                return (
                  <div className="template-card" key={item.type}>
                    <strong>{item.label}</strong>

                    <label className="field">
                      <span>Beginn</span>
                      <input
                        type="time"
                        value={template.startTime}
                        onChange={(event) =>
                          handleTemplateChange(
                            item.type,
                            "startTime",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="field">
                      <span>Ende</span>
                      <input
                        type="time"
                        value={template.endTime}
                        onChange={(event) =>
                          handleTemplateChange(
                            item.type,
                            "endTime",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="field">
                      <span>Pause Minuten</span>
                      <input
                        type="number"
                        min="0"
                        value={template.breakMinutes}
                        onChange={(event) =>
                          handleTemplateChange(
                            item.type,
                            "breakMinutes",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <Button type="button" variant="secondary">
            Profil wird automatisch gespeichert
          </Button>
        </div>
      </Card>
    </section>
  );
}