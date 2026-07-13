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
    <label htmlFor={id} className="mb-2 block text-sm text-parchment-300">{label}</label>
    <div className="relative">
      <input
        id={id}
        name={name ?? id}
        required={required}
        minLength={minLength}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        className="w-full border border-brass-600/30 bg-noir-900/80 px-4 py-3 pr-16 text-sm text-parchment-100 placeholder:text-parchment-300/40 focus:border-brass-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-parchment-300/60 hover:text-parchment-100"
      >{visible ? '숨김' : '보기'}</button>
    </div>
  </div>;
}
