'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { menuApi, exerciseApi, Exercise, Menu, ApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { ArrowLeft, Plus, Trash2, Save, GripVertical, ChevronDown } from 'lucide-react'

interface MenuItemInput {
  id: string
  exerciseId: number
  targetSets: string
  targetReps: string
  targetWeight: string
  note: string
}

export default function EditMenuPage() {
  const router = useRouter()
  const params = useParams()
  const menuId = parseInt(params.id as string, 10)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<MenuItemInput[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

    const fetchData = async () => {
      try {
        const [menuData, exercisesData] = await Promise.all([
          menuApi.getById(menuId),
          exerciseApi.getAll(),
        ])

        setName(menuData.name)
        setDescription(menuData.description || '')
        setExercises(exercisesData)

        // 既存のアイテムを編集用形式に変換
        const menuItems: MenuItemInput[] = (menuData.items || []).map((item) => ({
          id: String(item.id),
          exerciseId: item.exercise_id,
          targetSets: String(item.target_sets),
          targetReps: String(item.target_reps),
          targetWeight: item.target_weight ? String(item.target_weight) : '',
          note: item.note || '',
        }))
        setItems(menuItems)
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 401) {
            router.push('/login')
          } else if (error.status === 404) {
            router.push('/menus')
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [menuId, router])

  const filteredExercises = selectedMuscleGroup
    ? exercises.filter((e) => e.muscle_group === selectedMuscleGroup)
    : exercises

  const addItem = () => {
    const newItem: MenuItemInput = {
      id: `new-${Date.now()}`,
      exerciseId: filteredExercises[0]?.id || exercises[0]?.id || 0,
      targetSets: '3',
      targetReps: '10',
      targetWeight: '',
      note: '',
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, field: keyof MenuItemInput, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('メニュー名を入力してください')
      return
    }

    if (items.length === 0) {
      setError('少なくとも1つの種目を追加してください')
      return
    }

    const invalidItems = items.filter(
      (item) => !item.exerciseId || !item.targetSets || !item.targetReps
    )
    if (invalidItems.length > 0) {
      setError('すべての種目にセット数と回数を入力してください')
      return
    }

    setSaving(true)

    try {
      await menuApi.update(menuId, {
        name: name.trim(),
        description: description.trim() || undefined,
        items: items.map((item, index) => ({
          exercise_id: item.exerciseId,
          order_number: index + 1,
          target_sets: parseInt(item.targetSets, 10),
          target_reps: parseInt(item.targetReps, 10),
          target_weight: item.targetWeight ? parseFloat(item.targetWeight) : undefined,
          note: item.note || undefined,
        })),
      })
      router.push('/menus')
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
        <Link
          href="/menus"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          メニュー一覧に戻る
        </Link>

        <h1 className="text-2xl font-bold text-white mb-6">メニュー編集</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* メニュー名 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              メニュー名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 胸の日、脚トレ"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* 説明 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              説明（オプション）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="メニューの説明や目的を記入"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
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

          {/* 種目一覧 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                種目 <span className="text-red-400">*</span>
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                種目を追加
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-8 bg-white/5 rounded-2xl border border-white/10 text-center">
                <p className="text-gray-400">種目を追加してメニューを構成しましょう</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-purple-400">
                          種目 {index + 1}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">種目</label>
                        <select
                          value={item.exerciseId}
                          onChange={(e) =>
                            updateItem(item.id, 'exerciseId', parseInt(e.target.value, 10))
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

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">セット数</label>
                          <input
                            type="number"
                            min="1"
                            value={item.targetSets}
                            onChange={(e) => updateItem(item.id, 'targetSets', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">回数</label>
                          <input
                            type="number"
                            min="1"
                            value={item.targetReps}
                            onChange={(e) => updateItem(item.id, 'targetReps', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">重量 (kg)</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={item.targetWeight}
                            onChange={(e) => updateItem(item.id, 'targetWeight', e.target.value)}
                            placeholder="任意"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* 保存ボタン */}
          <button
            type="submit"
            disabled={saving || items.length === 0}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save className="h-5 w-5" />
            {saving ? '保存中...' : '変更を保存'}
          </button>
        </form>
      </main>
    </div>
  )
}

