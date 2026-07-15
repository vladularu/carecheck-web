import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import ExportPreviewSummary from "../components/report/ExportPreviewSummary";
import { useAppContext } from "../context/useAppContext";
import { createCalendar } from "../services/calendar/calendarService";
import {
  calculateMonthlyHours,
  filterShiftsByMonth,
} from "../services/calculation/monthlyHoursCalculator";
import { calculateMonthlyPremiums } from "../services/calculation/monthlyPremiumCalculator";
import { calculateMonthlyCompliance } from "../services/compliance/monthlyComplianceService";
import {
  getReportBreakLabel,
  getReportNetHours,
} from "../services/export/monthlyReportEntryFormatter";
import { createMonthlyReportExportPreview } from "../services/export/monthlyReportExportPreview";
import {
  monthlyReportLabels,
  monthlyReportSeverityHelpLabels,
  monthlyReportSeverityLabels,
  monthlyReportShiftLabels,
} from "../services/export/monthlyReportLabels";
import {
  formatDateGerman,
} from "../services/format/dateTimeFormat";
import { getHolidaysForState } from "../services/holiday/holidayService";
import { getTvoedPPremiumHourlyRate } from "../services/tariff/tvoedPTariffService";
import type { ComplianceIssue, Shift } from "../types/index";

const monthNames = [
  "Januar",
  "Februar",
  "März",
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
    return "—";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatHours(value: number): string {
  return `${new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)} h`;
}

function formatReportDate(): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function formatWeekday(dateKey: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
  }).format(new Date(`${dateKey}T00:00:00`));
}

function getPrintableTimeLabel(shift: Shift, field: "startTime" | "endTime") {
  if (
    shift.type === "VACATION" ||
    shift.type === "SICK" ||
    shift.type === "FREE"
  ) {
    return "—";
  }

  return shift[field];
}

function groupShiftsByDate(shifts: Shift[]): Map<string, Shift[]> {
  const grouped = new Map<string, Shift[]>();

  for (const shift of shifts) {
    const current = grouped.get(shift.date) ?? [];

    grouped.set(shift.date, [...current, shift]);
  }

  return grouped;
}

function sortShiftsByDateAndStart(shifts: Shift[]): Shift[] {
  return [...shifts].sort((first, second) =>
    `${first.date}T${first.startTime}`.localeCompare(
      `${second.date}T${second.startTime}`,
    ),
  );
}

function getIssueDateLabel(
  issue: ComplianceIssue,
  shiftsById: Map<string, Shift>,
): string {
  if (!issue.relatedShiftId) {
    return "Monat";
  }

  const shift = shiftsById.get(issue.relatedShiftId);

  return shift ? formatDateGerman(shift.date) : "Monat";
}

