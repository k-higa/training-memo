'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { workoutApi, exerciseApi, Workout, Exercise, ApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { ArrowLeft, Calendar, Dumbbell, Trash2, Edit, Save, X, Plus, ChevronDown } from 'lucide-react'

interface EditSetInput {
  id: string
  exerciseId: number
  setNumber: number
  weight: string
  reps: string
  isNew?: boolean
}

export default function WorkoutDetailPage() {
  const router = useRouter()
  const params = useParams()
  const workoutId = parseInt(params.id as string, 10)

  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 編集用の状態
  const [editSets, setEditSets] = useState<EditSetInput[]>([])
  const [editMemo, setEditMemo] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('')

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

    const fetchData = async () => {
      try {
        const [workoutData, exercisesData] = await Promise.all([
          workoutApi.getById(workoutId),
          exerciseApi.getAll(),
        ])
        setWorkout(workoutData)
        setExercises(exercisesData)
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

    fetchData()
  }, [workoutId, router])

  const startEditing = () => {
    if (!workout) return
    setEditSets(
      workout.sets.map((set) => ({
        id: String(set.id),
        exerciseId: set.exercise_id,
        setNumber: set.set_number,
        weight: String(set.weight),
        reps: String(set.reps),
      }))
    )
    setEditMemo(workout.memo || '')
    setIsEditing(true)
    setError('')
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditSets([])
    setEditMemo('')
    setError('')
  }

  const addSet = () => {
    const filteredExercises = selectedMuscleGroup
      ? exercises.filter((e) => e.muscle_group === selectedMuscleGroup)
      : exercises
    const newSet: EditSetInput = {
      id: `new-${Date.now()}`,
      exerciseId: filteredExercises[0]?.id || exercises[0]?.id || 0,
      setNumber: editSets.length + 1,
      weight: '',
      reps: '',
      isNew: true,
    }
    setEditSets([...editSets, newSet])
  }

  const updateSet = (id: string, field: keyof EditSetInput, value: string | number) => {
    setEditSets(editSets.map((set) => (set.id === id ? { ...set, [field]: value } : set)))
  }

  const removeSet = (id: string) => {
    const newSets = editSets.filter((set) => set.id !== id)
    setEditSets(newSets.map((set, index) => ({ ...set, setNumber: index + 1 })))
  }

  const handleSave = async () => {
    setError('')

    if (editSets.length === 0) {
      setError('少なくとも1つのセットを追加してください')
      return
    }

    const invalidSets = editSets.filter(
      (set) => !set.exerciseId || !set.weight || !set.reps
    )
    if (invalidSets.length > 0) {
      setError('すべてのセットに種目、重量、回数を入力してください')
      return
    }

    setSaving(true)
    try {
      const updated = await workoutApi.update(workoutId, {
        memo: editMemo || undefined,
        sets: editSets.map((set) => ({
          exercise_id: set.exerciseId,
          set_number: set.setNumber,
          weight: parseFloat(set.weight),
          reps: parseInt(set.reps, 10),
        })),
      })
      setWorkout(updated)
      setIsEditing(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('保存に失敗しました')
      }
    } finally {
      setSaving(false)
    }
  }

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

  const filteredExercises = selectedMuscleGroup
    ? exercises.filter((e) => e.muscle_group === selectedMuscleGroup)
    : exercises

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

  // セットを種目ごとにグループ化（閲覧モード用）
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
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <button
                    onClick={startEditing}
                    className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
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

        {/* 編集モード */}
        {isEditing ? (
          <div className="space-y-6">
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

            {/* セット編集 */}
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

              {editSets.length === 0 ? (
                <div className="p-8 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <Dumbbell className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">セットを追加してください</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {editSets.map((set, index) => (
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

            {/* メモ編集 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                メモ（オプション）
              </label>
              <textarea
                value={editMemo}
                onChange={(e) => setEditMemo(e.target.value)}
                rows={3}
                placeholder="トレーニングについてメモを残せます"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {/* 編集アクションボタン */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelEditing}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || editSets.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Save className="h-5 w-5" />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 閲覧モード：種目ごとのセット */}
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

            {/* 編集ボタン（下部） */}
            <button
              onClick={startEditing}
              className="mt-6 w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <Edit className="h-5 w-5" />
              このトレーニングを編集
            </button>
          </>
        )}
      </main>
    </div>
  )
}
