'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { bodyWeightApi, BodyWeight, ApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { Scale, TrendingDown, TrendingUp, Minus, Plus, Trash2 } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function BodyWeightPage() {
  const router = useRouter()
  const [records, setRecords] = useState<BodyWeight[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    fetchRecords()
  }, [router])

  const fetchRecords = async () => {
    try {
      const data = await bodyWeightApi.getRecords(90)
      setRecords(data || [])
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!date || !weight) {
      setError('日付と体重を入力してください')
      return
    }

    setSaving(true)
    try {
      await bodyWeightApi.createOrUpdate({
        date,
        weight: parseFloat(weight),
        body_fat_percentage: bodyFat ? parseFloat(bodyFat) : undefined,
      })
      await fetchRecords()
      setShowForm(false)
      setWeight('')
      setBodyFat('')
      setDate(new Date().toISOString().split('T')[0])
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

  const handleDelete = async (id: number) => {
    if (!confirm('この記録を削除しますか？')) {
      return
    }

    try {
      await bodyWeightApi.delete(id)
      setRecords(records.filter((r) => r.id !== id))
    } catch (error) {
      alert('削除に失敗しました')
    }
  }

  // 統計計算
  const latestRecord = records[0]
  const firstRecord = records[records.length - 1]
  const weekAgoRecord = records.find((r) => {
    const recordDate = new Date(r.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return recordDate <= weekAgo
  })

  const totalChange = latestRecord && firstRecord
    ? (latestRecord.weight - firstRecord.weight).toFixed(1)
    : null
  const weekChange = latestRecord && weekAgoRecord
    ? (latestRecord.weight - weekAgoRecord.weight).toFixed(1)
    : null

  // グラフ用データ（古い順に並べる）
  const chartData = [...records]
    .reverse()
    .map((r) => ({
      date: r.date,
      weight: r.weight,
      bodyFat: r.body_fat_percentage,
    }))

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
          <h1 className="text-2xl font-bold text-white">体重記録</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            記録を追加
          </button>
        </div>

        {/* 記録フォーム */}
        {showForm && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">体重を記録</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">日付</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    体重 (kg) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="60.0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    体脂肪率 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                    placeholder="15.0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Scale className="h-5 w-5 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">現在の体重</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {latestRecord ? `${latestRecord.weight} kg` : '-'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                weekChange && parseFloat(weekChange) < 0
                  ? 'bg-green-500/20'
                  : weekChange && parseFloat(weekChange) > 0
                  ? 'bg-red-500/20'
                  : 'bg-gray-500/20'
              }`}>
                {weekChange && parseFloat(weekChange) < 0 ? (
                  <TrendingDown className="h-5 w-5 text-green-400" />
                ) : weekChange && parseFloat(weekChange) > 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-400" />
                ) : (
                  <Minus className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <span className="text-sm text-gray-400">週間変化</span>
            </div>
            <p className={`text-2xl font-bold ${
              weekChange && parseFloat(weekChange) < 0
                ? 'text-green-400'
                : weekChange && parseFloat(weekChange) > 0
                ? 'text-red-400'
                : 'text-white'
            }`}>
              {weekChange ? `${parseFloat(weekChange) > 0 ? '+' : ''}${weekChange} kg` : '-'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                totalChange && parseFloat(totalChange) < 0
                  ? 'bg-green-500/20'
                  : totalChange && parseFloat(totalChange) > 0
                  ? 'bg-red-500/20'
                  : 'bg-gray-500/20'
              }`}>
                {totalChange && parseFloat(totalChange) < 0 ? (
                  <TrendingDown className="h-5 w-5 text-green-400" />
                ) : totalChange && parseFloat(totalChange) > 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-400" />
                ) : (
                  <Minus className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <span className="text-sm text-gray-400">全期間変化</span>
            </div>
            <p className={`text-2xl font-bold ${
              totalChange && parseFloat(totalChange) < 0
                ? 'text-green-400'
                : totalChange && parseFloat(totalChange) > 0
                ? 'text-red-400'
                : 'text-white'
            }`}>
              {totalChange ? `${parseFloat(totalChange) > 0 ? '+' : ''}${totalChange} kg` : '-'}
            </p>
          </div>
        </div>

        {/* グラフ */}
        {chartData.length > 1 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">体重推移</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    tickFormatter={(value) => {
                      const d = new Date(value)
                      return `${d.getMonth() + 1}/${d.getDate()}`
                    }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('ja-JP')}
                    formatter={(value: number) => [`${value} kg`, '体重']}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 記録一覧 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">記録一覧</h2>
          </div>
          {records.length === 0 ? (
            <div className="p-8 text-center">
              <Scale className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">記録がありません</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {records.slice(0, 30).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 hover:bg-white/5"
                >
                  <div>
                    <p className="text-white font-medium">
                      {new Date(record.date).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-purple-400">{record.weight} kg</span>
                      {record.body_fat_percentage && (
                        <span className="text-gray-400">
                          体脂肪率: {record.body_fat_percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

