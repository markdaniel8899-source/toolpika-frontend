/** Pure file size arithmetic. No DOM, React or locale formatting. */

export type VideoSizeMode = "bitrate" | "dataRate";

export type VideoResolution =
  | "res480p"
  | "res720p"
  | "res1080p"
  | "res1440p"
  | "res2160p";

export type VideoSizeErrorCode = "INVALID_NUMBER" | "OUT_OF_RANGE";

/** Typical streaming bitrates in megabits per second for each resolution. */
export const RESOLUTION_BITRATES: Record<VideoResolution, number> = {
  res480p: 2.5,
  res720p: 5,
  res1080p: 10,
  res1440p: 20,
  res2160p: 45,
};

/** Allowance for container headers and indexing on top of the media payload. */
export const OVERHEAD_FACTOR = 1.02;
/** Decimal units: one gigabyte is 1000 megabytes, as on drive labels. */
export const MB_PER_GB = 1000;
export const GB_PER_TB = 1000;

export const MAX_DURATION_MINUTES = 10080;
export const MAX_BITRATE_MBPS = 1000;
export const MAX_DATA_RATE = 10000;

export type StorageCapacityId = "gb1" | "gb64" | "gb256" | "tb1";

export const STORAGE_CAPACITIES: {
  id: StorageCapacityId;
  capacityMB: number;
}[] = [
  { id: "gb1", capacityMB: 1 * MB_PER_GB },
  { id: "gb64", capacityMB: 64 * MB_PER_GB },
  { id: "gb256", capacityMB: 256 * MB_PER_GB },
  { id: "tb1", capacityMB: 1 * MB_PER_GB * GB_PER_TB },
];

export interface VideoSizeInput {
  mode: VideoSizeMode;
  /** Resolution is a shortcut that fills the bitrate field. */
  resolution: VideoResolution;
  durationMinutes: number;
  bitrateMbps: number;
  dataRateMBPerMin: number;
}

export interface StorageFit {
  id: StorageCapacityId;
  capacityMB: number;
  count: number;
}

export interface VideoSizeResult {
  /** Payload before container overhead. */
  baseMB: number;
  /** Container overhead added to the payload. */
  overheadMB: number;
  /** Estimated file size in decimal megabytes. */
  sizeMB: number;
  /** Estimated file size in decimal gigabytes. */
  sizeGB: number;
  /** Bitrate equivalent of the entered data rate, in megabits per second. */
  equivalentMbps: number;
  durationMinutes: number;
  fits: StorageFit[];
  error?: VideoSizeErrorCode;
}

export const DEFAULT_VIDEO_SIZE_INPUT: VideoSizeInput = {
  mode: "bitrate",
  resolution: "res1080p",
  durationMinutes: 60,
  bitrateMbps: RESOLUTION_BITRATES.res1080p,
  dataRateMBPerMin: 75,
};

export const SAMPLE_VIDEO_SIZE_INPUT: VideoSizeInput = {
  mode: "bitrate",
  resolution: "res2160p",
  durationMinutes: 90,
  bitrateMbps: RESOLUTION_BITRATES.res2160p,
  dataRateMBPerMin: 337.5,
};

export function validateVideoSizeInput(
  input: VideoSizeInput,
): VideoSizeErrorCode | null {
  if (
    input.mode !== "bitrate" &&
    input.mode !== "dataRate"
  ) {
    return "OUT_OF_RANGE";
  }
  if (!Number.isFinite(input.durationMinutes)) return "INVALID_NUMBER";
  if (
    input.durationMinutes <= 0 ||
    input.durationMinutes > MAX_DURATION_MINUTES
  ) {
    return "OUT_OF_RANGE";
  }

  if (input.mode === "bitrate") {
    if (!Number.isFinite(input.bitrateMbps)) return "INVALID_NUMBER";
    if (
      input.bitrateMbps <= 0 ||
      input.bitrateMbps > MAX_BITRATE_MBPS
    ) {
      return "OUT_OF_RANGE";
    }
  } else {
    if (!Number.isFinite(input.dataRateMBPerMin)) return "INVALID_NUMBER";
    if (
      input.dataRateMBPerMin <= 0 ||
      input.dataRateMBPerMin > MAX_DATA_RATE
    ) {
      return "OUT_OF_RANGE";
    }
  }
  return null;
}

function emptyResult(error: VideoSizeErrorCode): VideoSizeResult {
  return {
    baseMB: 0,
    overheadMB: 0,
    sizeMB: 0,
    sizeGB: 0,
    equivalentMbps: 0,
    durationMinutes: 0,
    fits: STORAGE_CAPACITIES.map((item) => ({
      id: item.id,
      capacityMB: item.capacityMB,
      count: 0,
    })),
    error,
  };
}

/**
 * Estimate file size from a bitrate or from a data rate, then show how many
 * such files fit on common storage capacities. Raw numbers are returned; the
 * UI owns all rounding and formatting.
 */
export function calculateVideoSize(input: VideoSizeInput): VideoSizeResult {
  const problem = validateVideoSizeInput(input);
  if (problem) return emptyResult(problem);

  const baseMB =
    input.mode === "bitrate"
      ? (input.bitrateMbps * input.durationMinutes * 60) / 8
      : input.dataRateMBPerMin * input.durationMinutes;
  const overheadMB = baseMB * (OVERHEAD_FACTOR - 1);
  const sizeMB = baseMB + overheadMB;
  const equivalentMbps =
    input.mode === "bitrate"
      ? input.bitrateMbps
      : (input.dataRateMBPerMin * 8) / 60;

  return {
    baseMB,
    overheadMB,
    sizeMB,
    sizeGB: sizeMB / MB_PER_GB,
    equivalentMbps,
    durationMinutes: input.durationMinutes,
    fits: STORAGE_CAPACITIES.map((item) => ({
      id: item.id,
      capacityMB: item.capacityMB,
      count: Math.floor(item.capacityMB / sizeMB),
    })),
  };
}

export interface VideoSizeReportLabels {
  title: string;
  size: string;
  sizeMB: string;
  sizeGB: string;
  equivalent: string;
  unitMbps: string;
  duration: string;
  storage: string;
  note: string;
  capacityGb1: string;
  capacityGb64: string;
  capacityGb256: string;
  capacityTb1: string;
  file: string;
  files: string;
}

/** Plain text estimate for the clipboard button. */
export function formatVideoSizeReport(
  result: VideoSizeResult,
  labels: VideoSizeReportLabels,
  formatMB: (value: number) => string,
  formatGB: (value: number) => string,
  formatNumber: (value: number) => string,
): string {
  if (result.error) return "";
  const capacityLabels: Record<StorageCapacityId, string> = {
    gb1: labels.capacityGb1,
    gb64: labels.capacityGb64,
    gb256: labels.capacityGb256,
    tb1: labels.capacityTb1,
  };
  const lines = [
    labels.title,
    `${labels.size}: ${formatGB(result.sizeGB)}`,
    `${labels.sizeMB}: ${formatMB(result.sizeMB)}`,
    `${labels.equivalent}: ${formatNumber(result.equivalentMbps)} ${labels.unitMbps}`,
    `${labels.duration}: ${formatNumber(result.durationMinutes)}`,
    "",
    labels.storage,
    ...result.fits.map((fit) => {
      const unit = fit.count === 1 ? labels.file : labels.files;
      return `${capacityLabels[fit.id]}: ${formatNumber(fit.count)} ${unit}`;
    }),
    "",
    labels.note,
  ];
  return lines.join("\n");
}
