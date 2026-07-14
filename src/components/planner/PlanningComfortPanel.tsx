import { useEffect, useMemo, useState } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import {
  applyPlanningTemplate,
  copyDayShifts,
  createPlanningTemplate,
  createRecurringPatternShifts,
  detectPlanningConflicts,
  parseScheduleImport,
  type PlanningConflict,
  type PlanningTemplate,
} from "../../services/planning/planningComfortService";
import {
  loadPlanningTemplates,
  savePlanningTemplates,
} from "../../services/storage/planningTemplateStorage";
import {
  markSyncEntityChanged,
  markSyncEntityDeleted,
} from "../../services/storage/syncMetadataStorage";
import type {
  Shift,
  ShiftTemplates,
  ShiftType,
} from "../../types/index";

interface PlanningComfortPanelProps {
  shifts: Shift[];
  shiftsInSelectedMonth: Shift[];
  selectedYear: number;
  selectedMonth: number;
  shiftTemplates: ShiftTemplates;
  onAddShift: (shift: Shift) => void;
  onDeleteShift: (id: string) => void;
}

const shiftTypeLabels: Record<ShiftType, string> = {
  EARLY: "Früh",
  LATE: "Spät",
  NIGHT: "Nacht",
  DAY: "Tag",
  TRAINING: "Fortbildung",
  VACATION: "Urlaub",
  SICK: "Krank",
  FREE: "Frei",
  CUSTOM: "Individuell",
};

const allowedPatternTypes = new Set<ShiftType>([
  "EARLY",
  "LATE",
  "NIGHT",
  "DAY",
  "TRAINING",
  "VACATION",
  "SICK",
  "FREE",
  "CUSTOM",
]);

