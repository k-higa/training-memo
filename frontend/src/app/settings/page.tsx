'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { authApi, ApiError } from '@/lib/api'
import { isAuthenticated, removeToken } from '@/lib/auth'
import { AlertTriangle, ChevronRight, FileText, Shield } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'confirm' | 'deleting'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    }
  }, [router])

  const handleDeleteAccount = async () => {
    setStep('deleting')
    setError(null)
    try {
      await authApi.deleteAccount()
      removeToken()
      router.push('/?deleted=1')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login')
        return
      }
      setError(err instanceof Error ? err.message : 'アカウントの削除に失敗しました')
      setStep('confirm')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">設定</h1>

        {/* 法的情報 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">法的情報</h2>
          </div>
          <div className="divide-y divide-white/10">
            <Link
              href="/terms"
              className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="text-white">利用規約</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </Link>
            <Link
              href="/privacy"
              className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <span className="text-white">プライバシーポリシー</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </Link>
          </div>
        </div>

        {/* 危険ゾーン */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-red-500/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-500/20">
            <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider">アカウント</h2>
          </div>
          <div className="p-6">
            {step === 'idle' && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white font-medium mb-1">アカウントを削除する</p>
                  <p className="text-gray-400 text-sm">
                    アカウントとすべてのデータ（トレーニング記録・体重記録・メニューなど）が完全に削除されます。この操作は取り消せません。
                  </p>
                </div>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-shrink-0 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-medium"
                >
                  退会する
                </button>
              </div>
            )}

            {(step === 'confirm' || step === 'deleting') && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-medium mb-1">本当に退会しますか？</p>
                    <ul className="text-red-400/80 text-sm space-y-1">
                      <li>・ すべてのトレーニング記録が削除されます</li>
                      <li>・ 体重記録が削除されます</li>
                      <li>・ 作成したメニューが削除されます</li>
                      <li>・ カスタム種目が削除されます</li>
                      <li>・ この操作は取り消せません</li>
                    </ul>
                  </div>
                </div>

                {error && (
                  <p className="text-red-300 text-sm">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep('idle'); setError(null) }}
                    disabled={step === 'deleting'}
                    className="flex-1 py-3 bg-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/20 transition-colors border border-white/20 disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={step === 'deleting'}
                    className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {step === 'deleting' ? '削除中...' : '退会して全データを削除'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
