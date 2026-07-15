'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { PasswordField } from '@/components/auth/PasswordField';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiError } from '@/types/api';

export function LoginPanel() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const values = new FormData(event.currentTarget);
    setSubmitting(true);
    setError('');
    try {
      await signIn(String(values.get('email')), String(values.get('password')));
      router.replace(new URLSearchParams(window.location.search).get('next') || '/regions');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="relative w-full max-w-sm p-8">
    <h1 className="mb-8 text-center font-display text-2xl text-noir-900">수사관 신원 확인</h1>
    <form className="space-y-5" onSubmit={submit}>
      <AuthTextField id="email" name="email" type="email" label="이메일" autoComplete="email" required placeholder="detective@example.com" />
      <PasswordField name="password" required minLength={6} />
      {error && <p role="alert" className="border border-evidence-red/50 bg-evidence-red/10 p-3 text-sm font-medium text-noir-900">{error}</p>}
      <button disabled={submitting} type="submit" className="w-full bg-evidence-red py-3.5 font-display font-bold text-parchment-100 disabled:opacity-50">{submitting ? '확인 중...' : '신원 확인'}</button>
    </form>
    <p className="mt-6 text-center text-sm font-medium text-noir-900/80">아직 등록하지 않으셨나요? <Link href="/signup" className="font-bold text-evidence-red hover:underline">수사관 등록하기</Link></p>
    <p className="mt-4 text-center text-xs font-medium text-noir-900/50">Google 로그인은 준비 중입니다.</p>
  </div>;
}
