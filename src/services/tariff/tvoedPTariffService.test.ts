import { describe, expect, it } from "vitest";
import {
  getTvoedPHourlyRate,
  getTvoedPMonthlySalary,
  getTvoedPPremiumHourlyRate,
  getTvoedPTariffVersion,
  TVOED_P_TARIFF_VERSIONS,
} from "./tvoedPTariffService";

describe("tvoedPTariffService", () => {
  it("stellt Tarifwerte versioniert bereit", () => {
    expect(TVOED_P_TARIFF_VERSIONS).toHaveLength(1);

    expect(getTvoedPTariffVersion("2026-07-01")).toMatchObject({
      id: "tvoed-p-vka-2026-05",
      validFrom: "2026-05-01",
      validTo: "2027-03-31",
    });
  });

  it("liefert Monatsentgelt, Stundenwert und Zuschlagsbasis aus derselben Version", () => {
    expect(getTvoedPMonthlySalary("P8", 4, "2026-07-01")).toBe(4075.58);
    expect(getTvoedPHourlyRate("P8", 4, "2026-07-01")).toBe(24.03);
    expect(getTvoedPPremiumHourlyRate("P8", "2026-07-01")).toBe(22.78);
  });
});
