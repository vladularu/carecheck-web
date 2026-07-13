import DashboardHero from "../components/dashboard/DashboardHero";
import ExportCard from "../components/dashboard/ExportCard";
import MonthlyPremiumSummary from "../components/dashboard/MonthlyPremiumSummary";
import ShiftSummary from "../components/dashboard/ShiftSummary";
import StatusCard from "../components/dashboard/StatusCard";
import WorkSummary from "../components/dashboard/WorkSummary";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/useAppContext";
import { downloadMonthlyReportXlsx } from "../services/export/monthlyReportXlsxService";
import {
  calculateMonthlyHours,
  filterShiftsByMonth,
} from "../services/calculation/monthlyHoursCalculator";
import { calculateMonthlyPremiums } from "../services/calculation/monthlyPremiumCalculator";
import { checkCompliance } from "../services/compliance/complianceService";
import { downloadMonthlyReportCsv } from "../services/export/monthlyReportCsvService";
import { getTvoedPPremiumHourlyRate } from "../services/tariff/tvoedPTariffService";
import { filterComplianceRelevantShifts } from "../services/calculation/shiftTypeRules";

const monthNames = [
  "Januar",
  "Februar",
  "MÃ¤rz",
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

function getBalanceText(balanceHours: number): string {
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

  return "UnauffÃ¤llig";
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
  const { profile, shifts, selectedYear, selectedMonth } = useAppContext();

  const monthLabel = `${monthNames[selectedMonth]} ${selectedYear}`;
  const premiumHourlyRate = getTvoedPPremiumHourlyRate(profile.payGroup);

  const shiftsInSelectedMonth = filterShiftsByMonth(
    shifts,
    selectedYear,
    selectedMonth,
  );

  const complianceRelevantShifts =
  filterComplianceRelevantShifts(shiftsInSelectedMonth);

const complianceIssues = checkCompliance(
  complianceRelevantShifts,
);

  const criticalCount = complianceIssues.filter(
    (issue) => issue.severity === "critical",
  ).length;

  const warningCount = complianceIssues.filter(
    (issue) => issue.severity === "warning",
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

  const progress =
    monthlyHours.targetHours > 0
      ? Math.min(
          100,
          Math.round(
            (monthlyHours.actualHours / monthlyHours.targetHours) * 100,
          ),
        )
      : 0;

  const remainingHours = Math.max(
    0,
    Math.round((monthlyHours.targetHours - monthlyHours.actualHours) * 100) /
      100,
  );

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

  function handleExportXlsx() {
    downloadMonthlyReportXlsx({
      monthLabel,
      profile,
      shifts: shiftsInSelectedMonth,
      monthlyHours,
      monthlyPremiums,
      complianceIssues,
    });
  }

  return (
    <>
      <section className="dashboard-page dashboard-desktop-legacy">
        <DashboardHero
          monthLabel={monthLabel}
          profileLabel={`${profile.federalState} Â· ${profile.weeklyHours} h/Woche Â· ${profile.payGroup} Stufe ${profile.payLevel} Â· Zuschlagsbasis ${premiumHourlyRate} â‚¬/h`}
        />

        <WorkSummary
          actualHours={monthlyHours.actualHours}
          targetHours={monthlyHours.targetHours}
          balanceHours={monthlyHours.balanceHours}
          remainingHours={remainingHours}
          overtimeHours={monthlyHours.overtimeHours}
          progress={progress}
          workingDayCount={monthlyHours.workingDayCount}
          publicHolidayCount={monthlyHours.publicHolidayCount}
          holidayReductionHours={monthlyHours.holidayReductionHours}
          averageDailyHours={monthlyHours.averageDailyHours}
        />

        <StatusCard
          criticalCount={criticalCount}
          warningCount={warningCount}
          issueCount={complianceIssues.length}
          checkedShiftCount={complianceRelevantShifts.length}
        />

        <MonthlyPremiumSummary
          monthlyPremiums={monthlyPremiums}
          hasHourlyRate={premiumHourlyRate > 0}
        />

        <ExportCard
          onExportCsv={handleExportCsv}
          onExportXlsx={handleExportXlsx}
          onOpenReport={() => navigate("/bericht")}
        />

        <ShiftSummary
          shiftCount={monthlyHours.shiftCount}
          shiftTypeCounts={monthlyHours.shiftTypeCounts}
        />
      </section>

      <section className="dashboard-page premium-month-cockpit dashboard-mobile-cockpit">
        <DashboardHero
          monthLabel={monthLabel}
          profileLabel={`${profile.federalState} Â· ${profile.weeklyHours} h/Woche Â· ${profile.payGroup} Stufe ${profile.payLevel} Â· Zuschlagsbasis ${premiumHourlyRate} â‚¬/h`}
        />

        <section className="cockpit-overview-card" aria-label="MonatsÃ¼bersicht">
          <div className="cockpit-overview-header">
            <div>
              <span className="cockpit-eyebrow">Monatsstatus</span>
              <h2>{monthLabel}</h2>
            </div>

            <span
              className={getCockpitStatusClassName(criticalCount, warningCount)}
            >
              {getCockpitStatusLabel(criticalCount, warningCount)}
            </span>
          </div>

          <div className="cockpit-main-values">
            <div>
              <span>Iststunden</span>
              <strong>{formatHours(monthlyHours.actualHours)}</strong>
            </div>

            <div>
              <span>Sollstunden</span>
              <strong>{formatHours(monthlyHours.targetHours)}</strong>
            </div>

            <div>
              <span>Saldo</span>
              <strong>{getBalanceText(monthlyHours.balanceHours)}</strong>
            </div>
          </div>

          <div className="cockpit-progress-area">
            <div className="cockpit-progress-label">
              <span>Monatsfortschritt</span>
              <strong>{formatPercent(progress)}</strong>
            </div>

            <div className="cockpit-progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="cockpit-mini-grid">
            <article>
              <span>Reststunden</span>
              <strong>{formatHours(remainingHours)}</strong>
            </article>

            <article>
              <span>Ãœberstunden</span>
              <strong>{formatHours(monthlyHours.overtimeHours)}</strong>
            </article>

            <article>
              <span>Dienste</span>
              <strong>{monthlyHours.shiftCount}</strong>
            </article>

<article>
  <span>Geprüft</span>
  <strong>{complianceRelevantShifts.length}</strong>
</article>
          </div>
        </section>

        <section className="cockpit-content-grid">
          <div className="cockpit-content-main">
            <WorkSummary
              actualHours={monthlyHours.actualHours}
              targetHours={monthlyHours.targetHours}
              balanceHours={monthlyHours.balanceHours}
              remainingHours={remainingHours}
              overtimeHours={monthlyHours.overtimeHours}
              progress={progress}
              workingDayCount={monthlyHours.workingDayCount}
              publicHolidayCount={monthlyHours.publicHolidayCount}
              holidayReductionHours={monthlyHours.holidayReductionHours}
              averageDailyHours={monthlyHours.averageDailyHours}
            />

            <StatusCard
              criticalCount={criticalCount}
              warningCount={warningCount}
              issueCount={complianceIssues.length}
              checkedShiftCount={complianceRelevantShifts.length}
            />
          </div>

          <div className="cockpit-content-side">
            <MonthlyPremiumSummary
              monthlyPremiums={monthlyPremiums}
              hasHourlyRate={premiumHourlyRate > 0}
            />
          </div>
        </section>

        <div className="cockpit-wide-card">
          <ShiftSummary
            shiftCount={monthlyHours.shiftCount}
            shiftTypeCounts={monthlyHours.shiftTypeCounts}
          />
        </div>

        <ExportCard
          onExportCsv={handleExportCsv}
          onExportXlsx={handleExportXlsx}
          onOpenReport={() => navigate("/bericht")}
        />
      </section>
    </>
  );
}
