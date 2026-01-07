'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { workoutApi, Workout, ApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { Calendar, Dumbbell, ChevronRight, ChevronLeft } from 'lucide-react'

export default function HistoryPage() {
  const router = useRouter()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const perPage = 10

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

    const fetchWorkouts = async () => {
      setLoading(true)
      try {
        const response = await workoutApi.getList(page, perPage)
        setWorkouts(response.workouts)
        setTotalPages(response.total_pages)
        setTotal(response.total)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchWorkouts()
  }, [page, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }

  // 月ごとにグループ化
  const groupedWorkouts = workouts.reduce((acc, workout) => {
    const date = new Date(workout.date)
    const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`
    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(workout)
    return acc
  }, {} as Record<string, Workout[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">トレーニング履歴</h1>
            <p className="text-gray-400 text-sm mt-1">全{total}件の記録</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white">読み込み中...</div>
          </div>
        ) : workouts.length === 0 ? (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
            <Dumbbell className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              まだトレーニング記録がありません
            </h3>
            <p className="text-gray-400 mb-6">
              最初のトレーニングを記録して、成長を追跡しましょう！
            </p>
            <Link
              href="/workout/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              トレーニングを記録する
            </Link>
          </div>
        ) : (
          <>
            {/* 月ごとのグループ */}
            <div className="space-y-6">
              {Object.entries(groupedWorkouts).map(([month, monthWorkouts]) => (
                <div key={month}>
                  <h2 className="text-sm font-medium text-gray-400 mb-3 px-2">{month}</h2>
                  <div className="space-y-2">
                    {monthWorkouts.map((workout) => (
                      <Link
                        key={workout.id}
                        href={`/workout/${workout.id}`}
                        className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:border-purple-500/50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                            <Dumbbell className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{formatDate(workout.date)}</p>
                            <p className="text-gray-400 text-sm">{workout.sets.length}セット</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex gap-1">
                            {[...new Set(workout.sets.map((s) => s.exercise?.muscle_group))]
                              .slice(0, 3)
                              .map(
                                (group) =>
                                  group && (
                                    <span
                                      key={group}
                                      className="px-2 py-1 bg-white/10 text-gray-300 text-xs rounded"
                                    >
                                      {muscleGroupLabels[group] || group}
                                    </span>
                                  )
                              )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  前へ
                </button>
                <span className="text-gray-400">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                >
                  次へ
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

