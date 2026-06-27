export type SurveyScale = 1 | 2 | 3 | 4 | 5;

export type SurveyInformed = "Yes" | "No";

export type SurveyUsageDuration =
  | "Less than 1 month"
  | "1–3 months"
  | "4–6 months"
  | "More than 6 months";

export type SurveyUsageFrequency = "Daily" | "Weekly" | "Monthly" | "Rarely";

export type SurveyWorkImprovement =
  | "Significantly Improved"
  | "Improved"
  | "Slightly Improved"
  | "No Improvement";

export type SurveyAspectImproved =
  | "Speed"
  | "Accuracy"
  | "Convenience"
  | "Monitoring"
  | "Decision Making"
  | "Collaboration"
  | "Reporting";

export type SurveyOverallRating =
  | "Excellent"
  | "Very Good"
  | "Good"
  | "Fair"
  | "Needs Improvement";

export type SurveyBenefits = {
  faster_processing: boolean;
  less_paperwork: boolean;
  better_monitoring: boolean;
  improved_reporting: boolean;
  increased_productivity: boolean;
  better_coordination: boolean;
  higher_data_accuracy: boolean;
  better_client_service: boolean;
  others?: string;
};

export type SurveyPayload = {
  name?: string;
  office_division: string;
  position: string;
  region_field_office: string;
  date: string;
  informed: SurveyInformed;
  usage_duration: SurveyUsageDuration;
  usage_frequency: SurveyUsageFrequency;
  eval_easy_to_understand: SurveyScale;
  eval_improves_efficiency: SurveyScale;
  eval_reduces_processing_time: SurveyScale;
  eval_minimizes_errors: SurveyScale;
  eval_user_friendly: SurveyScale;
  eval_accurate_information: SurveyScale;
  eval_improves_service_delivery: SurveyScale;
  eval_transparency_accountability: SurveyScale;
  eval_would_recommend: SurveyScale;
  eval_overall_satisfied: SurveyScale;
  benefits: SurveyBenefits;
  work_improvement: SurveyWorkImprovement;
  aspect_improved_most: SurveyAspectImproved;
  sustain_over_time: SurveyScale;
  sustain_replicable: SurveyScale;
  sustain_adequate_support: SurveyScale;
  sustain_sufficient_training: SurveyScale;
  like_most?: string;
  challenges?: string;
  improvements_suggested?: string;
  other_comments?: string;
  overall_stars: SurveyScale;
  overall_rating: SurveyOverallRating;
};

/** Unsubmitted form state — no pre-selected ratings or choices to avoid bias. */
export type SurveyFormDraft = {
  name?: string;
  office_division: string;
  position: string;
  region_field_office: string;
  date: string;
  informed: SurveyInformed | "";
  usage_duration: SurveyUsageDuration | "";
  usage_frequency: SurveyUsageFrequency | "";
  eval_easy_to_understand: SurveyScale | null;
  eval_improves_efficiency: SurveyScale | null;
  eval_reduces_processing_time: SurveyScale | null;
  eval_minimizes_errors: SurveyScale | null;
  eval_user_friendly: SurveyScale | null;
  eval_accurate_information: SurveyScale | null;
  eval_improves_service_delivery: SurveyScale | null;
  eval_transparency_accountability: SurveyScale | null;
  eval_would_recommend: SurveyScale | null;
  eval_overall_satisfied: SurveyScale | null;
  benefits: SurveyBenefits;
  work_improvement: SurveyWorkImprovement | "";
  aspect_improved_most: SurveyAspectImproved | "";
  sustain_over_time: SurveyScale | null;
  sustain_replicable: SurveyScale | null;
  sustain_adequate_support: SurveyScale | null;
  sustain_sufficient_training: SurveyScale | null;
  like_most?: string;
  challenges?: string;
  improvements_suggested?: string;
  other_comments?: string;
  overall_stars: SurveyScale | null;
  overall_rating: SurveyOverallRating | "";
};

export type SurveyResponseRow = {
  id: number;
  name: string | null;
  region_field_office: string;
  payload: SurveyPayload;
  created_at: string;
};

export type SurveyScaleAverages = Record<string, number | null>;

