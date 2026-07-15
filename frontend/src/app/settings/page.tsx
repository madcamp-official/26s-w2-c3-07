'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { useLocalSettings } from '@/features/settings/useLocalSettings';
import { api } from '@/lib/api-client';
import { AppHeader } from '@/components/layout/AppHeader';
import { ErrorState, LoadingState } from '@/components/ui/ApiState';
import type { UserSettings } from '@/types/auth';
import { ApiError } from '@/types/api';

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const local = useLocalSettings();
  const serverSettings = useApiResource<UserSettings>(profile ? '/auth/settings' : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!serverSettings.data) return;
    local.update({
      soundEnabled: serverSettings.data.soundEnabled,
      musicEnabled: serverSettings.data.musicEnabled,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSettings.data]);

  async function saveServerSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const soundEnabled = data.get('soundEnabled') === 'on';
      const musicEnabled = data.get('musicEnabled') === 'on';
      await api.patch('/auth/me', { displayName: data.get('displayName') });
      await api.patch('/auth/settings', { soundEnabled, musicEnabled });
      local.update({ soundEnabled, musicEnabled });
      await Promise.all([refreshProfile(), serverSettings.reload()]);
      setSaved(true);
    } catch (cause) {
      setError(cause as ApiError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100">
      <div className="mx-auto max-w-xl space-y-6">
        <AppHeader />
        <Link href={profile ? '/regions' : '/login'} className="text-sm opacity-70">← 돌아가기</Link>
        <header>
          <p className="text-xs text-evidence-red">SETTINGS</p>
          <h1 className="mt-2 font-display text-4xl">설정</h1>
        </header>

        {profile ? (
          serverSettings.loading ? (
            <LoadingState />
          ) : serverSettings.error ? (
            <ErrorState error={serverSettings.error} retry={serverSettings.reload} />
          ) : serverSettings.data && (
            <form onSubmit={saveServerSettings} className="space-y-5 border border-brass-600/30 p-5">
              <label className="block">
                탐정 이름
                <input
                  name="displayName"
                  defaultValue={profile.displayName ?? ''}
                  required
                  maxLength={50}
                  className="mt-1 w-full bg-noir-900 p-3"
                />
              </label>
              <div className="flex gap-6">
                <label>
                  <input name="soundEnabled" type="checkbox" defaultChecked={serverSettings.data.soundEnabled} /> 효과음
                </label>
                <label>
                  <input name="musicEnabled" type="checkbox" defaultChecked={serverSettings.data.musicEnabled} /> 음악
                </label>
              </div>
              {saved && <p className="text-sm text-brass-400">저장되었습니다.</p>}
              {error && <ErrorState error={error} />}
              <button disabled={saving} className="w-full bg-evidence-red px-5 py-2 font-bold">
                {saving ? '저장 중...' : '설정 저장'}
              </button>
            </form>
          )
        ) : (
          local.loaded && (
            <div className="space-y-5 border border-brass-600/30 p-5">
              <p className="text-sm opacity-60">로그인하면 닉네임 설정과 서버 저장이 가능합니다.</p>
              <div className="flex gap-6">
                <label>
                  <input
                    type="checkbox"
                    checked={local.settings.soundEnabled}
                    onChange={(event) => local.update({ soundEnabled: event.target.checked })}
                  /> 효과음
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={local.settings.musicEnabled}
                    onChange={(event) => local.update({ musicEnabled: event.target.checked })}
                  /> 음악
                </label>
              </div>
              <Link href="/login" className="block bg-evidence-red py-3 text-center font-bold">
                로그인하고 더 많은 설정 사용하기
              </Link>
            </div>
          )
        )}
      </div>
    </main>
  );
}
