'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { PasswordField } from '@/components/auth/PasswordField';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiError } from '@/types/api';

export function SignupPanel() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const values = new FormData(event.currentTarget);
    const password = String(values.get('password'));
    if (password !== String(values.get('passwordConfirm'))) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await signUp(String(values.get('email')), password, String(values.get('displayName')));
      router.replace('/regions');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="relative w-full max-w-sm p-8">
    <h1 className="mb-8 text-center font-display text-2xl text-noir-900">수사관 등록</h1>
    <form className="space-y-5" onSubmit={submit}>
      <AuthTextField id="displayName" name="displayName" type="text" label="탐정 이름" required maxLength={50} />
      <AuthTextField id="email" name="email" type="email" label="이메일" required autoComplete="email" />
      <PasswordField id="password" name="password" required minLength={6} />
      <PasswordField id="passwordConfirm" name="passwordConfirm" required minLength={6} label="비밀번호 확인" />
      {error && <p role="alert" className="border border-evidence-red/50 bg-evidence-red/10 p-3 text-sm font-medium text-noir-900">{error}</p>}
      <button disabled={submitting} type="submit" className="w-full bg-evidence-red py-3.5 font-display font-bold text-parchment-100 disabled:opacity-50">{submitting ? '등록 중...' : '수사관 등록하기'}</button>
    </form>
    <p className="mt-6 text-center text-sm font-medium text-noir-900/80">이미 등록하셨나요? <Link href="/login" className="font-bold text-evidence-red hover:underline">신원 확인하기</Link></p>
  </div>;
}
