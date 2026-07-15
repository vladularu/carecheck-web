export const CARECHECK_LOCAL_STORAGE_KEYS = [
  "carecheck.profile",
  "carecheck.shifts",
  "carecheck.shiftTemplates",
  "carecheck.planningTemplates.v1",
  "carecheck.fairnessTeam.v1",
  "carecheck.syncMetadata.v1",
  "carecheck.localChangeQueue.v1",
  "carecheck.preMigrationBackups.v1",
] as const;

export function clearCareCheckLocalData(): void {
  for (const key of CARECHECK_LOCAL_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}
