import DashboardHero from "../components/dashboard/DashboardHero";
import ShiftSummary from "../components/dashboard/ShiftSummary";
import StatusCard from "../components/dashboard/StatusCard";
import WorkSummary from "../components/dashboard/WorkSummary";
import { useAppContext } from "../context/AppContext";
import { calculateMonthlyHours } from "../services/calculation/monthlyHoursCalculator";

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
  const { profile, shifts, selectedYear, selectedMonth } = useAppContext();

  const monthlyHours = calculateMonthlyHours(
    shifts,
    profile,
    selectedYear,
    selectedMonth,
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

  return (
    <section className="dashboard-page">
      <DashboardHero
        monthLabel={`${monthNames[selectedMonth]} ${selectedYear}`}
        profileLabel={`${profile.federalState} · ${profile.weeklyHours} h/Woche · ${profile.payGroup} Stufe ${profile.payLevel}`}
      />

      <WorkSummary
        actualHours={monthlyHours.actualHours}
        targetHours={monthlyHours.targetHours}
        balanceHours={monthlyHours.balanceHours}
        remainingHours={remainingHours}
        overtimeHours={monthlyHours.overtimeHours}
        progress={progress}
      />

      <StatusCard />

      <ShiftSummary
        shiftCount={monthlyHours.shiftCount}
        shiftTypeCounts={monthlyHours.shiftTypeCounts}
      />
    </section>
  );
}