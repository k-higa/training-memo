'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import {
  menuApi,
  AIGenerateMenuInput,
  AIGeneratedMenu,
  ApiError,
  CreateMenuInput,
} from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { Sparkles, ChevronLeft, RotateCcw, Save, Dumbbell } from 'lucide-react'

const muscleGroupOptions = [
  { value: 'chest', label: '胸' },
  { value: 'back', label: '背中' },
  { value: 'shoulders', label: '肩' },
  { value: 'arms', label: '腕' },
  { value: 'legs', label: '脚' },
  { value: 'abs', label: '腹筋' },
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

export default function AIGenerateMenuPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'input' | 'loading' | 'preview'>('input')
  const [error, setError] = useState<string | null>(null)
  const [generatedMenu, setGeneratedMenu] = useState<AIGeneratedMenu | null>(null)
  const [saving, setSaving] = useState(false)

  // フォームの状態
  const [goal, setGoal] = useState('筋力アップ')
  const [fitnessLevel, setFitnessLevel] = useState('初心者')
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [targetMuscleGroups, setTargetMuscleGroups] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    }
  }, [router])

  const toggleMuscleGroup = (value: string) => {
    setTargetMuscleGroups((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const handleGenerate = async () => {
    setError(null)
    setPhase('loading')

    const input: AIGenerateMenuInput = {
      goal,
      fitness_level: fitnessLevel,
      days_per_week: daysPerWeek,
      duration_minutes: durationMinutes,
      target_muscle_groups: targetMuscleGroups.length > 0 ? targetMuscleGroups : undefined,
      notes: notes.trim() || undefined,
    }

    try {
      const result = await menuApi.generateWithAI(input)
      setGeneratedMenu(result)
      setPhase('preview')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login')
        return
      }
      setError(err instanceof Error ? err.message : 'AIメニューの生成に失敗しました')
      setPhase('input')
    }
  }

  const handleSave = async () => {
    if (!generatedMenu) return
    setSaving(true)
    setError(null)

    const createInput: CreateMenuInput = {
      name: generatedMenu.name,
      description: generatedMenu.description || undefined,
      items: generatedMenu.items.map((item) => ({
        exercise_id: item.exercise_id,
        order_number: item.order_number,
        target_sets: item.target_sets,
        target_reps: item.target_reps,
        target_weight: item.target_weight,
        note: item.note,
      })),
    }

    try {
      await menuApi.create(createInput)
      router.push('/menus')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login')
        return
      }
      setError(err instanceof Error ? err.message : 'メニューの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerate = () => {
    setGeneratedMenu(null)
    setPhase('input')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/menus" className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-pink-400" />
            AIメニュープランニング
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Phase 1: 入力フォーム */}
        {phase === 'input' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-6">
            <p className="text-gray-300 text-sm">
              トレーニングの目標や条件を入力すると、AIが最適なメニューを提案します。
            </p>

            {/* トレーニング目標 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                トレーニング目標 <span className="text-red-400">*</span>
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400 transition-colors"
              >
                <option value="筋力アップ">筋力アップ</option>
                <option value="筋肥大">筋肥大（バルクアップ）</option>
                <option value="ダイエット">ダイエット・脂肪燃焼</option>
                <option value="体力維持">体力維持・健康増進</option>
              </select>
            </div>

            {/* フィットネスレベル */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                フィットネスレベル <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['初心者', '中級者', '上級者'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFitnessLevel(level)}
                    className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                      fitnessLevel === level
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/20'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* 週のトレーニング回数 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                週のトレーニング回数 <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDaysPerWeek(days)}
                    className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                      daysPerWeek === days
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/20'
                    }`}
                  >
                    週{days}回
                  </button>
                ))}
              </div>
            </div>

            {/* 1回のトレーニング時間 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                1回のトレーニング時間 <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                      durationMinutes === mins
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/20'
                    }`}
                  >
                    {mins}分
                  </button>
                ))}
              </div>
            </div>

            {/* 重点部位（任意） */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                重点部位（任意・複数選択可）
              </label>
              <div className="flex flex-wrap gap-2">
                {muscleGroupOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleMuscleGroup(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      targetMuscleGroups.includes(opt.value)
                        ? 'bg-pink-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* その他の要望（任意） */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                その他の要望（任意）
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例：自宅でできる種目のみ、腰が弱いのでデッドリフトは除外してほしい など"
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              AIにプランニングしてもらう
            </button>
          </div>
        )}

        {/* Phase 2: ローディング */}
        {phase === 'loading' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
            <div className="animate-pulse">
              <Sparkles className="h-16 w-16 text-pink-400 mx-auto mb-4" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">AIがメニューを考えています...</h2>
            <p className="text-gray-400 text-sm">最適なトレーニングメニューを作成しています。しばらくお待ちください。</p>
          </div>
        )}

        {/* Phase 3: プレビュー */}
        {phase === 'preview' && generatedMenu && (
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles className="h-5 w-5 text-pink-400 mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{generatedMenu.name}</h2>
                  {generatedMenu.description && (
                    <p className="text-gray-300 text-sm">{generatedMenu.description}</p>
                  )}
                </div>
              </div>

              {/* 種目リスト */}
              <div className="space-y-3">
                {generatedMenu.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-4 bg-white/5 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-600/50 text-purple-200 rounded-full flex items-center justify-center text-xs font-medium">
                        {item.order_number}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">
                            {item.exercise?.name || '不明な種目'}
                          </span>
                          {item.exercise?.muscle_group && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                              {muscleGroupLabels[item.exercise.muscle_group] || item.exercise.muscle_group}
                            </span>
                          )}
                        </div>
                        {item.note && (
                          <p className="text-gray-400 text-xs mt-1">{item.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm shrink-0 ml-4">
                      {item.target_weight && (
                        <span className="text-gray-300">{item.target_weight}kg × </span>
                      )}
                      <span className="text-white">{item.target_reps}回</span>
                      <span className="text-gray-400"> × </span>
                      <span className="text-white">{item.target_sets}セット</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm text-gray-400">
                <span>
                  <Dumbbell className="h-4 w-4 inline mr-1" />
                  {generatedMenu.items.length}種目 ·{' '}
                  {generatedMenu.items.reduce((sum, item) => sum + (item.target_sets || 0), 0)}セット合計
                </span>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-3">
              <button
                onClick={handleRegenerate}
                className="flex-1 py-3 bg-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2 border border-white/20"
              >
                <RotateCcw className="h-4 w-4" />
                再生成
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {saving ? '保存中...' : 'このメニューを保存'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
