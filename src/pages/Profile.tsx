import { useEffect, useState } from "react";
import type {
  FederalState,
  PayGroup,
  PayLevel,
  UserProfile,
} from "../types/index";
import {
  loadProfile,
  saveProfile,
} from "../services/storage/profileStorage";

const federalStates: FederalState[] = [
  "BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV",
  "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH",
];

const payGroups: PayGroup[] = [
  "P7", "P8", "P9", "P10", "P11",
  "P12", "P13", "P14", "P15", "P16",
];

const payLevels: PayLevel[] = [1, 2, 3, 4, 5, 6];

const defaultProfile: UserProfile = {
  federalState: "HE",
  weeklyHours: 38.5,
  payGroup: "P8",
  payLevel: 4,
};

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>(
    () => loadProfile() ?? defaultProfile
  );

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  function updateProfile<K extends keyof UserProfile>(
    key: K,
    value: UserProfile[K],
  ) {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <section className="page">
      <h1>Profil</h1>
      <p>
        Lege hier die Grundlagen für Feiertage, Sollstunden und
        TVöD-Berechnung fest.
      </p>

      <div className="form-grid">
        <label className="field">
          <span>Bundesland</span>
          <select
            value={profile.federalState}
            onChange={(event) =>
              updateProfile("federalState", event.target.value as FederalState)
            }
          >
            {federalStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Wochenarbeitszeit</span>
          <input
            type="number"
            step="0.1"
            min="1"
            value={profile.weeklyHours}
            onChange={(event) =>
              updateProfile("weeklyHours", Number(event.target.value))
            }
          />
        </label>

        <label className="field">
          <span>TVöD-P Gruppe</span>
          <select
            value={profile.payGroup}
            onChange={(event) =>
              updateProfile("payGroup", event.target.value as PayGroup)
            }
          >
            {payGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Stufe</span>
          <select
            value={profile.payLevel}
            onChange={(event) =>
              updateProfile("payLevel", Number(event.target.value) as PayLevel)
            }
          >
            {payLevels.map((level) => (
              <option key={level} value={level}>
                Stufe {level}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="summary-card">
        <strong>Aktuelles Profil</strong>
        <p>
          {profile.federalState} · {profile.weeklyHours} h/Woche ·{" "}
          {profile.payGroup} · Stufe {profile.payLevel}
        </p>
      </div>
    </section>
  );
}