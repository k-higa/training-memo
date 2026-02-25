import Link from 'next/link'
import { Dumbbell } from 'lucide-react'
import { Footer } from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* ヘッダー */}
      <header className="container mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <Dumbbell className="h-7 w-7 text-purple-400" />
          <span className="text-lg font-bold text-white">Training Memo</span>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-3xl flex-1">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <h1 className="text-2xl font-bold text-white mb-2">利用規約</h1>
          <p className="text-gray-400 text-sm mb-8">最終更新日：2026年2月25日</p>

          <div className="space-y-8 text-gray-300 text-sm leading-relaxed">

            <section>
              <h2 className="text-base font-semibold text-white mb-3">第1条（適用）</h2>
              <p>
                本利用規約（以下「本規約」）は、Training Memo（以下「当サービス」）の利用条件を定めるものです。
                ユーザーの皆さまは、本規約に同意のうえ、当サービスをご利用ください。
                本サービスに登録した場合、本規約に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">第2条（サービスの内容）</h2>
              <p>
                当サービスは、ユーザーが日々のトレーニング記録・体重記録・メニュー管理を行うためのウェブアプリケーションです。
                当サービスは医療・健康指導サービスではなく、提供する情報・生成されるAIメニューは医学的なアドバイスを構成するものではありません。
                トレーニングや食事・体重管理に関する判断は、ご自身の責任のもとで行ってください。
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">第3条（利用登録）</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>登録希望者は、本規約に同意のうえ、所定の方法によりアカウントを作成するものとします。</li>
                <li>13歳未満の方は当サービスを利用できません。</li>
                <li>アカウント情報（メールアドレス・パスワード）は責任をもって管理してください。第三者への貸与・譲渡は禁止します。</li>
                <li>登録情報に虚偽・誤記がある場合、当サービスの利用を制限または停止することがあります。</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">第4条（禁止事項）</h2>
              <p className="mb-2">ユーザーは以下の行為を行ってはなりません。</p>
              <ul className="list-disc list-inside space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>当サービスのサーバーまたはネットワークへの不正アクセス・妨害行為</li>
                <li>当サービスの運営を妨げる行為</li>
                <li>他のユーザーへの迷惑行為</li>
                <li>当サービスを逆コンパイル・リバースエンジニアリングする行為</li>
                <li>その他、運営者が不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">第5条（知的財産権）</h2>
              <p>
                当サービスに含まれるコンテンツ（ロゴ・デザイン・コードなど）に関する知的財産権は、運営者またはその許諾者に帰属します。
                本規約に基づく利用許諾は、当サービスの知的財産権の譲渡を意味するものではありません。
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">第6条（免責事項）</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>当サービスは現状有姿で提供され、特定目的への適合性・正確性・完全性を保証しません。</li>
                <li>当サービスの利用によって生じた損害（トレーニングによる身体的損害を含む）について、運営者は一切の責任を負いません。</li>
                <li>サービスの中断・停止・終了によって生じた損害についても、運営者は責任を負いません。</li>
                <li>AI機能が生成するトレーニングメニューの安全性・効果を保証するものではありません。</li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">第7条（サービスの変更・停止・終了）</h2>
              <p>
                運営者は、ユーザーへの事前通知なく、当サービスの内容の変更、一時停止、または終了を行う場合があります。
                これによってユーザーに生じた損害について、運営者は責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">第8条（利用規約の変更）</h2>
              <p>
                運営者は、必要と判断した場合、本規約を変更することがあります。
                変更後の規約はサービス上に掲載した時点で効力を生じます。
                変更後もサービスを継続してご利用いただいた場合、変更後の規約に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">第9条（準拠法・管轄裁判所）</h2>
              <p>
                本規約は日本法に準拠します。
                当サービスに関して生じた紛争については、運営者の所在地を管轄する裁判所を専属的合意管轄裁判所とします。
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">第10条（お問い合わせ）</h2>
              <p>
                本規約に関するご質問・ご意見は、以下のお問い合わせ先までご連絡ください。<br />
                メールアドレス：<span className="text-purple-300">[連絡先メールアドレス]</span>
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