export type SurveyAnalytics = {
  total_responses: number;
  evaluation_averages: SurveyScaleAverages;
  sustainability_averages: SurveyScaleAverages;
  overall_stars_average: number | null;
  informed: { yes: number; no: number };
  work_improvement: { label: string; count: number }[];
  overall_rating: { label: string; count: number }[];
  benefit_counts: { label: string; count: number }[];
  by_region: { region_field_office: string; count: number }[];
  by_usage_duration: { usage_duration: string; count: number }[];
  recent: SurveyResponseRow[];
};

export const SURVEY_INFORMED_OPTIONS: SurveyInformed[] = ["Yes", "No"];

export const SURVEY_USAGE_DURATION_OPTIONS: SurveyUsageDuration[] = [
  "Less than 1 month",
  "1–3 months",
  "4–6 months",
  "More than 6 months",
];

export const SURVEY_USAGE_FREQUENCY_OPTIONS: SurveyUsageFrequency[] = [
  "Daily",
  "Weekly",
  "Monthly",
  "Rarely",
];

export const SURVEY_WORK_IMPROVEMENT_OPTIONS: SurveyWorkImprovement[] = [
  "Significantly Improved",
  "Improved",
  "Slightly Improved",
  "No Improvement",
];

export const SURVEY_ASPECT_IMPROVED_OPTIONS: SurveyAspectImproved[] = [
  "Speed",
  "Accuracy",
  "Convenience",
  "Monitoring",
  "Decision Making",
  "Collaboration",
  "Reporting",
];

export const SURVEY_OVERALL_RATING_OPTIONS: SurveyOverallRating[] = [
  "Excellent",
  "Very Good",
  "Good",
  "Fair",
  "Needs Improvement",
];

export const SURVEY_SCALE_LABELS: Record<SurveyScale, string> = {
  5: "Strongly Agree",
  4: "Agree",
  3: "Neutral",
  2: "Disagree",
  1: "Strongly Disagree",
};

export const SURVEY_EVALUATION_STATEMENTS: {
  key: keyof SurveyPayload;
  label: string;
}[] = [
  { key: "eval_easy_to_understand", label: "The Offline/Online Faced App is easy to understand." },
  { key: "eval_improves_efficiency", label: "It helps improve my work efficiency." },
  { key: "eval_reduces_processing_time", label: "It reduces processing time." },
  { key: "eval_minimizes_errors", label: "It minimizes errors." },
  { key: "eval_user_friendly", label: "It is user-friendly." },
  { key: "eval_accurate_information", label: "The information provided is accurate." },
  {
    key: "eval_improves_service_delivery",
    label: "The Offline/Online Faced App improves service delivery.",
  },
  {
    key: "eval_transparency_accountability",
    label: "It supports transparency and accountability.",
  },
  {
    key: "eval_would_recommend",
    label: "I would recommend the Offline/Online Faced App to other offices.",
  },
  {
    key: "eval_overall_satisfied",
    label: "Overall, I am satisfied with the Offline/Online Faced App.",
  },
];

export const SURVEY_SUSTAINABILITY_STATEMENTS: {
  key: keyof SurveyPayload;
  label: string;
}[] = [
  { key: "sustain_over_time", label: "The Offline/Online Faced App can be sustained over time." },
  { key: "sustain_replicable", label: "It can be replicated in other DSWD offices." },
  { key: "sustain_adequate_support", label: "Adequate support is available for users." },
  { key: "sustain_sufficient_training", label: "Training materials are sufficient." },
];

export const SURVEY_BENEFIT_OPTIONS: {
  key: keyof SurveyBenefits;
  label: string;
}[] = [
  { key: "faster_processing", label: "Faster processing" },
  { key: "less_paperwork", label: "Less paperwork" },
  { key: "better_monitoring", label: "Better monitoring" },
  { key: "improved_reporting", label: "Improved reporting" },
  { key: "increased_productivity", label: "Increased productivity" },
  { key: "better_coordination", label: "Better coordination" },
  { key: "higher_data_accuracy", label: "Higher data accuracy" },
  { key: "better_client_service", label: "Better client service" },
];

