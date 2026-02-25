'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { menuApi, Menu, ApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { Plus, Dumbbell, Trash2, Edit, ChevronRight, Sparkles } from 'lucide-react'

export default function MenusPage() {
  const router = useRouter()
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)

  const muscleGroupLabels: Record<string, string> = {
    chest: '胸',
    back: '背中',
    shoulders: '肩',
    arms: '腕',
    legs: '脚',
    abs: '腹筋',
    other: 'その他',
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const fetchMenus = async () => {
      try {
        const data = await menuApi.getAll()
        setMenus(data || [])
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchMenus()
  }, [router])

  const handleDelete = async (menuId: number) => {
    if (!confirm('このメニューを削除しますか？')) {
      return
    }

    try {
      await menuApi.delete(menuId)
      setMenus(menus.filter((m) => m.id !== menuId))
    } catch (error) {
      alert('削除に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-white">読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">メニュー管理</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/menus/ai-generate"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              AIで作成
            </Link>
            <Link
              href="/menus/new"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              <Plus className="h-4 w-4" />
              手動で作成
            </Link>
          </div>
        </div>

        {menus.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
            <Dumbbell className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">メニューがありません</h2>
            <p className="text-gray-400 mb-6">
              トレーニングメニューを作成して、効率的にワークアウトを記録しましょう
            </p>
            <Link
              href="/menus/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              最初のメニューを作成
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {menus.map((menu) => {
              const muscleGroups = [
                ...new Set(menu.items?.map((item) => item.exercise?.muscle_group) || []),
              ].filter(Boolean)

              return (
                <div
                  key={menu.id}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{menu.name}</h3>
                      {menu.description && (
                        <p className="text-gray-400 text-sm mb-2">{menu.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {muscleGroups.map((group) => (
                          <span
                            key={group}
                            className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded"
                          >
                            {muscleGroupLabels[group as string] || group}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {menu.items?.length || 0}種目 · {menu.items?.reduce((sum, item) => sum + (item.target_sets || 0), 0) || 0}セット
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/menus/${menu.id}/edit`}
                        className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(menu.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* 種目リスト */}
                  {menu.items && menu.items.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {menu.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg"
                        >
                          <span className="text-white text-sm">
                            {item.exercise?.name || '不明な種目'}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {item.target_weight ? `${item.target_weight}kg × ` : ''}
                            {item.target_reps}回 × {item.target_sets}セット
                          </span>
                        </div>
                      ))}
                      {menu.items.length > 3 && (
                        <p className="text-gray-500 text-xs text-center">
                          +{menu.items.length - 3}種目
                        </p>
                      )}
                    </div>
                  )}

                  {/* メニューから記録開始ボタン */}
                  <Link
                    href={`/workout/new?menu=${menu.id}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    このメニューで記録開始
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

