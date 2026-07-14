import { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { useAppContext } from "../context/useAppContext";
import {
  calculateCurrentUserFairnessInput,
  calculateFairnessAnalysis,
  type FairnessDeviationStatus,
  type FairnessMemberInput,
  type FairnessMetricResult,
  type WeekendFairnessStatus,
} from "../services/fairness/fairnessAnalysisService";
import {
  loadFairnessTeamMembers,
  saveFairnessTeamMembers,
  type FairnessTeamMemberDraft,
} from "../services/storage/fairnessTeamStorage";

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

const statusLabels: Record<
  FairnessDeviationStatus,
  string
> = {
  balanced: "Ausgeglichen",
  "above-share": "Über Anteil",
  "below-share": "Unter Anteil",
  "no-team-data": "Teamdaten fehlen",
};

const weekendStatusLabels: Record<
  WeekendFairnessStatus,
  string
> = {
  ok: "Unauffällig",
  review: "Prüfen",
  critical: "Kritisch",
};

const numberFields = [
  "weeklyHours",
  "workHours",
  "workShiftCount",
  "nightShiftCount",
  "weekendShiftCount",
  "workedWeekendCount",
  "holidayWorkShiftCount",
  "maxConsecutiveWorkedWeekends",
] satisfies Array<
  keyof FairnessTeamMemberDraft
>;

function formatNumber(
  value: number,
  maximumFractionDigits = 1,
): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function formatHours(value: number): string {
  return `${formatNumber(value, 2)} h`;
}

function formatPercent(value: number): string {
  return `${formatNumber(value * 100, 1)} %`;
}

function getStatusClassName(
  status: FairnessDeviationStatus,
): string {
  return `fairness-status fairness-status-${status}`;
}

function getWeekendStatusClassName(
  status: WeekendFairnessStatus,
): string {
  return `fairness-status fairness-weekend-${status}`;
}

function createEmptyMember(): FairnessTeamMemberDraft {
  return {
    id: crypto.randomUUID(),
    name: "Teammitglied",
    weeklyHours: 38.5,
    workHours: 0,
    workShiftCount: 0,
    nightShiftCount: 0,
    weekendShiftCount: 0,
    workedWeekendCount: 0,
    holidayWorkShiftCount: 0,
    maxConsecutiveWorkedWeekends: 0,
  };
}

function toManualInput(
  member: FairnessTeamMemberDraft,
): FairnessMemberInput {
  return {
    ...member,
    source: "manual",
  };
}

function getVisibleName(
  name: string,
  index: number,
  anonymized: boolean,
): string {
  return anonymized
    ? `Person ${index + 1}`
    : name;
}

function getMetricSummary(
  metrics: FairnessMetricResult[],
): FairnessMetricResult[] {
  return metrics.filter((metric) =>
    [
      "nightShiftCount",
      "weekendShiftCount",
      "holidayWorkShiftCount",
    ].includes(metric.key),
  );
}

export default function Fairness() {
  const {
    profile,
    shifts,
    selectedYear,
    selectedMonth,
    previousMonth,
    nextMonth,
  } = useAppContext();

  const [teamMembers, setTeamMembers] =
    useState<FairnessTeamMemberDraft[]>(
      () => loadFairnessTeamMembers(),
    );

  const [anonymized, setAnonymized] =
    useState(false);

  useEffect(() => {
    saveFairnessTeamMembers(teamMembers);
  }, [teamMembers]);

  const currentUser = useMemo(
    () =>
      calculateCurrentUserFairnessInput(
        shifts,
        profile,
        selectedYear,
        selectedMonth,
      ),
    [
      shifts,
      profile,
      selectedYear,
      selectedMonth,
    ],
  );

  const analysis = useMemo(
    () =>
      calculateFairnessAnalysis(
        [
          currentUser,
          ...teamMembers.map(toManualInput),
        ],
        {
          year: selectedYear,
          monthIndex: selectedMonth,
        },
      ),
    [
      currentUser,
      teamMembers,
      selectedYear,
      selectedMonth,
    ],
  );

  const selectedMonthLabel = `${monthNames[selectedMonth]} ${selectedYear}`;

  function addTeamMember() {
    setTeamMembers((current) => [
      ...current,
      createEmptyMember(),
    ]);
  }

  function removeTeamMember(id: string) {
    setTeamMembers((current) =>
      current.filter((member) => member.id !== id),
    );
  }

  function updateTeamMember(
    id: string,
    field: keyof FairnessTeamMemberDraft,
    value: string,
  ) {
    setTeamMembers((current) =>
      current.map((member) => {
        if (member.id !== id) {
          return member;
        }

        if (
          numberFields.includes(
            field as (typeof numberFields)[number],
          )
        ) {
          const parsedValue = Number(value);
          const nextValue = Number.isFinite(
            parsedValue,
          )
            ? Math.max(0, parsedValue)
            : 0;

          return {
            ...member,
            [field]:
              field === "weeklyHours"
                ? Math.max(0.1, nextValue)
                : nextValue,
          };
        }

        return {
          ...member,
          [field]: value,
        };
      }),
    );
  }

  const currentMember =
    analysis.members.find(
      (member) =>
        member.input.source === "current-user",
    ) ?? analysis.members[0];

  return (
    <section className="page fairness-page">
      <div className="fairness-header-row">
        <PageHeader
          eyebrow="Fairness"
          title={`Dienstverteilung ${selectedMonthLabel}`}
          description="Vergleich von Nacht-, Wochenend- und Feiertagsdiensten nach individuellem Beschäftigungsumfang."
        />

        <div className="fairness-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={previousMonth}
          >
            Vormonat
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={nextMonth}
          >
            Folgemonat
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setAnonymized(
                (current) => !current,
              )
            }
          >
            {anonymized
              ? "Namen zeigen"
              : "Anonymisieren"}
          </Button>
        </div>
      </div>

      <section
        className="fairness-kpi-grid"
        aria-label="Fairness-Kennzahlen"
      >
        <StatCard
          label="Teamgröße"
          value={analysis.teamSize}
          helper={
            analysis.hasTeamComparison
              ? "Vergleich aktiv"
              : "Teamdaten ergänzen"
          }
          highlight
        />
        <StatCard
          label="Nacht"
          value={analysis.totals.nightShiftCount}
          helper={`${formatNumber(
            analysis.totals.burdenScore,
            1,
          )} Belastungspunkte gesamt`}
        />
        <StatCard
          label="Wochenenden"
          value={analysis.totals.workedWeekendCount}
          helper={`${analysis.monthWeekendCount} Wochenenden im Monat`}
        />
        <StatCard
          label="Mein Anteil"
          value={
            currentMember
              ? formatPercent(
                  currentMember.employmentShare,
                )
              : "0 %"
          }
          helper={`${formatHours(
            currentUser.workHours,
          )} Arbeitszeit`}
        />
      </section>

      <div className="fairness-content-grid">
        <Card className="fairness-card">
          <div className="fairness-card-header">
            <span className="card-label">Abweichungen</span>
            <strong>Erkennbare Belastung</strong>
            <p>
              Erwartete Werte werden proportional zu den
              Wochenstunden des Teams berechnet.
            </p>
          </div>

          <div className="fairness-alert-list">
            {analysis.alerts.length === 0 ? (
              <p>
                Keine deutlichen Abweichungen im
                aktuellen Teamvergleich.
              </p>
            ) : (
              analysis.alerts.map((alert) => (
                <p key={alert}>{alert}</p>
              ))
            )}
          </div>
        </Card>

        <Card className="fairness-card">
          <div className="fairness-card-header">
            <span className="card-label">Regelprüfung</span>
            <strong>Jedes zweite Wochenende frei</strong>
            <p>
              CareCheck markiert gearbeitete Wochenenden
              über dem Monatsrichtwert und Wochenenden in
              Folge.
            </p>
          </div>

          <div className="fairness-weekend-list">
            {analysis.members.map((member, index) => (
              <div key={member.input.id}>
                <span>
                  {getVisibleName(
                    member.input.name,
                    index,
                    anonymized,
                  )}
                </span>
                <strong>
                  {
                    member.weekendRule
                      .workedWeekendCount
                  }{" "}
                  /{" "}
                  {
                    member.weekendRule
                      .maxAllowedWorkedWeekends
                  }{" "}
                  Wochenenden
                </strong>
                <small
                  className={getWeekendStatusClassName(
                    member.weekendRule.status,
                  )}
                >
                  {
                    weekendStatusLabels[
                      member.weekendRule.status
                    ]
                  }
                </small>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="fairness-card fairness-wide-card">
        <div className="fairness-card-header">
          <span className="card-label">Teamvergleich</span>
          <strong>Verteilung nach Beschäftigungsumfang</strong>
          <p>
            Die eigene Zeile kommt aus dem Dienstplan.
            Weitere Teamwerte kannst du manuell ergänzen.
          </p>
        </div>

        <div className="fairness-table-wrap">
          <table className="fairness-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Umfang</th>
                <th>Status</th>
                <th>Belastung</th>
                <th>Nacht</th>
                <th>WE</th>
                <th>Feiertag</th>
              </tr>
            </thead>

            <tbody>
              {analysis.members.map(
                (member, index) => (
                  <tr key={member.input.id}>
                    <th scope="row">
                      {getVisibleName(
                        member.input.name,
                        index,
                        anonymized,
                      )}
                    </th>
                    <td>
                      {formatPercent(
                        member.employmentShare,
                      )}
                    </td>
                    <td>
                      <span
                        className={getStatusClassName(
                          member.status,
                        )}
                      >
                        {statusLabels[member.status]}
                      </span>
                    </td>
                    <td>
                      {formatNumber(
                        member.burdenScore,
                        1,
                      )}
                      <small>
                        Soll{" "}
                        {formatNumber(
                          member.expectedBurdenScore,
                          1,
                        )}
                      </small>
                    </td>
                    {getMetricSummary(
                      member.metrics,
                    ).map((metric) => (
                      <td key={metric.key}>
                        {formatNumber(
                          metric.actual,
                          1,
                        )}
                        <small>
                          Soll{" "}
                          {formatNumber(
                            metric.expected,
                            1,
                          )}
                        </small>
                      </td>
                    ))}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="fairness-card fairness-wide-card">
        <div className="fairness-team-header">
          <div className="fairness-card-header">
            <span className="card-label">Teamdaten</span>
            <strong>Vergleichswerte pflegen</strong>
            <p>
              Diese Werte werden nur lokal gespeichert.
              Die eigene Zeile bleibt automatisch aus dem
              Dienstplan berechnet.
            </p>
          </div>

          <Button
            type="button"
            onClick={addTeamMember}
          >
            Person hinzufügen
          </Button>
        </div>

        {teamMembers.length === 0 ? (
          <p className="fairness-empty-note">
            Noch keine Vergleichsperson erfasst.
          </p>
        ) : (
          <div className="fairness-member-editor-list">
            {teamMembers.map((member) => (
              <section
                className="fairness-member-editor"
                key={member.id}
              >
                <div className="fairness-member-editor-header">
                  <label className="field">
                    <span>Name</span>
                    <input
                      value={member.name}
                      onChange={(event) =>
                        updateTeamMember(
                          member.id,
                          "name",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <Button
                    type="button"
                    variant="danger"
                    onClick={() =>
                      removeTeamMember(member.id)
                    }
                  >
                    Entfernen
                  </Button>
                </div>

                <div className="fairness-editor-grid">
                  <label className="field">
                    <span>Wochenstunden</span>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={member.weeklyHours}
                      onChange={(event) =>
                        updateTeamMember(
                          member.id,
                          "weeklyHours",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Arbeitsstunden</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={member.workHours}
                      onChange={(event) =>
                        updateTeamMember(
                          member.id,
                          "workHours",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Arbeitsdienste</span>
                    <input
                      type="number"
                      min="0"
                      value={member.workShiftCount}
                      onChange={(event) =>
                        updateTeamMember(
                          member.id,
                          "workShiftCount",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Nachtdienste</span>
                    <input
                      type="number"
                      min="0"
                      value={member.nightShiftCount}
                      onChange={(event) =>
                        updateTeamMember(
                          member.id,
                          "nightShiftCount",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Wochenenddienste</span>
                    <input
                      type="number"
                      min="0"
                      value={member.weekendShiftCount}
                      onChange={(event) =>
                        updateTeamMember(
                          member.id,
                          "weekendShiftCount",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Wochenenden</span>
                    <input
                      type="number"
                      min="0"
                      value={member.workedWeekendCount}
                      onChange={(event) =>
                        updateTeamMember(
                          member.id,
                          "workedWeekendCount",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Feiertagsdienste</span>
                    <input
                      type="number"
                      min="0"
                      value={member.holidayWorkShiftCount}
                      onChange={(event) =>
                        updateTeamMember(
                          member.id,
                          "holidayWorkShiftCount",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label className="field">
                    <span>WE in Folge</span>
                    <input
                      type="number"
                      min="0"
                      value={
                        member.maxConsecutiveWorkedWeekends
                      }
                      onChange={(event) =>
                        updateTeamMember(
                          member.id,
                          "maxConsecutiveWorkedWeekends",
                          event.target.value,
                        )
                      }
                    />
                  </label>
                </div>
              </section>
            ))}
          </div>
        )}
      </Card>

      <Card className="fairness-card fairness-wide-card">
        <div className="fairness-card-header">
          <span className="card-label">Transparenz</span>
          <strong>Berechnungsgrenzen</strong>
        </div>

        <ul className="fairness-note-list">
          <li>
            Die eigene Zeile nutzt Arbeitsdienste aus dem
            ausgewählten Monat; Urlaub, Krank und Frei
            zählen nicht als belastende Arbeitsdienste.
          </li>
          <li>
            Teamvergleichswerte werden proportional zur
            Wochenarbeitszeit bewertet.
          </li>
          <li>
            Die Fairness-Auswertung ist eine
            Planungshilfe und ändert keine ArbZG- oder
            TVöD-P-Prüfung.
          </li>
          <li>
            Für echte Teamfairness müssen alle Personen
            mit demselben Monatsfenster und vergleichbaren
            Daten erfasst werden.
          </li>
        </ul>
      </Card>
    </section>
  );
}