export function emptySurveyBenefits(): SurveyBenefits {
  return {
    faster_processing: false,
    less_paperwork: false,
    better_monitoring: false,
    improved_reporting: false,
    increased_productivity: false,
    better_coordination: false,
    higher_data_accuracy: false,
    better_client_service: false,
    others: "",
  };
}

export function emptySurveyFormDraft(): SurveyFormDraft {
  return {
    name: "",
    office_division: "",
    position: "",
    region_field_office: "",
    date: "",
    informed: "",
    usage_duration: "",
    usage_frequency: "",
    eval_easy_to_understand: null,
    eval_improves_efficiency: null,
    eval_reduces_processing_time: null,
    eval_minimizes_errors: null,
    eval_user_friendly: null,
    eval_accurate_information: null,
    eval_improves_service_delivery: null,
    eval_transparency_accountability: null,
    eval_would_recommend: null,
    eval_overall_satisfied: null,
    benefits: emptySurveyBenefits(),
    work_improvement: "",
    aspect_improved_most: "",
    sustain_over_time: null,
    sustain_replicable: null,
    sustain_adequate_support: null,
    sustain_sufficient_training: null,
    like_most: "",
    challenges: "",
    improvements_suggested: "",
    other_comments: "",
    overall_stars: null,
    overall_rating: "",
  };
}

/** @deprecated Use emptySurveyFormDraft */
export function emptySurveyPayload(): SurveyFormDraft {
  return emptySurveyFormDraft();
}

function parseScale(value: unknown, label: string): SurveyScale {
  if (value === null || value === undefined || value === "") {
    throw new Error(`Please select a rating for: ${label}.`);
  }
  const num = Number(value);
  if (![1, 2, 3, 4, 5].includes(num)) {
    throw new Error(`${label} must be rated 1–5.`);
  }
  return num as SurveyScale;
}

function parseEnum<T extends string>(value: unknown, options: readonly T[], label: string): T {
  const str = String(value ?? "").trim() as T;
  if (!str || !options.includes(str)) {
    throw new Error(`Please select an answer for: ${label}.`);
  }
  return str;
}

function parseBenefits(raw: unknown): SurveyBenefits {
  const source =
    raw && typeof raw === "object" ? (raw as Partial<SurveyBenefits>) : {};
  const others = String(source.others ?? "").trim();
  return {
    faster_processing: Boolean(source.faster_processing),
    less_paperwork: Boolean(source.less_paperwork),
    better_monitoring: Boolean(source.better_monitoring),
    improved_reporting: Boolean(source.improved_reporting),
    increased_productivity: Boolean(source.increased_productivity),
    better_coordination: Boolean(source.better_coordination),
    higher_data_accuracy: Boolean(source.higher_data_accuracy),
    better_client_service: Boolean(source.better_client_service),
    others: others || undefined,
  };
}

