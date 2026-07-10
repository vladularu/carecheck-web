import { useRef, useState } from "react";
import { useAppContext } from "../../context/useAppContext";
import {
  downloadCareCheckBackup,
  readBackupFile,
  restoreCareCheckBackup,
} from "../../services/backup/backupService";
import Button from "../ui/Button";
import Card from "../ui/Card";

export default function DataBackupCard() {
  const { profile, shifts, shiftTemplates } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string>("");

  function handleExportBackup() {
    downloadCareCheckBackup({
      profile,
      shifts,
      shiftTemplates,
    });

    setMessage("Backup wurde erstellt.");
  }

  async function handleImportBackup(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const backup = await readBackupFile(file);

      const shouldRestore = window.confirm(
        "Dieses Backup ersetzt dein aktuelles Profil, deine Dienste und deine Dienstvorlagen. Fortfahren?",
      );

      if (!shouldRestore) {
        setMessage("Import abgebrochen.");
        return;
      }

      restoreCareCheckBackup(backup);
      setMessage("Backup wurde wiederhergestellt. Die App wird neu geladen.");

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
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <Card className="profile-section-card data-backup-card">
      <div className="profile-section-header">
        <span className="card-label">Datensicherung</span>
        <strong>Backup & Wiederherstellung</strong>
        <p>
          Sichere Profil, Dienste und Dienstvorlagen als JSON-Datei. Diese Datei
          kannst du spÃ¤ter wieder importieren, zum Beispiel nach einem
          GerÃ¤tewechsel oder wenn Browserdaten gelÃ¶scht wurden.
        </p>
      </div>

      <div className="data-backup-stats">
        <div>
          <span>Dienste gespeichert</span>
          <strong>{shifts.length}</strong>
        </div>

        <div>
          <span>Backup enthÃ¤lt</span>
          <strong>Profil Â· Dienste Â· Vorlagen</strong>
        </div>
      </div>

      <div className="data-backup-actions">
        <Button type="button" onClick={handleExportBackup}>
          Backup exportieren
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          Backup importieren
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden-input"
          onChange={(event) => handleImportBackup(event.target.files?.[0])}
        />
      </div>

      {message && <p className="data-backup-message">{message}</p>}

      <p className="profile-helper">
        Hinweis: Die Wiederherstellung Ã¼berschreibt die aktuell lokal
        gespeicherten Daten dieser App.
      </p>
    </Card>
  );
}