export default function MonthlyReport() {
  const {
    profile,
    shifts,
    selectedYear,
    selectedMonth,
  } = useAppContext();

  const monthLabel =
    `${monthNames[selectedMonth]} ${selectedYear}`;

  const premiumHourlyRate =
    getTvoedPPremiumHourlyRate(profile.payGroup);

  const shiftsInSelectedMonth = filterShiftsByMonth(
    shifts,
    selectedYear,
    selectedMonth,
  );

  const reportShifts = sortShiftsByDateAndStart(
    shiftsInSelectedMonth,
  );

  const shiftsByDate = groupShiftsByDate(reportShifts);

  const shiftsById = new Map(
    reportShifts.map((shift) => [shift.id, shift]),
  );

  const holidaysByDate = new Map(
    getHolidaysForState(
      selectedYear,
      profile.federalState,
    ).map((holiday) => [holiday.date, holiday]),
  );

  const calendarWeeks = createCalendar(
    selectedYear,
    selectedMonth,
  );

  const nightShiftCount = reportShifts.filter(
    (shift) => shift.type === "NIGHT",
  ).length;

  const monthlyHours = calculateMonthlyHours(
    shifts,
    profile,
    selectedYear,
    selectedMonth,
  );

  const monthlyPremiums = calculateMonthlyPremiums(
    shifts,
    selectedYear,
    selectedMonth,
    {
      federalState: profile.federalState,
      baseHourlyRate: premiumHourlyRate,
      holidayMode: "WITH_TIME_OFF",
    },
  );

  const monthlyCompliance =
    calculateMonthlyCompliance(
    shifts,
    selectedYear,
    selectedMonth,
  );

  const {
    issues: complianceIssues,
    complianceRelevantShiftsInSelectedMonth,
  } = monthlyCompliance;

  const criticalCount = complianceIssues.filter(
    (issue) => issue.severity === "critical",
  ).length;

  const warningCount = complianceIssues.filter(
    (issue) => issue.severity === "warning",
  ).length;

  const infoCount = complianceIssues.filter(
    (issue) => issue.severity === "info",
  ).length;

  const reportStatus =
    criticalCount > 0
      ? "Kritische Hinweise vorhanden"
      : warningCount > 0
        ? "Warnungen vorhanden"
        : monthlyReportLabels.emptyStates
            .compliance;

  const exportPreview =
    createMonthlyReportExportPreview({
      monthLabel,
      monthlyHours,
      monthlyPremiums,
      complianceIssues,
    });

  const calculationBasisRows = [
    {
      label: "Ausgewerteter Zeitraum",
      value: monthLabel,
      detail:
        "Alle Monatswerte beziehen sich auf die Kalendereinträge im ausgewählten Monat.",
    },
    {
      label: "Profilgrundlage",
      value:
        `${profile.federalState} · ${profile.weeklyHours} h/Woche · ` +
        `${profile.payGroup} Stufe ${profile.payLevel}`,
      detail:
        "Bundesland, Wochenarbeitszeit und Entgeltgruppe stammen aus dem Profil.",
    },
    {
      label: "Sollzeit",
      value:
        `${monthlyHours.workingDayCount} Soll-Arbeitstage · ` +
        `${monthlyHours.publicHolidayCount} Feiertage · ` +
        `${formatHours(monthlyHours.averageDailyHours)} täglich`,
      detail:
        "Sollstunden werden aus Arbeitstagen, Feiertagen und der Wochenarbeitszeit abgeleitet.",
    },
    {
      label: "Abwesenheiten",
      value:
        `${formatHours(monthlyHours.vacationHours)} Urlaub · ` +
        `${formatHours(monthlyHours.sickHours)} Krank`,
      detail:
        "Urlaub nutzt die tägliche Sollzeit; Krankheit nutzt gespeicherte Gutschriften oder die tägliche Sollzeit.",
    },
    {
      label: "Compliance-Prüfung",
      value: `${complianceRelevantShiftsInSelectedMonth.length} relevante Einträge`,
      detail:
        "FREE, Urlaub und Krankheit werden nicht als tatsächliche ArbZG-Arbeitsdienste geprüft.",
    },
    {
      label: "Zuschlagsbasis",
      value:
        `${formatEuro(premiumHourlyRate)} · Feiertage mit Freizeitausgleich`,
      detail:
        "Zuschläge werden aus den erfassten Dienstzeiten, dem Bundesland und der TVöD-P-Zuschlagsbasis berechnet.",
    },
  ];

  const complianceSummaryRows = [
    {
      label: monthlyReportSeverityLabels.critical,
      count: criticalCount,
      severity: "critical",
    },
    {
      label: monthlyReportSeverityLabels.warning,
      count: warningCount,
      severity: "warning",
    },
    {
      label: monthlyReportSeverityLabels.info,
      count: infoCount,
      severity: "info",
    },
  ] as const;

  function handlePrint() {
    const previousTitle = document.title;
    let titleRestored = false;

    const restoreTitle = () => {
      if (titleRestored) {
        return;
      }

      titleRestored = true;
      document.title = previousTitle;
    };

    window.addEventListener(
      "afterprint",
      restoreTitle,
      { once: true },
    );
    document.title = exportPreview.fileBaseName;
    window.print();

    // Keep the title available for browser PDF dialogs that use it as filename.
    window.setTimeout(() => {
      restoreTitle();
    }, 30000);
  }

  return (
    <section className="page monthly-report-page">
      <div className="no-print">
        <PageHeader
          eyebrow="Bericht"
          title={`Monatsbericht · ${monthLabel}`}
          description="Druckansicht für PDF-Export über den Browser."
        />

        <Card className="report-action-card">
          <div className="report-action-header">
            <strong>Exportvorschau</strong>
            <p>
              Grundlage für Druck, PDF,
              CSV und XLSX.
            </p>
          </div>

          <ExportPreviewSummary
            preview={exportPreview}
            className="report-export-preview"
          />

          <div className="report-actions">
            <Button
              type="button"
              onClick={handlePrint}
            >
              Drucken / als PDF speichern
            </Button>

            <p className="report-print-hint">
              PDF-Dateiname im Druckdialog:{" "}
              <strong>{exportPreview.pdfFileName}</strong>
            </p>
          </div>
        </Card>
      </div>

      <article className="print-report">
        <header className="print-report-header">
          <div>
            <span>CareCheck</span>
            <h1>Monatsbericht</h1>
            <p>{monthLabel}</p>
          </div>

          <div className="print-report-meta">
            <strong>
              {profile.payGroup} Stufe {profile.payLevel}
            </strong>

            <p>
              {profile.federalState} ·{" "}
              {profile.weeklyHours} h/Woche · 5-Tage-Woche
            </p>

            <p>Erstellt am {formatReportDate()}</p>
          </div>
        </header>

        <section className="print-report-status">
          <div>
            <span>Monatsstatus</span>
            <strong>{reportStatus}</strong>
          </div>

          <div>
            <span>
              {
                monthlyReportLabels.workingTime
                  .balance
              }
            </span>
            <strong>
              {formatHours(monthlyHours.balanceHours)}
            </strong>
          </div>

          <div>
            <span>
              {
                monthlyReportLabels.sections
                  .premiums
              }
            </span>
            <strong>
              {formatEuro(monthlyPremiums.totalAmount)}
            </strong>
          </div>

          <div>
            <span>
              {
                monthlyReportLabels.sections
                  .compliance
              }
            </span>
            <strong>{complianceIssues.length}</strong>
          </div>
        </section>

        <section className="print-report-section">
          <div className="print-report-section-title">
            <span>01</span>
            <h2>
              {
                monthlyReportLabels.sections
                  .workingTime
              }
            </h2>
          </div>

          <div className="print-report-grid">
            <div>
              <span>
                {
                  monthlyReportLabels.workingTime
                    .targetHours
                }
              </span>
              <strong>
                {formatHours(monthlyHours.targetHours)}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.workingTime
                    .actualHours
                }
              </span>
              <strong>
                {formatHours(monthlyHours.actualHours)}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.workingTime
                    .balance
                }
              </span>
              <strong>
                {formatHours(monthlyHours.balanceHours)}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.workingTime
                    .overtime
                }
              </span>
              <strong>
                {formatHours(monthlyHours.overtimeHours)}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.workingTime
                    .undertime
                }
              </span>
              <strong>
                {formatHours(monthlyHours.undertimeHours)}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.workingTime
                    .workingDays
                }
              </span>
              <strong>
                {monthlyHours.workingDayCount}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.workingTime
                    .holidays
                }
              </span>
              <strong>
                {monthlyHours.publicHolidayCount}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.workingTime
                    .holidayReduction
                }
              </span>
              <strong>
                {formatHours(
                  monthlyHours.holidayReductionHours,
                )}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.workingTime
                    .averageDailyHours
                }
              </span>
              <strong>
                {formatHours(
                  monthlyHours.averageDailyHours,
                )}
              </strong>
            </div>

            <div>
              <span>Nachtdienste</span>
              <strong>{nightShiftCount}</strong>
            </div>
          </div>
        </section>

        <section className="print-report-section">
          <div className="print-report-section-title">
            <span>02</span>
            <h2>Monatskalender</h2>
          </div>

          <div
            className="print-report-calendar"
            aria-label={`Monatskalender ${monthLabel}`}
          >
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
              <div className="print-report-calendar-weekday" key={day}>
                {day}
              </div>
            ))}

            {calendarWeeks.flat().map((day) => {
              const dayShifts = shiftsByDate.get(day.dateKey) ?? [];
              const holiday = holidaysByDate.get(day.dateKey);

              return (
                <div
                  className={[
                    "print-report-calendar-day",
                    day.currentMonth ? "" : "outside-month",
                    day.weekend ? "weekend" : "",
                    holiday ? "holiday" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={day.dateKey}
                >
                  <div className="print-report-calendar-day-header">
                    <strong>{day.dayNumber}</strong>
                    {holiday && <span>FT</span>}
                  </div>

                  <div className="print-report-calendar-day-entries">
                    {dayShifts.slice(0, 2).map((shift) => (
                      <span key={shift.id}>
                        {monthlyReportShiftLabels[shift.type]}
                      </span>
                    ))}

                    {dayShifts.length > 2 && (
                      <span>+{dayShifts.length - 2} weitere</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="print-report-section">
          <div className="print-report-section-title">
            <span>03</span>
            <h2>
              {
                monthlyReportLabels.sections
                  .planning
              }
            </h2>
          </div>

          <div className="print-report-grid">
            <div>
              <span>
                {
                  monthlyReportLabels.planning
                    .workShifts
                }
              </span>
              <strong>
                {monthlyHours.workShiftCount}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.planning
                    .planningEntries
                }
              </span>
              <strong>
                {monthlyHours.planningEntryCount}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.planning
                    .plannedDays
                }
              </span>
              <strong>
                {monthlyHours.plannedDayCount}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.planning
                    .calendarEntries
                }
              </span>
              <strong>
                {monthlyHours.calendarEntryCount}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.planning
                    .vacationDays
                }
              </span>
              <strong>
                {monthlyHours.vacationDayCount}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.planning
                    .sickDays
                }
              </span>
              <strong>
                {monthlyHours.sickDayCount}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.planning
                    .vacationHours
                }
              </span>
              <strong>
                {formatHours(
                  monthlyHours.vacationHours,
                )}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.planning
                    .sickHours
                }
              </span>
              <strong>
                {formatHours(
                  monthlyHours.sickHours,
                )}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.planning
                    .absenceHours
                }
              </span>
              <strong>
                {formatHours(
                  monthlyHours.absenceHours,
                )}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.planning
                    .trainingDays
                }
              </span>
              <strong>
                {monthlyHours.trainingDayCount}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.planning
                    .freeDays
                }
              </span>
              <strong>
                {monthlyHours.freeDayCount}
              </strong>
            </div>

            <div>
              <span>
                {
                  monthlyReportLabels.planning
                    .complianceRelevantEntries
                }
              </span>
              <strong>
                {
                  complianceRelevantShiftsInSelectedMonth
                    .length
                }
              </strong>
            </div>
          </div>
        </section>

        <section className="print-report-section">
          <div className="print-report-section-title">
            <span>04</span>
            <h2>
              {
                monthlyReportLabels.sections
                  .premiums
              }
            </h2>
          </div>

          {monthlyPremiums.lines.length === 0 ? (
            <p className="print-report-empty">
              {
                monthlyReportLabels.emptyStates
                  .premiums
              }
            </p>
          ) : (
            <table className="print-report-table">
              <thead>
                <tr>
                  {monthlyReportLabels.tables.premiums.map(
                    (label) => (
                      <th key={label}>{label}</th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {monthlyPremiums.lines.map((line) => (
                  <tr key={line.key}>
                    <td>{line.label}</td>
                    <td>
                      {formatHours(line.hours)}
                    </td>
                    <td>{line.percentage} %</td>
                    <td>{formatEuro(line.amount)}</td>
                  </tr>
                ))}

                <tr className="print-report-total-row">
                  <td colSpan={3}>
                    {
                      monthlyReportLabels.totals
                        .premiums
                    }
                  </td>
                  <td>
                    {formatEuro(
                      monthlyPremiums.totalAmount,
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </section>

        <section className="print-report-section">
          <div className="print-report-section-title">
            <span>05</span>
            <h2>
              {
                monthlyReportLabels.sections
                  .compliance
              }
            </h2>
          </div>

          {complianceIssues.length === 0 ? (
            <p className="print-report-empty">
              {
                monthlyReportLabels.emptyStates
                  .complianceReport
              }
            </p>
          ) : (
            <>
              <div
                className="print-report-compliance-summary"
                aria-label="Prüfhinweise nach Schweregrad"
              >
                {complianceSummaryRows.map((row) => (
                  <div
                    key={row.severity}
                    className={`print-report-compliance-summary-item print-report-compliance-${row.severity}`}
                  >
                    <span>{row.label}</span>
                    <strong>{row.count}</strong>
                  </div>
                ))}
              </div>

              <div className="print-report-compliance-list">
                {complianceIssues.map((issue) => (
                  <article
                    key={issue.id}
                    className={`print-report-compliance-card print-report-compliance-${issue.severity}`}
                  >
                    <div className="print-report-compliance-card-header">
                      <span className="print-report-compliance-badge">
                        {
                          monthlyReportSeverityLabels[
                            issue.severity
                          ]
                        }
                      </span>
                      <strong>{issue.title}</strong>
                    </div>

                    <span className="print-report-compliance-date">
                      {getIssueDateLabel(issue, shiftsById)}
                    </span>

                    <p>{issue.description}</p>

                    <small>
                      {
                        monthlyReportSeverityHelpLabels[
                          issue.severity
                        ]
                      }
                    </small>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="print-report-section">
          <div className="print-report-section-title">
            <span>06</span>
            <h2>
              {monthlyReportLabels.sections.calculationBasis}
            </h2>
          </div>

          <dl className="print-report-basis-list">
            {calculationBasisRows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>
                  <strong>{row.value}</strong>
                  <span>{row.detail}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="print-report-section">
          <div className="print-report-section-title">
            <span>07</span>
            <h2>
              {
                monthlyReportLabels.sections
                  .calendarEntries
              }
            </h2>
          </div>

          {reportShifts.length === 0 ? (
            <p className="print-report-empty">
              {
                monthlyReportLabels.emptyStates
                  .calendarEntriesReport
              }
            </p>
          ) : (
            <table className="print-report-table print-report-shift-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Tag</th>
                  <th>Diensttyp</th>
                  <th>Beginn</th>
                  <th>Ende</th>
                  <th>Pause</th>
                  <th>Netto</th>
                  <th>Hinweis</th>
                </tr>
              </thead>

              <tbody>
                {reportShifts.map((shift) => (
                  <tr key={shift.id}>
                    <td>
                      {formatDateGerman(shift.date)}
                    </td>
                    <td>
                      {formatWeekday(shift.date)}
                    </td>
                    <td>
                      {
                        monthlyReportShiftLabels[
                          shift.type
                        ]
                      }
                    </td>
                    <td>
                      {getPrintableTimeLabel(shift, "startTime")}
                    </td>
                    <td>
                      {getPrintableTimeLabel(shift, "endTime")}
                    </td>
                    <td>
                      {getReportBreakLabel(shift)}
                    </td>
                    <td>
                      {formatHours(
                        getReportNetHours(
                          shift,
                          monthlyHours.averageDailyHours,
                        ),
                      )}
                    </td>
                    <td>{shift.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="print-report-footer">
          <p>
            Erstellt mit CareCheck · {formatReportDate()}
          </p>
        </footer>
      </article>
    </section>
  );
}
