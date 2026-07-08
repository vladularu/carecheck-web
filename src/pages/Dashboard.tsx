import DashboardHero from "../components/dashboard/DashboardHero";
import ExportCard from "../components/dashboard/ExportCard";
import MonthlyPremiumSummary from "../components/dashboard/MonthlyPremiumSummary";
import ShiftSummary from "../components/dashboard/ShiftSummary";
import StatusCard from "../components/dashboard/StatusCard";
import WorkSummary from "../components/dashboard/WorkSummary";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { downloadMonthlyReportXlsx } from "../services/export/monthlyReportXlsxService";
import {
  calculateMonthlyHours,
  filterShiftsByMonth,
} from "../services/calculation/monthlyHoursCalculator";
import { calculateMonthlyPremiums } from "../services/calculation/monthlyPremiumCalculator";
import { checkCompliance } from "../services/compliance/complianceService";
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

  const complianceIssues = checkCompliance(shiftsInSelectedMonth);

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
    <section className="dashboard-page">
      <DashboardHero
        monthLabel={monthLabel}
        profileLabel={`${profile.federalState} · ${profile.weeklyHours} h/Woche · ${profile.payGroup} Stufe ${profile.payLevel} · Zuschlagsbasis ${premiumHourlyRate} €/h`}
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
        checkedShiftCount={shiftsInSelectedMonth.length}
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
  );
}