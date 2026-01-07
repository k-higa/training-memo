'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { exerciseApi, Exercise, ApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { Plus, Edit2, Trash2, X, Check, Dumbbell, ChevronDown } from 'lucide-react'

export default function ExercisesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [customExercises, setCustomExercises] = useState<Exercise[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [formData, setFormData] = useState({ name: '', muscle_group: 'chest' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('')

  const muscleGroups = [
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

    fetchExercises()
  }, [router])

  const fetchExercises = async () => {
    try {
      const [allExercises, customData] = await Promise.all([
        exerciseApi.getAll(),
        exerciseApi.getCustom(),
      ])
      setExercises(allExercises.filter((e) => !e.is_custom))
      setCustomExercises(customData)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (exercise?: Exercise) => {
    if (exercise) {
      setEditingExercise(exercise)
      setFormData({ name: exercise.name, muscle_group: exercise.muscle_group })
    } else {
      setEditingExercise(null)
      setFormData({ name: '', muscle_group: 'chest' })
    }
    setError('')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingExercise(null)
    setFormData({ name: '', muscle_group: 'chest' })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('種目名を入力してください')
      return
    }

    setSaving(true)
    try {
      if (editingExercise) {
        await exerciseApi.updateCustom(editingExercise.id, formData)
      } else {
        await exerciseApi.createCustom(formData)
      }
      await fetchExercises()
      handleCloseModal()
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

  const handleDelete = async (exercise: Exercise) => {
    if (!confirm(`「${exercise.name}」を削除しますか？`)) {
      return
    }

    try {
      await exerciseApi.deleteCustom(exercise.id)
      await fetchExercises()
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message === 'exercise is in use' 
          ? 'この種目はトレーニング記録で使用されているため削除できません'
          : err.message)
      }
    }
  }

  const filteredExercises = selectedMuscleGroup
    ? exercises.filter((e) => e.muscle_group === selectedMuscleGroup)
    : exercises

  const filteredCustomExercises = selectedMuscleGroup
    ? customExercises.filter((e) => e.muscle_group === selectedMuscleGroup)
    : customExercises

  // 部位ごとにグループ化
  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    const group = muscleGroupLabels[exercise.muscle_group] || exercise.muscle_group
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(exercise)
    return acc
  }, {} as Record<string, Exercise[]>)

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
          <h1 className="text-2xl font-bold text-white">種目管理</h1>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            カスタム種目を追加
          </button>
        </div>

        {/* フィルター */}
        <div className="mb-6">
          <div className="relative inline-block">
            <select
              value={selectedMuscleGroup}
              onChange={(e) => setSelectedMuscleGroup(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="" className="bg-slate-800">
                すべての部位
              </option>
              {muscleGroups.map((group) => (
                <option key={group.value} value={group.value} className="bg-slate-800">
                  {group.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* カスタム種目 */}
        {filteredCustomExercises.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs rounded">
                カスタム
              </span>
              あなたの種目
            </h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 divide-y divide-white/10">
              {filteredCustomExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between p-4 hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{exercise.name}</p>
                      <p className="text-gray-400 text-sm">
                        {muscleGroupLabels[exercise.muscle_group] || exercise.muscle_group}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(exercise)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exercise)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* プリセット種目 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">プリセット種目</h2>
          <div className="space-y-4">
            {Object.entries(groupedExercises).map(([group, groupExercises]) => (
              <div key={group}>
                <h3 className="text-sm font-medium text-gray-400 mb-2 px-2">{group}</h3>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 divide-y divide-white/10">
                  {groupExercises.map((exercise) => (
                    <div key={exercise.id} className="flex items-center gap-3 p-4">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-white">{exercise.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingExercise ? '種目を編集' : 'カスタム種目を追加'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">種目名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: ダンベルプレス"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">部位</label>
                <div className="relative">
                  <select
                    value={formData.muscle_group}
                    onChange={(e) => setFormData({ ...formData, muscle_group: e.target.value })}
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

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="h-4 w-4" />
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

