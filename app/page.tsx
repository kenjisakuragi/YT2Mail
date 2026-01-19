
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Mail, Database, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="text-xl font-bold tracking-tight">Starter Story Insights (JP)</div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">ログイン</Button>
          </Link>
          <Link href="/login">
            <Button>始める</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-32 px-6 max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            海外の成功ビジネス事例を<br />日本語で、毎日お届け。
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            30分の動画を見る時間はありませんか？<br />
            Starter Storyの最新動画をAIが解析し、ビジネスに直結する重要なインサイトだけを抽出。<br />
            毎朝、あなたのメールボックスにお届けします。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-lg">
                7日間の無料トライアルを試す <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">登録にクレジットカードは不要。いつでもキャンセル可能です。</p>
        </section>

        {/* Features */}
        <section className="py-20 bg-gray-50 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">毎朝8時に配信</h3>
              <p className="text-gray-600">
                最新の成功事例を「5つのポイント」に要約し、日本のビジネスパーソンが読みやすい形式でお届けします。
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">AIによる高度な分析</h3>
              <p className="text-gray-600">
                Gemini 1.5 Proを使用し、英語のTranscriptから収益モデル、集客戦略、使用ツールなどを高精度に抽出・翻訳します。
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">過去のアーカイブ見放題</h3>
              <p className="text-gray-600">
                会員専用ダッシュボードで、過去に配信された全ての要約を閲覧可能。ジャンルやキーワードで検索もできます。
              </p>
            </div>
          </div>
        </section>

        {/* Example Summary */}
        <section className="py-20 px-6 max-w-4xl mx-auto">
          <div className="bg-white border rounded-2xl shadow-sm p-8 md:p-12">
            <div className="uppercase text-xs font-bold text-gray-500 tracking-wider mb-4">要約サンプル</div>
            <h2 className="text-2xl font-bold mb-6">21歳で年商5億円のキャンディビジネスを作った話</h2>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">【ビジネス概要】</h4>
                <p className="text-gray-600">低糖質・ヴィーガン向けのグミキャンディD2Cブランド。健康志向のZ世代をターゲットに、インフルエンサーマーケティングで成長。</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">【主要メトリクス】</h4>
                <p className="text-gray-600">月商: $416k (約6,000万円) | 利益率: 20% | 初期費用: $10k (自己資金)</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">【日本での応用案】</h4>
                <p className="text-gray-600">日本のコンビニ市場への卸展開戦略と、TikTokを活用した「作ってみた」動画によるUGC生成が鍵。</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 text-center text-gray-500 text-sm border-t">
        &copy; 2026 Starter Story Insights (JP). Not affiliated with Starter Story.
      </footer>
    </div>
  );
}
