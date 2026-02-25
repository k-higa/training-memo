import Link from 'next/link'
import { Dumbbell } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Dumbbell className="h-5 w-5" />
            <span className="font-medium">Training Memo</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-300 transition-colors">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">
              プライバシーポリシー
            </Link>
          </div>
          <p className="text-xs text-gray-600">© 2026 Training Memo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
