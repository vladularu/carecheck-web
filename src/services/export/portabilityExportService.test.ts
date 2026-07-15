import {
  describe,
  expect,
  it,
} from "vitest";
import { defaultShiftTemplates } from "../../data/defaultShiftTemplates";
import type {
  Shift,
  UserProfile,
} from "../../types/index";
import type { PlanningTemplate } from "../planning/planningComfortService";
import type { FairnessTeamMemberDraft } from "../storage/fairnessTeamStorage";
import { createCareCheckPortabilityExport } from "./portabilityExportService";

const profile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

const shift: Shift = {
  id: "shift-1",
  date: "2026-07-15",
  startTime: "06:00",
  endTime: "14:00",
  breakMinutes: 30,
  type: "EARLY",
};

const planningTemplate: PlanningTemplate = {
  id: "template-1",
  name: "Sommermonat",
  sourceMonthLabel: "Juli 2026",
  createdAt: "2026-07-15T10:00:00.000Z",
  entries: [
    {
      day: 15,
      type: "EARLY",
      startTime: "06:00",
      endTime: "14:00",
      breakMinutes: 30,
    },
  ],
};

const fairnessMember: FairnessTeamMemberDraft = {
  id: "member-1",
  name: "Teammitglied",
  weeklyHours: 38.5,
  workHours: 154,
  workShiftCount: 20,
  nightShiftCount: 2,
  weekendShiftCount: 3,
  workedWeekendCount: 2,
  holidayWorkShiftCount: 1,
  maxConsecutiveWorkedWeekends: 1,
};

describe("portabilityExportService", () => {
  it("erstellt einen maschinenlesbaren Portabilitaets-Export", () => {
    const dataExport =
      createCareCheckPortabilityExport({
        profile,
        shifts: [shift],
        shiftTemplates:
          defaultShiftTemplates,
        planningTemplates: [
          planningTemplate,
        ],
        fairnessTeamMembers: [
          fairnessMember,
        ],
      });

    expect(dataExport).toMatchObject({
      app: "CareCheck TVoeD",
      exportType:
        "carecheck-data-portability",
      exportVersion: 1,
      format: "application/json",
      data: {
        profile,
        shifts: [shift],
        shiftTemplates:
          defaultShiftTemplates,
        planningTemplates: [
          planningTemplate,
        ],
        fairnessTeamMembers: [
          fairnessMember,
        ],
      },
    });

    expect(
      Date.parse(dataExport.exportedAt),
    ).not.toBeNaN();
  });

  it("weist Sync-Metadaten als bewusst ausgeschlossene technische Daten aus", () => {
    const dataExport =
      createCareCheckPortabilityExport({
        profile,
        shifts: [],
        shiftTemplates:
          defaultShiftTemplates,
        planningTemplates: [],
        fairnessTeamMembers: [],
      });

    expect(
      dataExport.metadata.includedLocalData.map(
        (entry) => entry.key,
      ),
    ).toEqual([
      "carecheck.profile",
      "carecheck.shifts",
      "carecheck.shiftTemplates",
      "carecheck.planningTemplates.v1",
      "carecheck.fairnessTeam.v1",
    ]);

    expect(
      dataExport.metadata.excludedLocalData,
    ).toContainEqual(
      expect.objectContaining({
        key: "carecheck.syncMetadata.v1",
        name: "Sync-Metadaten",
      }),
    );

    expect(
      "syncMetadata" in dataExport.data,
    ).toBe(false);
  });
});