function createDateKey(
  year: number,
  monthIndex: number,
  day: number,
): string {
  return [
    year,
    String(monthIndex + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function createIdFactory(prefix: string): () => string {
  let index = 0;

  return () => {
    index++;

    return `${prefix}-${index}`;
  };
}

function parsePattern(value: string): ShiftType[] {
  return value
    .split(/[\s,;|]+/)
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean)
    .filter((part): part is ShiftType =>
      allowedPatternTypes.has(part as ShiftType),
    );
}

function countCriticalConflicts(
  conflicts: PlanningConflict[],
): number {
  return conflicts.filter(
    (conflict) => conflict.severity === "critical",
  ).length;
}

function formatShiftPreview(shift: Shift): string {
  return `${shift.date} · ${shiftTypeLabels[shift.type]} ${shift.startTime}-${shift.endTime}`;
}

function ConflictPreview({
  conflicts,
}: {
  conflicts: PlanningConflict[];
}) {
  if (conflicts.length === 0) {
    return (
      <p className="planning-conflict-empty">
        Keine Konflikte in der Vorschau.
      </p>
    );
  }

  return (
    <div className="planning-conflict-list">
      {conflicts.slice(0, 4).map((conflict, index) => (
        <p
          className={`planning-conflict planning-conflict-${conflict.severity}`}
          key={`${conflict.date}-${conflict.title}-${index}`}
        >
          <strong>{conflict.title}</strong>
          <span>
            {conflict.date}: {conflict.description}
          </span>
        </p>
      ))}

      {conflicts.length > 4 && (
        <p className="planning-conflict-more">
          + {conflicts.length - 4} weitere Hinweise
        </p>
      )}
    </div>
  );
}

function ShiftPreview({
  shifts,
}: {
  shifts: Shift[];
}) {
  if (shifts.length === 0) {
    return (
      <p className="planning-preview-empty">
        Noch keine Vorschau.
      </p>
    );
  }

  return (
    <ul className="planning-preview-list">
      {shifts.slice(0, 5).map((shift) => (
        <li key={shift.id}>
          {formatShiftPreview(shift)}
        </li>
      ))}

      {shifts.length > 5 && (
        <li>+ {shifts.length - 5} weitere Einträge</li>
      )}
    </ul>
  );
}

export default function PlanningComfortPanel({
  shifts,
  shiftsInSelectedMonth,
  selectedYear,
  selectedMonth,
  shiftTemplates,
  onAddShift,
  onDeleteShift,
}: PlanningComfortPanelProps) {
  const selectedMonthKey =
    `${selectedYear}-${selectedMonth}`;
  const selectedMonthStartDate = createDateKey(
    selectedYear,
    selectedMonth,
    1,
  );

  const [templates, setTemplates] =
    useState<PlanningTemplate[]>(() =>
      loadPlanningTemplates(),
    );
  const [
    sequenceStartDateState,
    setSequenceStartDateState,
  ] =
    useState(() =>
      ({
        monthKey: selectedMonthKey,
        value: selectedMonthStartDate,
      }),
    );
  const [sequenceDays, setSequenceDays] =
    useState(7);
  const [sequencePattern, setSequencePattern] =
    useState("EARLY,LATE,NIGHT,FREE");
  const [sequenceNote, setSequenceNote] =
    useState("");
  const [copySourceDate, setCopySourceDate] =
    useState("");
  const [
    copyTargetDateState,
    setCopyTargetDateState,
  ] =
    useState(() =>
      ({
        monthKey: selectedMonthKey,
        value: selectedMonthStartDate,
      }),
    );
  const [copyMode, setCopyMode] =
    useState<"copy" | "move">("copy");
  const [templateName, setTemplateName] =
    useState("");
  const [selectedTemplateId, setSelectedTemplateId] =
    useState("");
  const [importText, setImportText] =
    useState("");

  useEffect(() => {
    savePlanningTemplates(templates);
  }, [templates]);

  const sequenceStartDate =
    sequenceStartDateState.monthKey === selectedMonthKey
      ? sequenceStartDateState.value
      : selectedMonthStartDate;
  const copyTargetDate =
    copyTargetDateState.monthKey === selectedMonthKey
      ? copyTargetDateState.value
      : selectedMonthStartDate;

  const parsedPattern = useMemo(
    () => parsePattern(sequencePattern),
    [sequencePattern],
  );

  const sequencePreview = useMemo(
    () =>
      createRecurringPatternShifts({
        startDate: sequenceStartDate,
        days: sequenceDays,
        pattern: parsedPattern,
        shiftTemplates,
        note: sequenceNote.trim() || undefined,
        idFactory: createIdFactory("sequence-preview"),
      }),
    [
      sequenceStartDate,
      sequenceDays,
      parsedPattern,
      shiftTemplates,
      sequenceNote,
    ],
  );

  const sequenceConflicts = useMemo(
    () =>
      detectPlanningConflicts(
        shifts,
        sequencePreview,
      ),
    [shifts, sequencePreview],
  );

  const copyPreview = useMemo(
    () =>
      copyDayShifts({
        shifts,
        sourceDate: copySourceDate,
        targetDate: copyTargetDate,
        mode: copyMode,
        idFactory: createIdFactory("copy-preview"),
      }),
    [
      shifts,
      copySourceDate,
      copyTargetDate,
      copyMode,
    ],
  );

  const copyConflicts = useMemo(
    () =>
      detectPlanningConflicts(
        shifts.filter(
          (shift) =>
            !copyPreview.shiftIdsToRemove.includes(
              shift.id,
            ),
        ),
        copyPreview.shiftsToAdd,
      ),
    [shifts, copyPreview],
  );

  const selectedTemplate =
    templates.find(
      (template) =>
        template.id === selectedTemplateId,
    ) ?? null;

  const templatePreview = useMemo(
    () =>
      selectedTemplate
        ? applyPlanningTemplate({
            template: selectedTemplate,
            targetYear: selectedYear,
            targetMonth: selectedMonth,
            idFactory: createIdFactory(
              "template-preview",
            ),
          })
        : [],
    [
      selectedTemplate,
      selectedYear,
      selectedMonth,
    ],
  );

  const templateConflicts = useMemo(
    () =>
      detectPlanningConflicts(
        shifts,
        templatePreview,
      ),
    [shifts, templatePreview],
  );

  const importResult = useMemo(
    () =>
      parseScheduleImport(
        importText,
        createIdFactory("import-preview"),
      ),
    [importText],
  );

  const importConflicts = useMemo(
    () =>
      detectPlanningConflicts(
        shifts,
        importResult.shifts,
      ),
    [shifts, importResult.shifts],
  );

  function addGeneratedShifts(
    generatedShifts: Shift[],
  ) {
    for (const shift of generatedShifts) {
      onAddShift({
        ...shift,
        id: crypto.randomUUID(),
      });
    }
  }

  function applySequence() {
    if (
      countCriticalConflicts(
        sequenceConflicts,
      ) > 0
    ) {
      return;
    }

    addGeneratedShifts(sequencePreview);
  }

  function applyCopyOrMove() {
    if (
      countCriticalConflicts(copyConflicts) > 0
    ) {
      return;
    }

    for (const id of copyPreview.shiftIdsToRemove) {
      onDeleteShift(id);
    }

    addGeneratedShifts(copyPreview.shiftsToAdd);
  }

  function saveCurrentMonthTemplate() {
    const template = createPlanningTemplate({
      id: crypto.randomUUID(),
      name: templateName,
      sourceYear: selectedYear,
      sourceMonth: selectedMonth,
      shifts: shiftsInSelectedMonth,
      createdAt: new Date().toISOString(),
    });

    setTemplates((current) => [
      template,
      ...current,
    ]);
    markSyncEntityChanged(
      "planningTemplates",
      template.id,
    );
    setSelectedTemplateId(template.id);
    setTemplateName("");
  }

  function applySelectedTemplate() {
    if (
      !selectedTemplate ||
      countCriticalConflicts(
        templateConflicts,
      ) > 0
    ) {
      return;
    }

    addGeneratedShifts(templatePreview);
  }

  function removeSelectedTemplate() {
    if (!selectedTemplateId) {
      return;
    }

    markSyncEntityDeleted(
      "planningTemplates",
      selectedTemplateId,
    );

    setTemplates((current) =>
      current.filter(
        (template) =>
          template.id !== selectedTemplateId,
      ),
    );
    setSelectedTemplateId("");
  }

  function applyImport() {
    if (
      importResult.errors.length > 0 ||
      countCriticalConflicts(importConflicts) > 0
    ) {
      return;
    }

    addGeneratedShifts(importResult.shifts);
    setImportText("");
  }

  const sourceDateOptions = Array.from(
    new Set(
      shiftsInSelectedMonth.map(
        (shift) => shift.date,
      ),
    ),
  ).sort();

  return (
    <Card className="planning-comfort-card">
      <div className="planner-section-header">
        <span className="card-label">Komfortplanung</span>
        <strong>Dienstfolgen, Vorlagen und Import</strong>
        <p>
          Mehrere Einträge vorbereiten, Konflikte prüfen und
          dann gesammelt übernehmen.
        </p>
      </div>

      <div className="planning-comfort-grid">
        <section className="planning-tool-panel">
          <div className="planning-tool-header">
            <span>Wiederkehrende Folge</span>
            <strong>Pattern erzeugen</strong>
          </div>

          <div className="planning-tool-fields">
            <label className="field">
              <span>Start</span>
              <input
                type="date"
                value={sequenceStartDate}
                onChange={(event) =>
                  setSequenceStartDateState({
                    monthKey: selectedMonthKey,
                    value: event.target.value,
                  })
                }
              />
            </label>

            <label className="field">
              <span>Tage</span>
              <input
                type="number"
                min="1"
                max="62"
                value={sequenceDays}
                onChange={(event) =>
                  setSequenceDays(
                    Number(event.target.value),
                  )
                }
              />
            </label>

            <label className="field planning-field-wide">
              <span>Folge</span>
              <input
                value={sequencePattern}
                onChange={(event) =>
                  setSequencePattern(
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="field planning-field-wide">
              <span>Notiz</span>
              <input
                value={sequenceNote}
                onChange={(event) =>
                  setSequenceNote(event.target.value)
                }
                placeholder="Optional"
              />
            </label>
          </div>

          <ShiftPreview shifts={sequencePreview} />
          <ConflictPreview conflicts={sequenceConflicts} />

          <Button
            type="button"
            onClick={applySequence}
            disabled={
              sequencePreview.length === 0 ||
              countCriticalConflicts(
                sequenceConflicts,
              ) > 0
            }
          >
            Folge übernehmen
          </Button>
        </section>

        <section className="planning-tool-panel">
          <div className="planning-tool-header">
            <span>Kopieren und Verschieben</span>
            <strong>Tag übertragen</strong>
          </div>

          <div className="planning-tool-fields">
            <label className="field">
              <span>Quelle</span>
              <select
                value={copySourceDate}
                onChange={(event) =>
                  setCopySourceDate(
                    event.target.value,
                  )
                }
              >
                <option value="">Datum wählen</option>
                {sourceDateOptions.map((date) => (
                  <option value={date} key={date}>
                    {date}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Ziel</span>
              <input
                type="date"
                value={copyTargetDate}
                onChange={(event) =>
                  setCopyTargetDateState({
                    monthKey: selectedMonthKey,
                    value: event.target.value,
                  })
                }
              />
            </label>
          </div>

          <div className="planning-segmented-control">
            <button
              type="button"
              className={
                copyMode === "copy" ? "active" : ""
              }
              onClick={() => setCopyMode("copy")}
            >
              Kopieren
            </button>
            <button
              type="button"
              className={
                copyMode === "move" ? "active" : ""
              }
              onClick={() => setCopyMode("move")}
            >
              Verschieben
            </button>
          </div>

          <ShiftPreview
            shifts={copyPreview.shiftsToAdd}
          />
          <ConflictPreview conflicts={copyConflicts} />

          <Button
            type="button"
            onClick={applyCopyOrMove}
            disabled={
              copyPreview.shiftsToAdd.length === 0 ||
              countCriticalConflicts(copyConflicts) > 0
            }
          >
            Tag anwenden
          </Button>
        </section>

        <section className="planning-tool-panel">
          <div className="planning-tool-header">
            <span>Monatsvorlagen</span>
            <strong>Speichern und anwenden</strong>
          </div>

          <div className="planning-tool-fields">
            <label className="field planning-field-wide">
              <span>Vorlagenname</span>
              <input
                value={templateName}
                onChange={(event) =>
                  setTemplateName(event.target.value)
                }
                placeholder="z. B. kurzer Wechsel"
              />
            </label>

            <label className="field planning-field-wide">
              <span>Vorlage</span>
              <select
                value={selectedTemplateId}
                onChange={(event) =>
                  setSelectedTemplateId(
                    event.target.value,
                  )
                }
              >
                <option value="">Vorlage wählen</option>
                {templates.map((template) => (
                  <option
                    value={template.id}
                    key={template.id}
                  >
                    {template.name} ·{" "}
                    {template.entries.length} Einträge
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="planning-action-row">
            <Button
              type="button"
              variant="secondary"
              onClick={saveCurrentMonthTemplate}
              disabled={
                shiftsInSelectedMonth.length === 0
              }
            >
              Monat speichern
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={removeSelectedTemplate}
              disabled={!selectedTemplateId}
            >
              Vorlage löschen
            </Button>
          </div>

          <ShiftPreview shifts={templatePreview} />
          <ConflictPreview conflicts={templateConflicts} />

          <Button
            type="button"
            onClick={applySelectedTemplate}
            disabled={
              !selectedTemplate ||
              templatePreview.length === 0 ||
              countCriticalConflicts(
                templateConflicts,
              ) > 0
            }
          >
            Vorlage anwenden
          </Button>
        </section>

        <section className="planning-tool-panel">
          <div className="planning-tool-header">
            <span>Import</span>
            <strong>Vorhandene Pläne übernehmen</strong>
          </div>

          <label className="field planning-field-wide">
            <span>CSV-Zeilen</span>
            <textarea
              value={importText}
              onChange={(event) =>
                setImportText(event.target.value)
              }
              placeholder="2026-07-01;EARLY;06:00;14:00;30;Station A"
              rows={6}
            />
          </label>

          {importResult.errors.length > 0 && (
            <div className="planning-import-errors">
              {importResult.errors.slice(0, 4).map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}

          <ShiftPreview shifts={importResult.shifts} />
          <ConflictPreview conflicts={importConflicts} />

          <Button
            type="button"
            onClick={applyImport}
            disabled={
              importResult.shifts.length === 0 ||
              importResult.errors.length > 0 ||
              countCriticalConflicts(importConflicts) > 0
            }
          >
            Import übernehmen
          </Button>
        </section>
      </div>
    </Card>
  );
}
