'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { workoutApi, Workout, ApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { ChevronLeft, ChevronRight, Dumbbell, Plus } from 'lucide-react'

export default function CalendarPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const fetchWorkouts = async () => {
      setLoading(true)
      try {
        const data = await workoutApi.getByMonth(year, month)
        setWorkouts(data)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchWorkouts()
  }, [year, month, router])

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1))
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(null)
  }

  // カレンダーの日付を生成
  const generateCalendarDays = () => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: (number | null)[] = []

    // 先月の日を埋める
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }

    // 今月の日
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const days = generateCalendarDays()
  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  // 日付に対応するワークアウトを取得
  const getWorkoutForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return workouts.find((w) => w.date.split('T')[0] === dateStr)
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

  const selectedWorkout = selectedDate
    ? workouts.find((w) => w.date.split('T')[0] === selectedDate)
    : null

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() + 1 &&
    year === today.getFullYear()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">カレンダー</h1>

        {/* 月選択 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-white">
                {year}年{month}月
              </h2>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                今日
              </button>
            </div>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white">読み込み中...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* カレンダーグリッド */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                {/* 曜日ヘッダー */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day, i) => (
                    <div
                      key={day}
                      className={`text-center text-sm font-medium py-2 ${
                        i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* 日付グリッド */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    if (day === null) {
                      return <div key={index} className="aspect-square" />
                    }

                    const workout = getWorkoutForDay(day)
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const isSelected = selectedDate === dateStr
                    const dayOfWeek = (index % 7)

                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : isToday(day)
                            ? 'bg-purple-500/30 text-white ring-2 ring-purple-500'
                            : workout
                            ? 'bg-green-500/20 text-white hover:bg-green-500/30'
                            : 'hover:bg-white/10 text-white'
                        }`}
                      >
                        <span
                          className={`text-sm ${
                            dayOfWeek === 0
                              ? 'text-red-400'
                              : dayOfWeek === 6
                              ? 'text-blue-400'
                              : ''
                          } ${isSelected || isToday(day) ? '!text-white' : ''}`}
                        >
                          {day}
                        </span>
                        {workout && (
                          <div className="absolute bottom-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 選択日の詳細 */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 sticky top-24">
                {selectedDate ? (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {new Date(selectedDate).toLocaleDateString('ja-JP', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                      })}
                    </h3>

                    {selectedWorkout ? (
                      <div>
                        <Link
                          href={`/workout/${selectedWorkout.id}`}
                          className="block p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors mb-4"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <Dumbbell className="h-5 w-5 text-purple-400" />
                            <span className="text-white font-medium">
                              {selectedWorkout.sets.length}セット
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {[...new Set(selectedWorkout.sets.map((s) => s.exercise?.muscle_group))]
                              .slice(0, 4)
                              .map(
                                (group) =>
                                  group && (
                                    <span
                                      key={group}
                                      className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded"
                                    >
                                      {muscleGroupLabels[group] || group}
                                    </span>
                                  )
                              )}
                          </div>
                        </Link>
                        <Link
                          href={`/workout/${selectedWorkout.id}`}
                          className="block w-full py-2 text-center text-purple-400 hover:text-purple-300 text-sm"
                        >
                          詳細を見る →
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">この日の記録はありません</p>
                        <Link
                          href={`/workout/new?date=${selectedDate}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          記録を追加
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">日付を選択してください</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 凡例 */}
        <div className="mt-6 flex items-center gap-6 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500/40 rounded" />
            <span className="text-gray-400">トレーニング記録あり</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500/40 rounded ring-2 ring-purple-500" />
            <span className="text-gray-400">今日</span>
          </div>
        </div>
      </main>
    </div>
  )
}