export function validateSurveyPayload(payload: unknown): SurveyPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid survey payload.");
  }

  const p = payload as Partial<SurveyPayload>;
  const office_division = String(p.office_division ?? "").trim();
  const position = String(p.position ?? "").trim();
  const region_field_office = String(p.region_field_office ?? "").trim();
  const date = String(p.date ?? "").trim();

  if (!office_division) throw new Error("Office / Division is required.");
  if (!position) throw new Error("Position is required.");
  if (!region_field_office) throw new Error("Region/Field Office is required.");
  if (!date) throw new Error("Date is required.");

  const name = String(p.name ?? "").trim();

  return {
    name: name || undefined,
    office_division,
    position,
    region_field_office,
    date,
    informed: parseEnum(p.informed, SURVEY_INFORMED_OPTIONS, "Awareness (informed)"),
    usage_duration: parseEnum(
      p.usage_duration,
      SURVEY_USAGE_DURATION_OPTIONS,
      "Usage duration",
    ),
    usage_frequency: parseEnum(
      p.usage_frequency,
      SURVEY_USAGE_FREQUENCY_OPTIONS,
      "Usage frequency",
    ),
    eval_easy_to_understand: parseScale(p.eval_easy_to_understand, "Easy to understand"),
    eval_improves_efficiency: parseScale(p.eval_improves_efficiency, "Work efficiency"),
    eval_reduces_processing_time: parseScale(
      p.eval_reduces_processing_time,
      "Processing time",
    ),
    eval_minimizes_errors: parseScale(p.eval_minimizes_errors, "Minimizes errors"),
    eval_user_friendly: parseScale(p.eval_user_friendly, "User-friendly"),
    eval_accurate_information: parseScale(p.eval_accurate_information, "Accurate information"),
    eval_improves_service_delivery: parseScale(
      p.eval_improves_service_delivery,
      "Service delivery",
    ),
    eval_transparency_accountability: parseScale(
      p.eval_transparency_accountability,
      "Transparency and accountability",
    ),
    eval_would_recommend: parseScale(p.eval_would_recommend, "Recommendation"),
    eval_overall_satisfied: parseScale(p.eval_overall_satisfied, "Overall satisfaction"),
    benefits: parseBenefits(p.benefits),
    work_improvement: parseEnum(
      p.work_improvement,
      SURVEY_WORK_IMPROVEMENT_OPTIONS,
      "Work improvement",
    ),
    aspect_improved_most: parseEnum(
      p.aspect_improved_most,
      SURVEY_ASPECT_IMPROVED_OPTIONS,
      "Aspect improved most",
    ),
    sustain_over_time: parseScale(p.sustain_over_time, "Sustained over time"),
    sustain_replicable: parseScale(p.sustain_replicable, "Replicable"),
    sustain_adequate_support: parseScale(p.sustain_adequate_support, "Adequate support"),
    sustain_sufficient_training: parseScale(
      p.sustain_sufficient_training,
      "Sufficient training",
    ),
    like_most: String(p.like_most ?? "").trim() || undefined,
    challenges: String(p.challenges ?? "").trim() || undefined,
    improvements_suggested: String(p.improvements_suggested ?? "").trim() || undefined,
    other_comments: String(p.other_comments ?? "").trim() || undefined,
    overall_stars: parseScale(p.overall_stars, "Overall stars"),
    overall_rating: parseEnum(
      p.overall_rating,
      SURVEY_OVERALL_RATING_OPTIONS,
      "Overall rating",
    ),
  };
}

export function surveyPayloadToExportRow(row: SurveyResponseRow) {
  const p = row.payload;
  const benefitLabels = SURVEY_BENEFIT_OPTIONS.filter(({ key }) => p.benefits[key])
    .map(({ label }) => label)
    .join("; ");

  return {
    id: row.id,
    submitted_at: row.created_at,
    name: row.name ?? "",
    office_division: p.office_division,
    position: p.position,
    region_field_office: p.region_field_office,
    date: p.date,
    informed: p.informed,
    usage_duration: p.usage_duration,
    usage_frequency: p.usage_frequency,
    eval_easy_to_understand: p.eval_easy_to_understand,
    eval_improves_efficiency: p.eval_improves_efficiency,
    eval_reduces_processing_time: p.eval_reduces_processing_time,
    eval_minimizes_errors: p.eval_minimizes_errors,
    eval_user_friendly: p.eval_user_friendly,
    eval_accurate_information: p.eval_accurate_information,
    eval_improves_service_delivery: p.eval_improves_service_delivery,
    eval_transparency_accountability: p.eval_transparency_accountability,
    eval_would_recommend: p.eval_would_recommend,
    eval_overall_satisfied: p.eval_overall_satisfied,
    benefits: benefitLabels,
    benefits_others: p.benefits.others ?? "",
    work_improvement: p.work_improvement,
    aspect_improved_most: p.aspect_improved_most,
    sustain_over_time: p.sustain_over_time,
    sustain_replicable: p.sustain_replicable,
    sustain_adequate_support: p.sustain_adequate_support,
    sustain_sufficient_training: p.sustain_sufficient_training,
    like_most: p.like_most ?? "",
    challenges: p.challenges ?? "",
    improvements_suggested: p.improvements_suggested ?? "",
    other_comments: p.other_comments ?? "",
    overall_stars: p.overall_stars,
    overall_rating: p.overall_rating,
  };
}
