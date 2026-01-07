'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { workoutApi, Workout, ApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { Plus, Calendar, TrendingUp, Dumbbell, ChevronRight } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null)
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        // 今日のワークアウトを取得
        const today = new Date().toISOString().split('T')[0]
        try {
          const workout = await workoutApi.getByDate(today)
          setTodayWorkout(workout)
        } catch {
          // 今日のワークアウトがない場合は無視
        }

        // 最近のワークアウトを取得
        const response = await workoutApi.getList(1, 5)
        setRecentWorkouts(response.workouts)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }

  const muscleGroupLabels: Record<string, string> = {
    chest: '胸',
    back: '背中',
    shoulders: '肩',
    arms: '腕',
    legs: '脚',
    abs: '腹筋',
    other: 'その他',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* ウェルカムセクション */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">ダッシュボード</h1>
          <p className="text-gray-400">今日もトレーニングを頑張りましょう！</p>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/workout/new"
            className="flex items-center gap-4 p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all group"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">トレーニングを記録</h3>
              <p className="text-white/70 text-sm">今日のワークアウトを記録</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/50 ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/history"
            className="flex items-center gap-4 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all group"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">履歴を見る</h3>
              <p className="text-gray-400 text-sm">過去の記録を確認</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500 ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="flex items-center gap-4 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {recentWorkouts.length}回
              </h3>
              <p className="text-gray-400 text-sm">トレーニング記録数</p>
            </div>
          </div>
        </div>

        {/* 今日のトレーニング */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">今日のトレーニング</h2>
          {todayWorkout ? (
            <Link
              href={`/workout/${todayWorkout.id}`}
              className="block p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{formatDate(todayWorkout.date)}</p>
                    <p className="text-gray-400 text-sm">{todayWorkout.sets.length}セット</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[...new Set(todayWorkout.sets.map((s) => s.exercise?.muscle_group))].map(
                  (group) =>
                    group && (
                      <span
                        key={group}
                        className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                      >
                        {muscleGroupLabels[group] || group}
                      </span>
                    )
                )}
              </div>
            </Link>
          ) : (
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
              <p className="text-gray-400 mb-4">まだ今日のトレーニングが記録されていません</p>
              <Link
                href="/workout/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                記録を始める
              </Link>
            </div>
          )}
        </div>

        {/* 最近のトレーニング */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">最近のトレーニング</h2>
            <Link href="/history" className="text-purple-400 hover:text-purple-300 text-sm">
              すべて見る
            </Link>
          </div>
          {recentWorkouts.length > 0 ? (
            <div className="space-y-3">
              {recentWorkouts.map((workout) => (
                <Link
                  key={workout.id}
                  href={`/workout/${workout.id}`}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{formatDate(workout.date)}</p>
                      <p className="text-gray-400 text-sm">{workout.sets.length}セット</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[...new Set(workout.sets.map((s) => s.exercise?.muscle_group))]
                        .slice(0, 3)
                        .map(
                          (group) =>
                            group && (
                              <span
                                key={group}
                                className="px-2 py-0.5 bg-white/10 text-gray-300 text-xs rounded"
                              >
                                {muscleGroupLabels[group] || group}
                              </span>
                            )
                        )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
              <p className="text-gray-400">まだトレーニング記録がありません</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

