'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import {
  statsApi,
  exerciseApi,
  MuscleGroupStat,
  PersonalBest,
  ExerciseProgress,
  Exercise,
  ApiError,
} from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { Trophy, TrendingUp, Target, ChevronDown } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

export default function StatsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [muscleGroupStats, setMuscleGroupStats] = useState<MuscleGroupStat[]>([])
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null)
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>([])
  const [loadingProgress, setLoadingProgress] = useState(false)

  const muscleGroupLabels: Record<string, string> = {
    chest: '胸',
    back: '背中',
    shoulders: '肩',
    arms: '腕',
    legs: '脚',
    abs: '腹筋',
    other: 'その他',
  }

  const muscleGroupColors: Record<string, string> = {
    chest: '#ef4444',
    back: '#3b82f6',
    shoulders: '#22c55e',
    arms: '#f59e0b',
    legs: '#8b5cf6',
    abs: '#ec4899',
    other: '#6b7280',
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        const [statsData, bestsData, exercisesData] = await Promise.all([
          statsApi.getMuscleGroupStats(),
          statsApi.getPersonalBests(),
          exerciseApi.getAll(),
        ])
        setMuscleGroupStats(statsData)
        setPersonalBests(bestsData)
        setExercises(exercisesData)
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

  const handleExerciseSelect = async (value: string) => {
    if (!value) {
      setSelectedExercise(null)
      setExerciseProgress([])
      return
    }
    const exerciseId = parseInt(value, 10)
    setSelectedExercise(exerciseId)
    setLoadingProgress(true)
    try {
      const data = await exerciseApi.getProgress(exerciseId)
      setExerciseProgress(data || [])
    } catch (error) {
      console.error('Failed to fetch progress', error)
    } finally {
      setLoadingProgress(false)
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

  // 部位別統計のチャートデータ
  const muscleChartData = (muscleGroupStats || []).map((stat) => ({
    name: muscleGroupLabels[stat.muscle_group] || stat.muscle_group,
    workouts: stat.workout_count,
    sets: stat.set_count,
    color: muscleGroupColors[stat.muscle_group] || '#6b7280',
  }))

  // 種目別自己ベストをグループ化
  const groupedBests = (personalBests || []).reduce((acc, best) => {
    const group = muscleGroupLabels[best.muscle_group] || best.muscle_group
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(best)
    return acc
  }, {} as Record<string, PersonalBest[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold text-white mb-6">統計・分析</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 部位別トレーニング回数 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">部位別トレーニング</h2>
            </div>

            {muscleChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={muscleChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" width={60} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number, name: string) => [
                        value,
                        name === 'workouts' ? '日数' : 'セット数',
                      ]}
                    />
                    <Bar dataKey="workouts" name="日数" radius={[0, 4, 4, 0]}>
                      {muscleChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                データがありません
              </div>
            )}
          </div>

          {/* 自己ベスト */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-yellow-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">自己ベスト</h2>
            </div>

            {Object.keys(groupedBests).length > 0 ? (
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {Object.entries(groupedBests).map(([group, bests]) => (
                  <div key={group}>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">{group}</h3>
                    <div className="space-y-2">
                      {bests.map((best) => (
                        <div
                          key={best.exercise_id}
                          className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg"
                        >
                          <span className="text-white text-sm">{best.exercise_name}</span>
                          <span className="text-yellow-400 font-semibold">
                            {best.max_weight}kg
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                データがありません
              </div>
            )}
          </div>

          {/* 種目別推移グラフ */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">種目別重量推移</h2>
              </div>

              <div className="relative">
                <select
                  value={selectedExercise || ''}
                  onChange={(e) => handleExerciseSelect(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" className="bg-slate-800">
                    種目を選択
                  </option>
                  {exercises.map((exercise) => (
                    <option key={exercise.id} value={exercise.id} className="bg-slate-800">
                      {exercise.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {loadingProgress ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                読み込み中...
              </div>
            ) : exerciseProgress && exerciseProgress.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exerciseProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getMonth() + 1}/${date.getDate()}`
                      }}
                    />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      labelFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString('ja-JP')
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'max_weight' ? `${value}kg` : value,
                        name === 'max_weight' ? '最大重量' : '総ボリューム',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="max_weight"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                {selectedExercise ? 'この種目のデータがありません' : '種目を選択してください'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

