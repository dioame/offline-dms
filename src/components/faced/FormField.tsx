import { type InputHTMLAttributes, type ReactNode } from "react";

type FormFieldProps = {
  label: string;
  number?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  number,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`faced-field ${className}`}>
      <label className="faced-label">
        {number && <span className="faced-field-num">{number}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className = "", ...props }: TextInputProps) {
  return <input className={`faced-input ${className}`} {...props} />;
}

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className = "", ...props }: TextAreaProps) {
  return <textarea className={`faced-input faced-textarea ${className}`} {...props} />;
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
            className="h-4 w-4 accent-[var(--faced-blue)]"
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
};

export function SelectInput({
  options,
  placeholder = "Select...",
  className = "",
  ...props
}: SelectInputProps) {
  return (
    <select className={`faced-input ${className}`} {...props}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
