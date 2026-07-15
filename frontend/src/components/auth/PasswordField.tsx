'use client';

import { useState } from 'react';

type PasswordFieldProps = {
  id?: string;
  label?: string;
  placeholder?: string;
  name?: string;
  required?: boolean;
  minLength?: number;
};

export function PasswordField({ id = 'password', label = '비밀번호', placeholder = '비밀번호를 입력하세요', name, required, minLength }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return <div className="text-left">
    <label htmlFor={id} className="mb-2 block text-sm text-noir-900/80">{label}</label>
    <div className="relative">
      <input
        id={id}
        name={name ?? id}
        required={required}
        minLength={minLength}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        className="w-full border border-noir-900/30 bg-parchment-100/40 px-4 py-3 pr-16 text-sm text-noir-900 placeholder:text-noir-900/40 focus:border-evidence-red focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-noir-900/60 hover:text-noir-900"
      >{visible ? '숨김' : '보기'}</button>
    </div>
  </div>;
}
