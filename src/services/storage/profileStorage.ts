import type { UserProfile } from "../../types/index";

const PROFILE_KEY = "carecheck.profile";

export function loadProfile(): UserProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}