import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { useAppContext } from "../context/useAppContext";
import {
  calculateTvoedPModule,
  type TvoedPAssessmentStatus,
} from "../services/tariff/tvoedPModuleService";
import {
  getTvoedPHourlyRate,
  getTvoedPMonthlySalary,
  getTvoedPPremiumHourlyRate,
  getTvoedPTariffLabel,
} from "../services/tariff/tvoedPTariffService";

const monthNames = [
  "Januar",
  "Februar",
  "Maerz",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function formatEuro(value: number | null): string {
  if (value === null) {
    return "nicht verfuegbar";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatHours(value: number): string {
  return `${value.toLocaleString("de-DE", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })} h`;
}

function getAssessmentClassName(status: TvoedPAssessmentStatus): string {
  return `tvoed-assessment tvoed-assessment-${status}`;
}

function getStatusText(status: TvoedPAssessmentStatus): string {
  if (status === "detected") {
    return "erkannt";
  }

  if (status === "review_required") {
    return "pruefen";
  }

  return "nicht erkannt";
}

export default function Salary() {
  const {
    profile,
    shifts,
    selectedYear,
    selectedMonth,
  } = useAppContext();

  const monthDateKey = `${selectedYear}-${String(
    selectedMonth + 1,
  ).padStart(2, "0")}-01`;
  const monthLabel = `${monthNames[selectedMonth]} ${selectedYear}`;

  const monthlySalary = getTvoedPMonthlySalary(
    profile.payGroup,
    profile.payLevel,
    monthDateKey,
  );

  const hourlyRate = getTvoedPHourlyRate(
    profile.payGroup,
    profile.payLevel,
    monthDateKey,
  );

  const premiumHourlyRate = getTvoedPPremiumHourlyRate(
    profile.payGroup,
    monthDateKey,
  );

  const tvoedModule = calculateTvoedPModule(
    shifts,
    profile,
    selectedYear,
    selectedMonth,
  );

  return (
    <section className="page salary-page">
      <PageHeader
        eyebrow="Gehalt"
        title="TVoeD-P Fachmodul"
        description="Tarifliche Orientierung fuer Monatsentgelt, Zuschlagsbasis, Schichtmuster und Monatszuschlaege."
      />

      <Card className="salary-overview-card">
        <div className="salary-section-header">
          <span className="card-label">Aktuelles Profil</span>
          <strong>
            {profile.payGroup} - Stufe {profile.payLevel}
          </strong>
          <p>{getTvoedPTariffLabel(monthDateKey)}</p>
        </div>

        <div className="salary-value-grid">
          <div>
            <span>Monatsentgelt</span>
            <strong>{formatEuro(monthlySalary)}</strong>
          </div>

          <div>
            <span>Stundenwert</span>
            <strong>{formatEuro(hourlyRate)}</strong>
          </div>

          <div className="highlight">
            <span>Zuschlagsbasis</span>
            <strong>{formatEuro(premiumHourlyRate)}</strong>
          </div>
        </div>

        <p className="salary-helper">
          Die Zuschlagsbasis folgt der TVoeD-P-Zeitzuschlagslogik mit
          Stufe 3 der gewaehlten Entgeltgruppe.
        </p>
      </Card>

      <div className="tvoed-module-grid">
        <Card className="tvoed-module-card">
          <div className="salary-section-header">
            <span className="card-label">Monatsauswertung</span>
            <strong>{monthLabel}</strong>
            <p>
              Plan, tatsaechliche Arbeitszeit und Zuschlaege bleiben von
              ArbZG-Compliance getrennt.
            </p>
          </div>

          <div className="tvoed-metric-grid">
            <div>
              <span>Sollstunden</span>
              <strong>
                {formatHours(tvoedModule.workingTime.targetHours)}
              </strong>
            </div>

            <div>
              <span>Planungsstunden</span>
              <strong>
                {formatHours(tvoedModule.workingTime.plannedHours)}
              </strong>
            </div>

            <div>
              <span>Arbeitsstunden</span>
              <strong>
                {formatHours(tvoedModule.workingTime.actualWorkHours)}
              </strong>
            </div>

            <div>
              <span>Abwesenheiten</span>
              <strong>
                {formatHours(tvoedModule.workingTime.absenceHours)}
              </strong>
            </div>
          </div>
        </Card>

        <Card className="tvoed-module-card">
          <div className="salary-section-header">
            <span className="card-label">Schichtbewertung</span>
            <strong>Schicht und Wechselschicht</strong>
            <p>
              Monatsindiz fuer regelmaessige Dienstlagen, keine
              abschliessende Rechtsbewertung.
            </p>
          </div>

          <div className="tvoed-assessment-list">
            <article
              className={getAssessmentClassName(
                tvoedModule.shiftWork.status,
              )}
            >
              <span>{getStatusText(tvoedModule.shiftWork.status)}</span>
              <strong>{tvoedModule.shiftWork.label}</strong>
              <ul>
                {tvoedModule.shiftWork.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article
              className={getAssessmentClassName(
                tvoedModule.alternatingShiftWork.status,
              )}
            >
              <span>
                {getStatusText(tvoedModule.alternatingShiftWork.status)}
              </span>
              <strong>{tvoedModule.alternatingShiftWork.label}</strong>
              <ul>
                {tvoedModule.alternatingShiftWork.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </Card>

        <Card className="tvoed-module-card">
          <div className="salary-section-header">
            <span className="card-label">Zuschlaege</span>
            <strong>
              {tvoedModule.premiumSummary.totalAmount !== null
                ? formatEuro(tvoedModule.premiumSummary.totalAmount)
                : "Noch kein Betrag"}
            </strong>
            <p>
              Tagesbezogene Zuschlaege werden nicht doppelt gezaehlt; Nacht
              laeuft separat.
            </p>
          </div>

          {tvoedModule.premiumSummary.lines.length === 0 ? (
            <p className="salary-helper">
              Fuer diesen Monat wurden keine zuschlagspflichtigen
              Arbeitszeiten erkannt.
            </p>
          ) : (
            <div className="tvoed-premium-list">
              {tvoedModule.premiumSummary.lines.map((line) => (
                <div className="tvoed-premium-row" key={line.key}>
                  <div>
                    <strong>{line.label}</strong>
                    <span>
                      {formatHours(line.hours)} - {line.percentage} %
                    </span>
                  </div>

                  <strong>
                    {line.amount !== null
                      ? formatEuro(line.amount)
                      : "EUR offen"}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="tvoed-module-card">
          <div className="salary-section-header">
            <span className="card-label">Wochenenden</span>
            <strong>{tvoedModule.weekendAssessment.label}</strong>
            <p>
              Bewertung fuer den ausgewaehlten Monat und das gewaehlte
              Bundesland.
            </p>
          </div>

          <div className="tvoed-metric-grid tvoed-weekend-grid">
            <div>
              <span>Wochenenden</span>
              <strong>{tvoedModule.weekendAssessment.totalWeekends}</strong>
            </div>

            <div>
              <span>frei</span>
              <strong>{tvoedModule.weekendAssessment.freeWeekends}</strong>
            </div>

            <div>
              <span>mit Dienst</span>
              <strong>{tvoedModule.weekendAssessment.workWeekends}</strong>
            </div>

            <div>
              <span>Diensttage</span>
              <strong>{tvoedModule.weekendAssessment.weekendWorkDays}</strong>
            </div>
          </div>
        </Card>
      </div>

      <Card className="tvoed-transparency-card">
        <div className="salary-section-header">
          <span className="card-label">Transparenz</span>
          <strong>{tvoedModule.tariffVersion.label}</strong>
          <p>{tvoedModule.tariffVersion.sourceNote}</p>
        </div>

        <ul className="tvoed-note-list">
          {tvoedModule.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
