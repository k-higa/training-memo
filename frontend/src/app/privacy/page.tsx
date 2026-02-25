import Link from 'next/link'
import { Dumbbell } from 'lucide-react'
import { Footer } from '@/components/Footer'

export default function PrivacyPage() {
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
          <h1 className="text-2xl font-bold text-white mb-2">プライバシーポリシー</h1>
          <p className="text-gray-400 text-sm mb-8">最終更新日：2026年2月25日</p>

          <div className="space-y-8 text-gray-300 text-sm leading-relaxed">

            <section>
              <h2 className="text-base font-semibold text-white mb-3">1. 事業者情報</h2>
              <p>
                Training Memo（以下「当サービス」）は、以下の者が運営します。<br />
                運営者：<span className="text-purple-300">[運営者名]</span><br />
                お問い合わせ：<span className="text-purple-300">[連絡先メールアドレス]</span>
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">2. 収集する個人情報</h2>
              <p className="mb-3">当サービスでは、以下の情報を収集します。</p>

              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="font-medium text-white mb-1">アカウント情報</p>
                  <p>ニックネーム、メールアドレス、パスワード（ハッシュ化して保管）</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="font-medium text-white mb-1">身体・健康情報（要配慮個人情報）</p>
                  <p>体重、体脂肪率。これらは個人情報保護法上の「要配慮個人情報」に該当する可能性があり、特に慎重に取り扱います。</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="font-medium text-white mb-1">トレーニングデータ</p>
                  <p>トレーニング日時、種目、セット数・回数・重量、メモ、トレーニングメニュー</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="font-medium text-white mb-1">AI機能入力情報</p>
                  <p>AIメニュー生成機能に入力したトレーニング目標・レベル・希望条件など</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">3. 利用目的</h2>
              <p className="mb-2">収集した個人情報は、以下の目的にのみ利用します。</p>
              <ul className="list-disc list-inside space-y-1">
                <li>当サービスのアカウント認証・管理</li>
                <li>トレーニング記録・統計の表示</li>
                <li>AIメニュー生成機能の提供（OpenAI APIへの送信を含む）</li>
                <li>サービスの改善・不具合対応</li>
                <li>利用規約違反への対応</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">4. 第三者提供</h2>
              <p className="mb-3">
                当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>ユーザー本人の同意がある場合</li>
                <li>法令に基づく場合（裁判所・行政機関からの開示要求など）</li>
              </ul>

              <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="font-medium text-purple-300 mb-1">AIメニュー生成機能について</p>
                <p>
                  AIメニュー生成機能を利用した場合、入力されたトレーニング目標・条件などのデータが
                  OpenAI, Inc.（米国）のAPIに送信されます。
                  OpenAIのプライバシーポリシーは
                  <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline ml-1">
                    こちら
                  </a>
                  をご確認ください。体重・体脂肪率などの個人的な身体情報は送信されません。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">5. データの保管・セキュリティ</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>パスワードはbcryptによりハッシュ化して保管します。平文では保存しません。</li>
                <li>通信はHTTPSにより暗号化されます。</li>
                <li>認証にはJWT（JSON Web Token）を使用し、ブラウザのlocalStorageに保管されます。</li>
                <li>当サービスはCookieを使用しません。</li>
                <li>データはクラウドサーバー（PostgreSQL）に保管されます。</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">6. 保存期間</h2>
              <p>
                ユーザーのデータは、アカウントが有効である限り保持します。
                アカウント削除を希望する場合は、下記お問い合わせ先までご連絡ください。
                削除依頼を受理してから30日以内にデータを削除します。
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">7. 開示・訂正・削除のご請求</h2>
              <p>
                ユーザーは、自身の個人情報について、開示・訂正・利用停止・削除を請求する権利を有します。
                ご請求は下記お問い合わせ先にご連絡ください。本人確認のうえ、合理的な期間内に対応します。
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">8. プライバシーポリシーの変更</h2>
              <p>
                当サービスは、必要に応じて本ポリシーを変更することがあります。
                重要な変更がある場合は、サービス上でお知らせします。
                変更後も当サービスをご利用いただいた場合、変更後のポリシーに同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">9. お問い合わせ</h2>
              <p>
                個人情報の取り扱いに関するお問い合わせ・ご請求は、以下にご連絡ください。<br />
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
