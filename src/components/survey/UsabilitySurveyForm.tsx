"use client";

import { FormEvent, useState } from "react";
import {
  CheckboxGroup,
  FormField,
  RadioGroup,
  TextArea,
  TextInput,
} from "@/components/faced/FormField";
import {
  emptySurveyFormDraft,
  SURVEY_ASPECT_IMPROVED_OPTIONS,
  SURVEY_BENEFIT_OPTIONS,
  SURVEY_EVALUATION_STATEMENTS,
  SURVEY_INFORMED_OPTIONS,
  SURVEY_OVERALL_RATING_OPTIONS,
  SURVEY_SCALE_LABELS,
  SURVEY_SUSTAINABILITY_STATEMENTS,
  SURVEY_USAGE_DURATION_OPTIONS,
  SURVEY_USAGE_FREQUENCY_OPTIONS,
  SURVEY_WORK_IMPROVEMENT_OPTIONS,
  type SurveyFormDraft,
  type SurveyScale,
} from "@/lib/survey-types";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";
import { CheckCircle2, Loader2, Send, Star } from "lucide-react";

function SurveySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={ui.card}>
      <div className={ui.cardHeader}>
        <h3 className="text-base font-bold text-ph-blue-dark">{title}</h3>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

function ScaleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SurveyScale | null;
  onChange: (value: SurveyScale) => void;
}) {
  const scales: SurveyScale[] = [1, 2, 3, 4, 5];

  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <p className="mb-2 text-sm font-medium text-gray-800">{label}</p>
      <div className="flex flex-wrap gap-2">
        {scales.map((scale) => (
          <label
            key={scale}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm",
              value === scale
                ? "border-ph-blue bg-ph-blue/10 font-semibold text-ph-blue-dark"
                : "border-gray-200 bg-white hover:border-ph-blue/50",
            )}
          >
            <input
              type="radio"
              name={label}
              checked={value === scale}
              onChange={() => onChange(scale)}
              className="accent-ph-blue"
            />
            {scale}
          </label>
        ))}
      </div>
      {value == null ? (
        <p className="mt-1 text-xs text-amber-700">Select 1–5</p>
      ) : null}
    </div>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: SurveyScale | null;
  onChange: (value: SurveyScale) => void;
}) {
  const stars: SurveyScale[] = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={cn(
            "rounded-lg p-2 transition-colors",
            value != null && value >= star
              ? "text-amber-500"
              : "text-gray-300 hover:text-amber-400",
          )}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className="h-8 w-8"
            fill={value != null && value >= star ? "currentColor" : "none"}
            aria-hidden
          />
        </button>
      ))}
      <span className="text-sm text-gray-600">
        {value == null
          ? "Click to rate (1–5 stars)"
          : `${value}/5 — ${SURVEY_SCALE_LABELS[value]}`}
      </span>
    </div>
  );
}

