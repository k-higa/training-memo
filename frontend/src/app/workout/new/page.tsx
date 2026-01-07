'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { exerciseApi, workoutApi, Exercise, ApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { Plus, Trash2, Save, Dumbbell, ChevronDown } from 'lucide-react'

interface SetInput {
  id: string
  exerciseId: number
  setNumber: number
  weight: string
  reps: string
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [memo, setMemo] = useState('')
  const [sets, setSets] = useState<SetInput[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [existingWorkoutId, setExistingWorkoutId] = useState<number | null>(null)

  const muscleGroups = [
    { value: '', label: 'すべて' },
    { value: 'chest', label: '胸' },
    { value: 'back', label: '背中' },
    { value: 'shoulders', label: '肩' },
    { value: 'arms', label: '腕' },
    { value: 'legs', label: '脚' },
    { value: 'abs', label: '腹筋' },
    { value: 'other', label: 'その他' },
  ]

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const fetchExercises = async () => {
      try {
        const data = await exerciseApi.getAll()
        setExercises(data)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchExercises()
  }, [router])

  const filteredExercises = selectedMuscleGroup
    ? exercises.filter((e) => e.muscle_group === selectedMuscleGroup)
    : exercises

  const addSet = () => {
    const newSet: SetInput = {
      id: crypto.randomUUID(),
      exerciseId: filteredExercises[0]?.id || 0,
      setNumber: sets.length + 1,
      weight: '',
      reps: '',
    }
    setSets([...sets, newSet])
  }

  const updateSet = (id: string, field: keyof SetInput, value: string | number) => {
    setSets(sets.map((set) => (set.id === id ? { ...set, [field]: value } : set)))
  }

  const removeSet = (id: string) => {
    const newSets = sets.filter((set) => set.id !== id)
    // セット番号を振り直す
    setSets(newSets.map((set, index) => ({ ...set, setNumber: index + 1 })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (sets.length === 0) {
      setError('少なくとも1つのセットを追加してください')
      return
    }

    const invalidSets = sets.filter(
      (set) => !set.exerciseId || !set.weight || !set.reps
    )
    if (invalidSets.length > 0) {
      setError('すべてのセットに種目、重量、回数を入力してください')
      return
    }

    setSaving(true)

    try {
      await workoutApi.create({
        date,
        memo: memo || undefined,
        sets: sets.map((set) => ({
          exercise_id: set.exerciseId,
          set_number: set.setNumber,
          weight: parseFloat(set.weight),
          reps: parseInt(set.reps, 10),
        })),
      })
      router.push('/dashboard')
    } catch (err) {
      if (err instanceof ApiError) {
        // 重複エラーの場合
        if (err.message.includes('Duplicate entry') || err.message.includes('uk_workouts_user_date')) {
          setError('この日付には既にトレーニング記録があります')
          // 既存のワークアウトを取得
          try {
            const existing = await workoutApi.getByDate(date)
            setExistingWorkoutId(existing.id)
          } catch {
            // 取得に失敗した場合は無視
          }
        } else {
          setError(err.message)
        }
      } else {
        setError('保存に失敗しました')
      }
    } finally {
      setSaving(false)
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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">トレーニング記録</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 日付 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-2">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setError('')
                setExistingWorkoutId(null)
              }}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* 部位フィルター */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              部位でフィルター
            </label>
            <div className="relative">
              <select
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {muscleGroups.map((group) => (
                  <option key={group.value} value={group.value} className="bg-slate-800">
                    {group.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* セット一覧 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">セット</h2>
              <button
                type="button"
                onClick={addSet}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                セットを追加
              </button>
            </div>

            {sets.length === 0 ? (
              <div className="p-8 bg-white/5 rounded-2xl border border-white/10 text-center">
                <Dumbbell className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">セットを追加してトレーニングを記録しましょう</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sets.map((set, index) => (
                  <div
                    key={set.id}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-purple-400">
                        セット {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSet(set.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">種目</label>
                        <select
                          value={set.exerciseId}
                          onChange={(e) =>
                            updateSet(set.id, 'exerciseId', parseInt(e.target.value, 10))
                          }
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value={0} className="bg-slate-800">
                            選択してください
                          </option>
                          {filteredExercises.map((exercise) => (
                            <option
                              key={exercise.id}
                              value={exercise.id}
                              className="bg-slate-800"
                            >
                              {exercise.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">重量 (kg)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={set.weight}
                          onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">回数</label>
                        <input
                          type="number"
                          min="1"
                          value={set.reps}
                          onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* メモ */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              メモ（オプション）
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="今日のトレーニングについてメモを残せます"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200">{error}</p>
              {existingWorkoutId && (
                <button
                  type="button"
                  onClick={() => router.push(`/workout/${existingWorkoutId}`)}
                  className="mt-3 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                >
                  既存の記録を編集する
                </button>
              )}
            </div>
          )}

          {/* 保存ボタン */}
          <button
            type="submit"
            disabled={saving || sets.length === 0}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save className="h-5 w-5" />
            {saving ? '保存中...' : 'トレーニングを保存'}
          </button>
        </form>
      </main>
    </div>
  )
}

