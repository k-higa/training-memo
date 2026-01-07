'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { workoutApi, Workout, ApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { ArrowLeft, Calendar, Dumbbell, Trash2, Edit } from 'lucide-react'

export default function WorkoutDetailPage() {
  const router = useRouter()
  const params = useParams()
  const workoutId = parseInt(params.id as string, 10)

  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

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

    const fetchWorkout = async () => {
      try {
        const data = await workoutApi.getById(workoutId)
        setWorkout(data)
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 401) {
            router.push('/login')
          } else if (error.status === 404) {
            router.push('/dashboard')
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchWorkout()
  }, [workoutId, router])

  const handleDelete = async () => {
    if (!confirm('このトレーニング記録を削除しますか？')) {
      return
    }

    setDeleting(true)
    try {
      await workoutApi.delete(workoutId)
      router.push('/dashboard')
    } catch (error) {
      alert('削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
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

  if (!workout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-white">トレーニングが見つかりません</div>
        </div>
      </div>
    )
  }

  // セットを種目ごとにグループ化
  const groupedSets = workout.sets.reduce((acc, set) => {
    const exerciseName = set.exercise?.name || '不明な種目'
    if (!acc[exerciseName]) {
      acc[exerciseName] = {
        muscleGroup: set.exercise?.muscle_group || 'other',
        sets: [],
      }
    }
    acc[exerciseName].sets.push(set)
    return acc
  }, {} as Record<string, { muscleGroup: string; sets: typeof workout.sets }>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 戻るボタン */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          ダッシュボードに戻る
        </Link>

        {/* ヘッダー */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{formatDate(workout.date)}</h1>
                <p className="text-gray-400 text-sm">{workout.sets.length}セット記録</p>
              </div>
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>

          {/* 部位タグ */}
          <div className="flex flex-wrap gap-2">
            {[...new Set(workout.sets.map((s) => s.exercise?.muscle_group))].map(
              (group) =>
                group && (
                  <span
                    key={group}
                    className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full"
                  >
                    {muscleGroupLabels[group] || group}
                  </span>
                )
            )}
          </div>
        </div>

        {/* 種目ごとのセット */}
        <div className="space-y-4">
          {Object.entries(groupedSets).map(([exerciseName, { muscleGroup, sets }]) => (
            <div
              key={exerciseName}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{exerciseName}</h3>
                  <span className="text-xs text-gray-400">
                    {muscleGroupLabels[muscleGroup] || muscleGroup}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {sets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((set) => (
                    <div
                      key={set.id}
                      className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg"
                    >
                      <span className="text-gray-400 text-sm">セット {set.set_number}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-white">
                          <span className="text-lg font-semibold">{set.weight}</span>
                          <span className="text-gray-400 text-sm ml-1">kg</span>
                        </span>
                        <span className="text-gray-400">×</span>
                        <span className="text-white">
                          <span className="text-lg font-semibold">{set.reps}</span>
                          <span className="text-gray-400 text-sm ml-1">回</span>
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* メモ */}
        {workout.memo && (
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-2">メモ</h3>
            <p className="text-white whitespace-pre-wrap">{workout.memo}</p>
          </div>
        )}
      </main>
    </div>
  )
}