export default function UsabilitySurveyForm() {
  const [form, setForm] = useState<SurveyFormDraft>(emptySurveyFormDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function patch<K extends keyof SurveyFormDraft>(key: K, value: SurveyFormDraft[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: form }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit survey.");
      }
      setSubmitted(true);
      setForm(emptySurveyFormDraft());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit survey.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className={cn(ui.alertSuccess, "flex items-start gap-3 p-6")}>
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" aria-hidden />
        <div>
          <p className="font-bold">Thank you for your feedback!</p>
          <p className="mt-1 text-sm">
            Your Offline/Online Faced App evaluation was saved successfully.
          </p>
          <button
            type="button"
            className={cn(ui.btnSecondary, "mt-4")}
            onClick={() => setSubmitted(false)}
          >
            Submit another response
          </button>
        </div>
      </div>
    );
  }

  const benefitCheckboxValues = Object.fromEntries(
    SURVEY_BENEFIT_OPTIONS.map(({ key }) => [key, Boolean(form.benefits[key])]),
  ) as Record<string, boolean>;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      {error ? <div className={ui.alertError}>{error}</div> : null}

      <p className={cn(ui.alertWarning, "text-sm")}>
        All ratings and choices start unselected. Please answer each required
        question — nothing is pre-filled to avoid bias.
      </p>

      <SurveySection title="Respondent Information">
        <FormField label="Name (Optional)">
          <TextInput
            value={form.name ?? ""}
            onChange={(e) => patch("name", e.target.value)}
            autoComplete="name"
          />
        </FormField>
        <FormField label="Office / Division" required>
          <TextInput
            value={form.office_division}
            onChange={(e) => patch("office_division", e.target.value)}
            required
          />
        </FormField>
        <FormField label="Position" required>
          <TextInput
            value={form.position}
            onChange={(e) => patch("position", e.target.value)}
            required
          />
        </FormField>
        <FormField label="Region/Field Office" required>
          <TextInput
            value={form.region_field_office}
            onChange={(e) => patch("region_field_office", e.target.value)}
            placeholder="e.g. Region XII, Field Office Caraga"
            required
          />
        </FormField>
        <FormField label="Date" required>
          <TextInput
            type="date"
            value={form.date}
            onChange={(e) => patch("date", e.target.value)}
            required
          />
        </FormField>
      </SurveySection>

      <SurveySection title="Part I. Awareness">
        <FormField label="1. Were you informed about the Offline/Online Faced App?" required>
          <RadioGroup
            name="informed"
            options={SURVEY_INFORMED_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={form.informed}
            onChange={(v) => patch("informed", v as SurveyFormDraft["informed"])}
          />
        </FormField>

        <FormField
          label="2. How long have you been using the Offline/Online Faced App?"
          required
        >
          <RadioGroup
            name="usage_duration"
            options={SURVEY_USAGE_DURATION_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={form.usage_duration}
            onChange={(v) =>
              patch("usage_duration", v as SurveyFormDraft["usage_duration"])
            }
          />
        </FormField>

        <FormField label="3. How often do you use it?" required>
          <RadioGroup
            name="usage_frequency"
            options={SURVEY_USAGE_FREQUENCY_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={form.usage_frequency}
            onChange={(v) =>
              patch("usage_frequency", v as SurveyFormDraft["usage_frequency"])
            }
          />
        </FormField>
      </SurveySection>

      <SurveySection title="Part II. Evaluation">
        <div className="overflow-x-auto rounded-lg border border-gray-200 text-sm">
          <table className="w-full min-w-[20rem]">
            <thead className="bg-ph-blue/5 text-ph-blue-dark">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Rating</th>
                <th className="px-3 py-2 text-left font-semibold">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {([5, 4, 3, 2, 1] as SurveyScale[]).map((n) => (
                <tr key={n} className="border-t border-gray-100">
                  <td className="px-3 py-1.5 font-semibold">{n}</td>
                  <td className="px-3 py-1.5">{SURVEY_SCALE_LABELS[n]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm font-medium text-gray-700">
          Rate the following statements (1 = Strongly Disagree, 5 = Strongly Agree):
        </p>

        {SURVEY_EVALUATION_STATEMENTS.map(({ key, label }) => (
          <ScaleRow
            key={key}
            label={label}
            value={form[key] as SurveyScale | null}
            onChange={(value) => patch(key, value as SurveyFormDraft[typeof key])}
          />
        ))}
      </SurveySection>

      <SurveySection title="Part III. Impact">
        <FormField label="1. What benefits have you experienced? (Check all that apply)">
          <CheckboxGroup
            options={SURVEY_BENEFIT_OPTIONS.map(({ key, label }) => ({
              key,
              label,
            }))}
            values={benefitCheckboxValues}
            onChange={(key, checked) =>
              patch("benefits", {
                ...form.benefits,
                [key]: checked,
              })
            }
          />
          <div className="mt-3">
            <TextInput
              value={form.benefits.others ?? ""}
              onChange={(e) =>
                patch("benefits", { ...form.benefits, others: e.target.value })
              }
              placeholder="Others (optional)"
            />
          </div>
        </FormField>

        <FormField
          label="2. Has the Offline/Online Faced App helped improve your work?"
          required
        >
          <RadioGroup
            name="work_improvement"
            options={SURVEY_WORK_IMPROVEMENT_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={form.work_improvement}
            onChange={(v) =>
              patch("work_improvement", v as SurveyFormDraft["work_improvement"])
            }
          />
        </FormField>

        <FormField label="3. Which aspect improved the most?" required>
          <RadioGroup
            name="aspect_improved_most"
            options={SURVEY_ASPECT_IMPROVED_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={form.aspect_improved_most}
            onChange={(v) =>
              patch("aspect_improved_most", v as SurveyFormDraft["aspect_improved_most"])
            }
          />
        </FormField>
      </SurveySection>

      <SurveySection title="Part IV. Sustainability">
        <p className="text-sm font-medium text-gray-700">
          Rate the following statements (1–5):
        </p>
        {SURVEY_SUSTAINABILITY_STATEMENTS.map(({ key, label }) => (
          <ScaleRow
            key={key}
            label={label}
            value={form[key] as SurveyScale | null}
            onChange={(value) => patch(key, value as SurveyFormDraft[typeof key])}
          />
        ))}
      </SurveySection>

      <SurveySection title="Part V. Open-Ended Questions">
        <FormField label="What do you like most about the Offline/Online Faced App?">
          <TextArea
            value={form.like_most ?? ""}
            onChange={(e) => patch("like_most", e.target.value)}
            rows={3}
          />
        </FormField>
        <FormField label="What challenges have you encountered?">
          <TextArea
            value={form.challenges ?? ""}
            onChange={(e) => patch("challenges", e.target.value)}
            rows={3}
          />
        </FormField>
        <FormField label="What improvements would you suggest?">
          <TextArea
            value={form.improvements_suggested ?? ""}
            onChange={(e) => patch("improvements_suggested", e.target.value)}
            rows={3}
          />
        </FormField>
        <FormField label="Other comments or recommendations">
          <TextArea
            value={form.other_comments ?? ""}
            onChange={(e) => patch("other_comments", e.target.value)}
            rows={3}
          />
        </FormField>
      </SurveySection>

      <SurveySection title="Overall Rating">
        <FormField
          label="Overall, how would you rate the Offline/Online Faced App? (Stars)"
          required
        >
          <StarRating
            value={form.overall_stars}
            onChange={(value) => patch("overall_stars", value)}
          />
        </FormField>

        <FormField label="Overall rating" required>
          <RadioGroup
            name="overall_rating"
            options={SURVEY_OVERALL_RATING_OPTIONS.map((o) => ({ value: o, label: o }))}
            value={form.overall_rating}
            onChange={(v) =>
              patch("overall_rating", v as SurveyFormDraft["overall_rating"])
            }
          />
        </FormField>
      </SurveySection>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className={cn(ui.btnPrimary, ui.withIcon)}
        >
          {submitting ? (
            <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
          ) : (
            <Send className={ui.iconSm} aria-hidden />
          )}
          Submit survey
        </button>
      </div>
    </form>
  );
}
