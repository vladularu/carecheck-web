import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import DataBackupCard from "../components/profile/DataBackupCard";
import { useAppContext } from "../context/useAppContext";
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
  { value: "BW", label: "Baden-WÃ¼rttemberg" },
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
  { value: "TH", label: "ThÃ¼ringen" },
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

const templateLabels: { type: ShiftType; label: string; helper: string }[] = [
  { type: "EARLY", label: "FrÃ¼hdienst", helper: "Standard-FrÃ¼hdienst" },
  { type: "LATE", label: "SpÃ¤tdienst", helper: "Standard-SpÃ¤tdienst" },
  { type: "NIGHT", label: "Nachtdienst", helper: "Dienst Ã¼ber Mitternacht" },
  { type: "DAY", label: "Tagdienst", helper: "RegulÃ¤rer Tagdienst" },
  { type: "TRAINING", label: "Fortbildung", helper: "Arbeitszeit Fortbildung" },
  { type: "VACATION", label: "Urlaub", helper: "Abwesenheit / geplant" },
  { type: "SICK", label: "Krank", helper: "Abwesenheit / krank" },
  { type: "FREE", label: "Frei", helper: "ZÃ¤hlt mit 0 Stunden" },
  { type: "CUSTOM", label: "Individuell", helper: "Freie Dienstvorlage" },
];

function formatEuro(value: number | null): string {
  if (value === null) {
    return "nicht verfÃ¼gbar";
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
    <section className="page profile-page">
      <PageHeader
        eyebrow="Einstellungen"
        title="Profil"
        description="Grunddaten fÃ¼r Dienstplan, Feiertage, Sollstunden, ZuschlÃ¤ge und Dienstvorlagen."
      />

      <div className="profile-grid">
        <Card className="profile-section-card">
          <div className="profile-section-header">
            <span className="card-label">Arbeitszeit</span>
            <strong>Standort & Wochenstunden</strong>
            <p>
              Diese Angaben steuern Feiertage, Sollstunden und Monatsauswertung.
            </p>
          </div>

          <div className="profile-form-grid">
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
          </div>
        </Card>

        <Card className="profile-section-card">
          <div className="profile-section-header">
            <span className="card-label">Tarif</span>
            <strong>TVÃ¶D-P Eingruppierung</strong>
            <p>
              Gruppe und Stufe bestimmen Monatsentgelt, Stundenwert und
              Zuschlagsbasis.
            </p>
          </div>

          <div className="profile-form-grid">
            <label className="field">
              <span>TVÃ¶D-P Gruppe</span>
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
          </div>
        </Card>
      </div>

      <Card className="profile-section-card tariff-summary-card">
        <div className="profile-section-header">
          <span className="card-label">Automatische Werte</span>
          <strong>TVÃ¶D-P Berechnung</strong>
          <p>
            CareCheck nutzt diese Werte fÃ¼r GehaltsÃ¼bersicht und
            Zuschlagsberechnung.
          </p>
        </div>

        <div className="tariff-summary-grid">
          <div>
            <span>Tarifstand</span>
            <strong>{getTvoedPTariffLabel()}</strong>
          </div>

          <div>
            <span>Monatsentgelt</span>
            <strong>{formatEuro(monthlySalary)}</strong>
          </div>

          <div>
            <span>Individueller Stundenwert</span>
            <strong>{formatEuro(individualHourlyRate)}</strong>
          </div>

          <div className="highlight">
            <span>Zuschlags-Stundenwert</span>
            <strong>{formatEuro(premiumHourlyRate)}</strong>
          </div>
        </div>

        <p className="profile-helper">
          FÃ¼r TVÃ¶D-ZeitzuschlÃ¤ge verwendet CareCheck automatisch Stufe 3 der
          jeweiligen Entgeltgruppe. Bei {profile.payGroup} ist das{" "}
          {formatEuro(premiumHourlyRate)}.
        </p>
      </Card>

      <Card className="profile-section-card">
        <div className="template-settings-header">
          <div className="profile-section-header">
            <span className="card-label">Dienstvorlagen</span>
            <strong>Standardzeiten</strong>
            <p>
              Diese Zeiten werden automatisch Ã¼bernommen, wenn du im Dienstplan
              eine Dienstart auswÃ¤hlst. Jeder einzelne Dienst kann trotzdem
              manuell angepasst werden.
            </p>
          </div>

          <Button type="button" variant="secondary" onClick={resetShiftTemplates}>
            ZurÃ¼cksetzen
          </Button>
        </div>

        <div className="template-grid">
          {templateLabels.map((item) => {
            const template = shiftTemplates[item.type];

            return (
              <article className="template-card" key={item.type}>
                <div className="template-card-header">
                  <strong>{item.label}</strong>
                  <span>{item.helper}</span>
                </div>

                <div className="template-card-fields">
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
                    <span>Pause</span>
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
              </article>
            );
          })}
        </div>

        <div className="profile-save-note">
          <strong>Automatisch gespeichert</strong>
          <p>
            Ã„nderungen an Profil und Dienstvorlagen werden lokal im Browser
            gespeichert.
          </p>
        </div>
      </Card>

      <DataBackupCard />
    </section>
  );
}
