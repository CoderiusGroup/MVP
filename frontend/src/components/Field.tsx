import type { ReactNode } from "react";

type BaseProps = {
  label: string;
  id: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
};

type InputProps = BaseProps & {
  type?: "text" | "email" | "number";
  placeholder?: string;
};

export function Field({
  label,
  id,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required,
}: InputProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        className="field__control"
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
      />
    </div>
  );
}

type SelectProps = BaseProps & {
  children: ReactNode;
};

export function SelectField({ label, id, name, defaultValue, required, children }: SelectProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        name={name}
        className="field__control"
        defaultValue={defaultValue}
        required={required}
      >
        {children}
      </select>
    </div>
  );
}
