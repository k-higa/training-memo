import Link from 'next/link'
import { Dumbbell, TrendingUp, Calendar, Target } from 'lucide-react'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* ヘッダー */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-purple-400" />
            <span className="text-xl font-bold text-white">Training Memo</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white hover:text-purple-300 transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              新規登録
            </Link>
          </div>
        </nav>
      </header>

      {/* ヒーローセクション */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            トレーニングを
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              記録
            </span>
            して
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              成長
            </span>
            を実感しよう
          </h1>
          <p className="text-lg text-gray-300 mb-10">
            日々のトレーニングを簡単に記録。
            <br />
            進捗をグラフで可視化し、目標達成をサポートします。
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/25"
          >
            無料で始める
            <TrendingUp className="h-5 w-5" />
          </Link>
        </div>

        {/* 特徴セクション */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Dumbbell className="h-10 w-10" />}
            title="簡単記録"
            description="種目・重量・回数をサクッと入力。前回の記録をコピーしてさらに時短。"
          />
          <FeatureCard
            icon={<TrendingUp className="h-10 w-10" />}
            title="進捗の可視化"
            description="グラフで成長を実感。自己ベスト更新時には通知でお知らせ。"
          />
          <FeatureCard
            icon={<Calendar className="h-10 w-10" />}
            title="カレンダー管理"
            description="トレーニング履歴をカレンダーで確認。継続日数も一目でわかる。"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-colors">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

