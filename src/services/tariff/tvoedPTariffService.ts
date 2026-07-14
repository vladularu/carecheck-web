import type { PayGroup, PayLevel } from "../../types/index";

type TvoedPValues = Record<PayLevel, number | null>;
type TvoedPTariffTable = Record<PayGroup, TvoedPValues>;

export interface TvoedPTariffVersion {
  id: string;
  label: string;
  validFrom: string;
  validTo: string;
  sourceNote: string;
  monthly: TvoedPTariffTable;
  hourly: TvoedPTariffTable;
}

const TVOED_P_MONTHLY_2026: TvoedPTariffTable = {
  P7: {
    1: null,
    2: 3510.3,
    3: 3701.21,
    4: 3998.33,
    5: 4149.59,
    6: 4305.4,
  },
  P8: {
    1: null,
    2: 3701.21,
    3: 3862.8,
    4: 4075.58,
    5: 4247.92,
    6: 4488.98,
  },
  P9: {
    1: null,
    2: 3992.39,
    3: 4184.4,
    4: 4312.38,
    5: 4558.59,
    6: 4662.42,
  },
  P10: {
    1: null,
    2: 4184.4,
    3: 4312.38,
    4: 4675.42,
    5: 4850.63,
    6: 4960.96,
  },
  P11: {
    1: null,
    2: 4419.71,
    3: 4557.3,
    4: 4901.27,
    5: 5129.69,
    6: 5233.54,
  },
  P12: {
    1: null,
    2: 4657.22,
    3: 4802.61,
    4: 5166.04,
    5: 5389.29,
    6: 5493.13,
  },
  P13: {
    1: null,
    2: 4894.78,
    3: 5047.94,
    4: 5430.82,
    5: 5707.28,
    6: 5778.68,
  },
  P14: {
    1: null,
    2: 5013.53,
    3: 5170.59,
    4: 5563.22,
    5: 6096.68,
    6: 6194.02,
  },
  P15: {
    1: null,
    2: 5132.29,
    3: 5293.23,
    4: 5695.6,
    5: 6177.16,
    6: 6361.06,
  },
  P16: {
    1: null,
    2: 5240.04,
    3: 5415.9,
    4: 5983.76,
    5: 6645.71,
    6: 6937.7,
  },
};

const TVOED_P_HOURLY_2026: TvoedPTariffTable = {
  P7: {
    1: null,
    2: 20.7,
    3: 21.83,
    4: 23.58,
    5: 24.47,
    6: 25.39,
  },
  P8: {
    1: null,
    2: 21.83,
    3: 22.78,
    4: 24.03,
    5: 25.05,
    6: 26.47,
  },
  P9: {
    1: null,
    2: 23.54,
    3: 24.68,
    4: 25.43,
    5: 26.88,
    6: 27.5,
  },
  P10: {
    1: null,
    2: 24.68,
    3: 25.43,
    4: 27.57,
    5: 28.61,
    6: 29.26,
  },
  P11: {
    1: null,
    2: 26.06,
    3: 26.88,
    4: 28.9,
    5: 30.25,
    6: 30.86,
  },
  P12: {
    1: null,
    2: 27.46,
    3: 28.32,
    4: 30.47,
    5: 31.78,
    6: 32.39,
  },
  P13: {
    1: null,
    2: 28.87,
    3: 29.77,
    4: 32.03,
    5: 33.66,
    6: 34.08,
  },
  P14: {
    1: null,
    2: 29.57,
    3: 30.49,
    4: 32.81,
    5: 35.95,
    6: 36.53,
  },
  P15: {
    1: null,
    2: 30.27,
    3: 31.22,
    4: 33.59,
    5: 36.43,
    6: 37.51,
  },
  P16: {
    1: null,
    2: 30.9,
    3: 31.94,
    4: 35.29,
    5: 39.19,
    6: 40.91,
  },
};

export const TVOED_P_TARIFF_VERSIONS: TvoedPTariffVersion[] = [
  {
    id: "tvoed-p-vka-2026-05",
    label: "TVoeD-P 2026 - gueltig 01.05.2026-31.03.2027",
    validFrom: "2026-05-01",
    validTo: "2027-03-31",
    sourceNote:
      "Tabellenwerte aus dem bestehenden CareCheck-Datenstand; vor produktiver Abrechnung fachlich pruefen.",
    monthly: TVOED_P_MONTHLY_2026,
    hourly: TVOED_P_HOURLY_2026,
  },
];

const CURRENT_TVOED_P_TARIFF_VERSION = TVOED_P_TARIFF_VERSIONS[0];

export function getTvoedPTariffVersion(
  dateKey?: string,
): TvoedPTariffVersion {
  if (!dateKey) {
    return CURRENT_TVOED_P_TARIFF_VERSION;
  }

  return (
    TVOED_P_TARIFF_VERSIONS.find(
      (version) =>
        version.validFrom <= dateKey && dateKey <= version.validTo,
    ) ?? CURRENT_TVOED_P_TARIFF_VERSION
  );
}

export function getTvoedPTariffLabel(dateKey?: string): string {
  return getTvoedPTariffVersion(dateKey).label;
}

export function getTvoedPMonthlySalary(
  payGroup: PayGroup,
  payLevel: PayLevel,
  dateKey?: string,
): number | null {
  return getTvoedPTariffVersion(dateKey).monthly[payGroup][payLevel];
}

export function getTvoedPHourlyRate(
  payGroup: PayGroup,
  payLevel: PayLevel,
  dateKey?: string,
): number | null {
  return getTvoedPTariffVersion(dateKey).hourly[payGroup][payLevel];
}

export function getTvoedPPremiumHourlyRate(
  payGroup: PayGroup,
  dateKey?: string,
): number {
  return getTvoedPTariffVersion(dateKey).hourly[payGroup][3] ?? 0;
}
