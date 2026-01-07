'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, Home, Plus, History, Calendar, BarChart3, List, LogOut } from 'lucide-react'
import { removeToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    removeToken()
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'ホーム', icon: Home },
    { href: '/workout/new', label: '記録', icon: Plus },
    { href: '/calendar', label: 'カレンダー', icon: Calendar },
    { href: '/history', label: '履歴', icon: History },
    { href: '/stats', label: '統計', icon: BarChart3 },
    { href: '/exercises', label: '種目', icon: List },
  ]

  return (
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Dumbbell className="h-7 w-7 text-purple-400" />
            <span className="text-lg font-bold text-white hidden sm:block">Training Memo</span>
          </Link>

          {/* ナビゲーション */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:block">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* ユーザーメニュー */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:block">ログアウト</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

