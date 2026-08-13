import type { FormKindConfig, ProfileName, Severity } from "./types.js";

const profiles: Record<ProfileName, Partial<Record<string, Severity | "off">>> = {
  global: {},
  strict: {
    FK001: "error",
    FK003: "error",
    FK006: "error",
    FK008: "warning",
    FK009: "error",
    FK012: "error",
    FK017: "error",
    FK018: "error",
    FK023: "warning",
  },
  commerce: {
    FK004: "error",
    FK005: "error",
    FK006: "error",
    FK009: "error",
    FK010: "error",
    FK012: "error",
    FK013: "error",
    FK017: "error",
    FK020: "warning",
    FK027: "error",
  },
  "public-sector": {
    FK001: "error",
    FK002: "error",
    FK003: "error",
    FK008: "warning",
    FK014: "error",
    FK015: "error",
    FK016: "error",
    FK018: "error",
    FK019: "error",
    FK023: "error",
    FK025: "error",
  },
};

export function applyProfile(config: FormKindConfig): FormKindConfig {
  const profile = config.profile ?? "global";
  return { ...config, profile, severity: { ...profiles[profile], ...config.severity } };
}

export const profileNames = Object.keys(profiles) as ProfileName[];
