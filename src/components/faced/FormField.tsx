import { type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import * as ui from "@/lib/ui";

type FormFieldProps = {
  label: string;
  number?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  number,
  required = false,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={cn(ui.field, className)}>
      <label className={ui.label}>
        {number && <span className={ui.fieldNum}>{number}</span>}
        {label}
        {required && <span className={ui.required}>*</span>}
      </label>
      {children}
    </div>
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className = "", ...props }: TextInputProps) {
  return <input className={cn(ui.input, className)} {...props} />;
}

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className = "", ...props }: TextAreaProps) {
  return <textarea className={cn(ui.textarea, className)} {...props} />;
}

type CheckboxGroupProps = {
  options: { key: string; label: string }[];
  values: Record<string, boolean>;
  onChange: (key: string, checked: boolean) => void;
  exclusive?: boolean;
};

export function CheckboxGroup({
  options,
  values,
  onChange,
  exclusive = false,
}: CheckboxGroupProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map(({ key, label }) => (
        <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values[key] ?? false}
            onChange={(e) => {
              if (exclusive && e.target.checked) {
                options.forEach((o) => {
                  if (o.key !== key) onChange(o.key, false);
                });
              }
              onChange(key, e.target.checked);
            }}
            className="h-4 w-4 accent-ph-blue"
          />
          {label}
        </label>
      ))}
    </div>
  );
}

type SelectInputProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
  placeholder?: string;
  /** When false, omit the blank placeholder row (use for single-option defaults). */
  includeEmptyOption?: boolean;
};

export function SelectInput({
  options,
  placeholder = "Select...",
  includeEmptyOption = true,
  className = "",
  ...props
}: SelectInputProps) {
  return (
    <select className={cn(ui.input, className)} {...props}>
      {includeEmptyOption ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

type RadioGroupProps = {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  /** `true` spreads options across the row; `"start"` left-aligns with even gaps between options. */
  spread?: boolean | "start";
};

type SuggestionChipsProps = {
  suggestions: readonly string[];
  onSelect: (value: string) => void;
};

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className={ui.chip}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  spread = false,
}: RadioGroupProps) {
  const groupClass =
    spread === "start"
      ? ui.radioGroupStart
      : spread
        ? ui.radioGroupEven
        : "flex flex-wrap gap-4";

  return (
    <div className={groupClass}>
      {options.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="h-4 w-4 shrink-0 accent-ph-blue"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
