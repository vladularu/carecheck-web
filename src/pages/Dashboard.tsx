import { useNavigate } from "react-router-dom";
import DashboardHero from "../components/dashboard/DashboardHero";
import ExportCard from "../components/dashboard/ExportCard";
import MonthlyPremiumSummary from "../components/dashboard/MonthlyPremiumSummary";
import ShiftSummary from "../components/dashboard/ShiftSummary";
import StatusCard from "../components/dashboard/StatusCard";
import WorkSummary from "../components/dashboard/WorkSummary";
import { useAppContext } from "../context/useAppContext";
import {
  calculateMonthlyHours,
  filterShiftsByMonth,
} from "../services/calculation/monthlyHoursCalculator";
import { calculateMonthlyPremiums } from "../services/calculation/monthlyPremiumCalculator";
import { calculateMonthlyCompliance } from "../services/compliance/monthlyComplianceService";
import { downloadMonthlyReportCsv } from "../services/export/monthlyReportCsvService";
import { getTvoedPPremiumHourlyRate } from "../services/tariff/tvoedPTariffService";

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

function formatHours(value: number): string {
  return `${value.toLocaleString("de-DE", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })} h`;
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("de-DE", {
    maximumFractionDigits: 0,
  })}%`;
}

function getBalanceText(
  balanceHours: number,
): string {
  if (balanceHours > 0) {
    return `+${formatHours(balanceHours)}`;
  }

  return formatHours(balanceHours);
}

function getCockpitStatusLabel(
  criticalCount: number,
  warningCount: number,
): string {
  if (criticalCount > 0) {
    return "Kritisch";
  }

  if (warningCount > 0) {
    return "Warnungen";
  }

  return "Unauffällig";
}

function getCockpitStatusClassName(
  criticalCount: number,
  warningCount: number,
): string {
  if (criticalCount > 0) {
    return "cockpit-status cockpit-status-critical";
  }

  if (warningCount > 0) {
    return "cockpit-status cockpit-status-warning";
  }

  return "cockpit-status cockpit-status-ok";
}

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    profile,
    shifts,
    selectedYear,
    selectedMonth,
  } = useAppContext();

  const monthLabel =
    `${monthNames[selectedMonth]} ${selectedYear}`;

  const premiumHourlyRate =
    getTvoedPPremiumHourlyRate(
      profile.payGroup,
    );

  const shiftsInSelectedMonth =
    filterShiftsByMonth(
      shifts,
      selectedYear,
      selectedMonth,
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

  const criticalCount =
    complianceIssues.filter(
      (issue) =>
        issue.severity === "critical",
    ).length;

  const warningCount =
    complianceIssues.filter(
      (issue) =>
        issue.severity === "warning",
    ).length;

  const monthlyHours =
    calculateMonthlyHours(
      shifts,
      profile,
      selectedYear,
      selectedMonth,
    );

  const monthlyPremiums =
    calculateMonthlyPremiums(
      shifts,
      selectedYear,
      selectedMonth,
      {
        federalState:
          profile.federalState,
        baseHourlyRate:
          premiumHourlyRate,
        holidayMode:
          "WITH_TIME_OFF",
      },
    );

  const checkedShiftCount =
    complianceRelevantShiftsInSelectedMonth.length;

  const progress =
    monthlyHours.targetHours > 0
      ? Math.min(
          100,
          Math.round(
            (
              monthlyHours.actualHours /
              monthlyHours.targetHours
            ) * 100,
          ),
        )
      : 0;

  const remainingHours = Math.max(
    0,
    Math.round(
      (
        monthlyHours.targetHours -
        monthlyHours.actualHours
      ) * 100,
    ) / 100,
  );

  const profileLabel =
    `${profile.federalState} · ` +
    `${profile.weeklyHours} h/Woche · ` +
    `${profile.payGroup} Stufe ${profile.payLevel} · ` +
    `Zuschlagsbasis ${premiumHourlyRate} €/h`;

  const absenceLabel =
    `Urlaub ${formatHours(
      monthlyHours.vacationHours,
    )} · Krank ${formatHours(
      monthlyHours.sickHours,
    )} · Abwesenheiten gesamt ${formatHours(
      monthlyHours.absenceHours,
    )}`;

  function handleExportCsv() {
    downloadMonthlyReportCsv({
      monthLabel,
      profile,
      shifts: shiftsInSelectedMonth,
      monthlyHours,
      monthlyPremiums,
      complianceIssues,
    });
  }

async function handleExportXlsx(): Promise<void> {
  try {
    const {
      downloadMonthlyReportXlsx,
    } = await import(
      "../services/export/monthlyReportXlsxService"
    );

    downloadMonthlyReportXlsx({
      monthLabel,
      profile,
      shifts: shiftsInSelectedMonth,
      monthlyHours,
      monthlyPremiums,
      complianceIssues,
    });
  } catch (error) {
    console.error(
      "Excel-Export konnte nicht geladen werden.",
      error,
    );

    window.alert(
      "Der Excel-Export konnte nicht gestartet werden. Bitte versuche es erneut.",
    );
  }
}

  return (
    <>
      <section className="dashboard-page dashboard-desktop-legacy">
        <DashboardHero
          monthLabel={monthLabel}
          profileLabel={profileLabel}
          absenceLabel={absenceLabel}
        />

        <WorkSummary
          actualHours={
            monthlyHours.actualHours
          }
          targetHours={
            monthlyHours.targetHours
          }
          balanceHours={
            monthlyHours.balanceHours
          }
          remainingHours={
            remainingHours
          }
          overtimeHours={
            monthlyHours.overtimeHours
          }
          progress={progress}
          workingDayCount={
            monthlyHours.workingDayCount
          }
          publicHolidayCount={
            monthlyHours.publicHolidayCount
          }
          holidayReductionHours={
            monthlyHours.holidayReductionHours
          }
          averageDailyHours={
            monthlyHours.averageDailyHours
          }
        />

        <StatusCard
          criticalCount={criticalCount}
          warningCount={warningCount}
          issueCount={
            complianceIssues.length
          }
          checkedShiftCount={
            checkedShiftCount
          }
        />

        <MonthlyPremiumSummary
          monthlyPremiums={
            monthlyPremiums
          }
          hasHourlyRate={
            premiumHourlyRate > 0
          }
        />

        <ExportCard
          onExportCsv={handleExportCsv}
          onExportXlsx={
            handleExportXlsx
          }
          onOpenReport={() =>
            navigate("/bericht")
          }
        />

        <ShiftSummary
          workShiftCount={
            monthlyHours.workShiftCount
          }
          planningEntryCount={
            monthlyHours.planningEntryCount
          }
          plannedDayCount={
            monthlyHours.plannedDayCount
          }
          calendarEntryCount={
            monthlyHours.calendarEntryCount
          }
          vacationDayCount={
            monthlyHours.vacationDayCount
          }
          sickDayCount={
            monthlyHours.sickDayCount
          }
          trainingDayCount={
            monthlyHours.trainingDayCount
          }
          freeDayCount={
            monthlyHours.freeDayCount
          }
          shiftTypeCounts={
            monthlyHours.shiftTypeCounts
          }
        />
      </section>

      <section className="dashboard-page premium-month-cockpit dashboard-mobile-cockpit">
        <DashboardHero
          monthLabel={monthLabel}
          profileLabel={profileLabel}
          absenceLabel={absenceLabel}
        />

        <section
          className="cockpit-overview-card"
          aria-label="Monatsübersicht"
        >
          <div className="cockpit-overview-header">
            <div>
              <span className="cockpit-eyebrow">
                Monatsstatus
              </span>

              <h2>{monthLabel}</h2>
            </div>

            <span
              className={
                getCockpitStatusClassName(
                  criticalCount,
                  warningCount,
                )
              }
            >
              {getCockpitStatusLabel(
                criticalCount,
                warningCount,
              )}
            </span>
          </div>

          <div className="cockpit-main-values">
            <div>
              <span>Iststunden</span>

              <strong>
                {formatHours(
                  monthlyHours.actualHours,
                )}
              </strong>
            </div>

            <div>
              <span>Sollstunden</span>

              <strong>
                {formatHours(
                  monthlyHours.targetHours,
                )}
              </strong>
            </div>

            <div>
              <span>Saldo</span>

              <strong>
                {getBalanceText(
                  monthlyHours.balanceHours,
                )}
              </strong>
            </div>
          </div>

          <div className="cockpit-progress-area">
            <div className="cockpit-progress-label">
              <span>
                Monatsfortschritt
              </span>

              <strong>
                {formatPercent(progress)}
              </strong>
            </div>

            <div className="cockpit-progress-track">
              <span
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <div className="cockpit-mini-grid">
            <article>
              <span>Reststunden</span>

              <strong>
                {formatHours(
                  remainingHours,
                )}
              </strong>
            </article>

            <article>
              <span>Überstunden</span>

              <strong>
                {formatHours(
                  monthlyHours.overtimeHours,
                )}
              </strong>
            </article>

            <article>
              <span>Arbeitsdienste</span>

              <strong>
                {
                  monthlyHours
                    .workShiftCount
                }
              </strong>
            </article>

            <article>
              <span>Geprüft</span>

              <strong>
                {checkedShiftCount}
              </strong>
            </article>
          </div>
        </section>

        <section className="cockpit-content-grid">
          <div className="cockpit-content-main">
            <WorkSummary
              actualHours={
                monthlyHours.actualHours
              }
              targetHours={
                monthlyHours.targetHours
              }
              balanceHours={
                monthlyHours.balanceHours
              }
              remainingHours={
                remainingHours
              }
              overtimeHours={
                monthlyHours.overtimeHours
              }
              progress={progress}
              workingDayCount={
                monthlyHours.workingDayCount
              }
              publicHolidayCount={
                monthlyHours.publicHolidayCount
              }
              holidayReductionHours={
                monthlyHours.holidayReductionHours
              }
              averageDailyHours={
                monthlyHours.averageDailyHours
              }
            />

            <StatusCard
              criticalCount={
                criticalCount
              }
              warningCount={
                warningCount
              }
              issueCount={
                complianceIssues.length
              }
              checkedShiftCount={
                checkedShiftCount
              }
            />
          </div>

          <div className="cockpit-content-side">
            <MonthlyPremiumSummary
              monthlyPremiums={
                monthlyPremiums
              }
              hasHourlyRate={
                premiumHourlyRate > 0
              }
            />
          </div>
        </section>

        <div className="cockpit-wide-card">
          <ShiftSummary
            workShiftCount={
              monthlyHours.workShiftCount
            }
            planningEntryCount={
              monthlyHours.planningEntryCount
            }
            plannedDayCount={
              monthlyHours.plannedDayCount
            }
            calendarEntryCount={
              monthlyHours.calendarEntryCount
            }
            vacationDayCount={
              monthlyHours.vacationDayCount
            }
            sickDayCount={
              monthlyHours.sickDayCount
            }
            trainingDayCount={
              monthlyHours.trainingDayCount
            }
            freeDayCount={
              monthlyHours.freeDayCount
            }
            shiftTypeCounts={
              monthlyHours.shiftTypeCounts
            }
          />
        </div>

        <ExportCard
          onExportCsv={
            handleExportCsv
          }
          onExportXlsx={
            handleExportXlsx
          }
          onOpenReport={() =>
            navigate("/bericht")
          }
        />
      </section>
    </>
  );
}