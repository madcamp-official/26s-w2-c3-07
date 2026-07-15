import type { InputHTMLAttributes } from "react";

type AuthTextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function AuthTextField({ label, id, ...props }: AuthTextFieldProps) {
  return (
    <div className="text-left">
      <label htmlFor={id} className="mb-2 block text-sm text-noir-900/80">
        {label}
      </label>
      <input
        id={id}
        className="w-full border border-noir-900/30 bg-parchment-100/40 px-4 py-3 text-sm text-noir-900 placeholder:text-noir-900/40 focus:border-evidence-red focus:outline-none"
        {...props}
      />
    </div>
  );
}
