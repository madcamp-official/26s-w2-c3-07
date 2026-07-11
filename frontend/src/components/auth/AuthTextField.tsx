import type { InputHTMLAttributes } from "react";

type AuthTextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function AuthTextField({ label, id, ...props }: AuthTextFieldProps) {
  return (
    <div className="text-left">
      <label htmlFor={id} className="mb-2 block text-sm text-parchment-300">
        {label}
      </label>
      <input
        id={id}
        className="w-full border border-brass-600/30 bg-noir-900/80 px-4 py-3 text-sm text-parchment-100 placeholder:text-parchment-300/40 focus:border-brass-400 focus:outline-none"
        {...props}
      />
    </div>
  );
}
