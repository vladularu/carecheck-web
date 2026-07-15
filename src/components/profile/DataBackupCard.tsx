import {
  useRef,
  useState,
} from "react";
import { useAppContext } from "../../context/useAppContext";
import {
  downloadCareCheckBackup,
  readBackupFile,
  restoreCareCheckBackup,
} from "../../services/backup/backupService";
import { downloadCareCheckPortabilityExport } from "../../services/export/portabilityExportService";
import { clearCareCheckLocalData } from "../../services/storage/appDataStorage";
import { loadFairnessTeamMembers } from "../../services/storage/fairnessTeamStorage";
import { loadPlanningTemplates } from "../../services/storage/planningTemplateStorage";
import Button from "../ui/Button";
import Card from "../ui/Card";

export default function DataBackupCard() {
  const {
    profile,
    shifts,
    shiftTemplates,
  } = useAppContext();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [message, setMessage] =
    useState<string>("");

  function handleExportBackup() {
    downloadCareCheckBackup({
      profile,
      shifts,
      shiftTemplates,
    });

    setMessage(
      "Backup wurde erstellt.",
    );
  }

  function handleExportPortabilityData() {
    downloadCareCheckPortabilityExport({
      profile,
      shifts,
      shiftTemplates,
      planningTemplates:
        loadPlanningTemplates(),
      fairnessTeamMembers:
        loadFairnessTeamMembers(),
    });

    setMessage(
      "Datenexport wurde erstellt.",
    );
  }

  function handleDeleteAllLocalData() {
    const shouldDelete =
      window.confirm(
        "Alle lokal gespeicherten CareCheck-Daten werden gelöscht: Profil, Dienste, Vorlagen, Planung, Fairness-Team und Sync-Metadaten. Jetzt wirklich lokal löschen?",
      );

    if (!shouldDelete) {
      setMessage(
        "Lokales Löschen abgebrochen.",
      );

      return;
    }

    const confirmation =
      window.prompt(
        "Zum endgültigen Löschen bitte LOESCHEN eingeben.",
      );

    if (confirmation !== "LOESCHEN") {
      setMessage(
        "Lokales Löschen wurde nicht bestätigt.",
      );

      return;
    }

    clearCareCheckLocalData();

    setMessage(
      "Alle lokalen CareCheck-Daten wurden gelöscht. Die App wird neu geladen.",
    );

    window.setTimeout(() => {
      window.location.reload();
    }, 600);
  }

  async function handleImportBackup(
    file: File | undefined,
  ) {
    if (!file) {
      return;
    }

    try {
      const backup =
        await readBackupFile(file);

      const shouldRestore =
        window.confirm(
          "Dieses Backup ersetzt dein aktuelles Profil, deine Dienste und deine Dienstvorlagen. Fortfahren?",
        );

      if (!shouldRestore) {
        setMessage(
          "Import abgebrochen.",
        );

        return;
      }

      restoreCareCheckBackup(backup);

      setMessage(
        "Backup wurde wiederhergestellt. Die App wird neu geladen.",
      );

      window.setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Backup konnte nicht importiert werden.";

      setMessage(errorMessage);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }
    }
  }

  return (
    <Card className="profile-section-card data-backup-card">
      <div className="profile-section-header">
        <span className="card-label">
          Datensicherung
        </span>

        <strong>
          Backup, Restore & Datenexport
        </strong>

        <p>
          Sichere Profil, Dienste,
          Zeitgutschriften und Dienstvorlagen als
          Backup-Datei. Der Datenexport enthaelt
          zusaetzlich Planungsvorlagen und
          Fairness-Teamdaten. Alte Backups der
          Version 1 können weiterhin importiert
          werden.
        </p>
      </div>

      <div className="data-backup-stats">
        <div>
          <span>
            Kalendereinträge gespeichert
          </span>

          <strong>{shifts.length}</strong>
        </div>

        <div>
          <span>Backup enthält</span>

          <strong>
            Profil · Einträge · Gutschriften ·
            Vorlagen
          </strong>
        </div>
      </div>

      <div className="data-backup-actions">
        <Button
          type="button"
          onClick={handleExportBackup}
        >
          Backup exportieren
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={handleExportPortabilityData}
        >
          Datenexport
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            fileInputRef.current?.click()
          }
        >
          Backup importieren
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden-input"
          onChange={(event) =>
            handleImportBackup(
              event.target.files?.[0],
            )
          }
        />
      </div>

      <div className="data-delete-zone">
        <div>
          <strong>
            Alle lokalen Daten löschen
          </strong>

          <p>
            Entfernt CareCheck-Daten aus diesem
            Browser. Exportierte Backup-Dateien
            bleiben außerhalb der App erhalten.
          </p>
        </div>

        <Button
          type="button"
          variant="danger"
          onClick={handleDeleteAllLocalData}
        >
          Lokal löschen
        </Button>
      </div>

      {message && (
        <p className="data-backup-message">
          {message}
        </p>
      )}

      <p className="profile-helper">
        Datenexport ist maschinenlesbar und
        schliesst geraetespezifische
        Sync-Metadaten aus.
      </p>

      <p className="profile-helper">
        Hinweis: Die Wiederherstellung
        überschreibt die aktuell lokal
        gespeicherten Daten dieser App.
      </p>
    </Card>
  );
}
