
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail, Database, Zap, PlayCircle, Lock } from 'lucide-react';
import { Video } from '@/lib/types';
import { VideoCarousel } from '@/components/VideoCarousel';

// フォールバック用のサンプルデータ
const SAMPLE_VIDEOS: Partial<Video>[] = [
  {
    id: 'sample-1',
    yt_video_id: 'sample', // ダミー
    title: '21歳で年商5億円のキャンディビジネスを作った話',
    summary_json: {
      business_overview: '低糖質・ヴィーガン向けのグミキャンディD2Cブランド。健康志向のZ世代をターゲットに、インフルエンサーマーケティングで成長。初期費用はわずか$10kからのスタート。',
      key_metrics: '月商: $416k (約6,000万円) | 利益率: 20%',
      acquisition_strategy: '',
      tools_used: '',
      japan_application: '日本のコンビニ市場への卸展開戦略と、TikTokを活用した「作ってみた」動画によるUGC生成が鍵。'
    },
    published_at: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    yt_video_id: '8v4gQ1jQ23A', // 実在しそうなID（例）
    title: 'ChatGPTを使って1人でSaaSを開発し月100万円稼ぐ方法',
    summary_json: {
      business_overview: 'コーディング未経験者がAIツールを駆使してマイクロSaaSを立ち上げ。ニッチな業界特化型のツールで競合を回避し、サブスクリプションモデルで安定収益化。',
      key_metrics: 'MRR: $7,000 | ユーザー数: 350人',
      acquisition_strategy: '',
      tools_used: '',
      japan_application: '日本のレガシー産業（不動産、建設など）の特定業務を自動化するマイクロSaaSへの応用。'
    },
    published_at: new Date().toISOString(),
  }
];

export default async function Home() {
  const supabase = await createClient();

  // 最新の動画を取得（最大3件）
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(12);

  console.log('Homepage video count:', videos?.length);

  // データがない場合はサンプルを表示
  const displayVideos = (videos && videos.length > 0) ? videos : SAMPLE_VIDEOS as Video[];

  const getThumbnailUrl = (video: Video) => {
    if (video.thumbnail_url) return video.thumbnail_url;
    if (video.yt_video_id === 'sample') return 'https://images.unsplash.com/photo-1582053433976-25c00369fc93?auto=format&fit=crop&q=80&w=800'; // ダミー画像
    return `https://i.ytimg.com/vi/${video.yt_video_id}/maxresdefault.jpg`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navbar */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="text-xl font-bold tracking-tight text-blue-900">Starter Story Insights (JP)</div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50">ログイン</Button>
          </Link>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transaction-all duration-300">始める</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative py-24 md:py-32 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white -z-10"></div>
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4 animate-fade-in-up">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              毎日更新中
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-gray-900">
              海外の成功ビジネス事例を<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">日本語で、毎日お届け。</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              30分の動画を見る時間はありませんか？<br className="hidden md:block" />
              AIがビジネスの要点だけを抽出。毎朝のメールで、<br className="hidden md:block" />
              あなたのビジネスアイデアを加速させます。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/login">
                <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all hover:scale-105">
                  7日間の無料トライアル <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 font-medium">まずは7日間無料でお試し。期間中のキャンセルなら料金は一切かかりません。</p>
          </div>
        </section>

        {/* Latest Insights Section (Dynamic) */}
        <section className="py-24 bg-gray-900 text-white relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">最新の分析レポート</h2>
              <p className="text-gray-400 text-lg">会員限定で配信している実際のレポートの一部をご覧ください。</p>
            </div>

            <VideoCarousel videos={displayVideos} />

            <div className="mt-12 text-center">
              <Link href="/login">
                <Button variant="link" className="text-blue-400 hover:text-blue-300 text-lg">
                  すべてのアーカイブを見る ({Math.max(100, videos?.length || 0)}本以上) <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-white px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">なぜ選ばれるのか</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                日本のビジネスパーソンに必要なのは「英語の翻訳」ではなく「ビジネス的な文脈の解釈」です。
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="bg-gray-50 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="h-14 w-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                  <Mail className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">毎朝8時に配信</h3>
                <p className="text-gray-600 leading-relaxed">
                  通勤時間や朝のコーヒータイムに。最新の成功事例を「5つの重要ポイント」に要約し、読みやすい形式でお届けします。
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="h-14 w-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">AIによる高度な分析</h3>
                <p className="text-gray-600 leading-relaxed">
                  Gemini 1.5 Proを使用し、単なる要約ではなく、収益モデル、集客戦略、使用ツールなどを構造化して抽出します。
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="h-14 w-14 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                  <Database className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">アーカイブ見放題</h3>
                <p className="text-gray-600 leading-relaxed">
                  会員専用ダッシュボードでは、過去に配信された全ての要約をキーワードやジャンルで検索・閲覧可能です。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 px-6 bg-blue-600 text-white text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              あなたの次のビジネスアイデアは、<br />ここにあるかもしれません。
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              まずは7日間の無料トライアルで、情報の質を確かめてください。
            </p>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="h-14 px-12 text-lg rounded-full shadow-2xl hover:scale-105 transition-transform text-blue-700 font-bold">
                今すぐ無料で始める
              </Button>
            </Link>
            <p className="mt-6 text-sm text-blue-200 opacity-80">
              まずは7日間の無料トライアルから。いつでもキャンセル可能です。
            </p>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-gray-50 text-center text-gray-500 text-sm border-t">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            &copy; 2026 Starter Story Insights (JP). <br className="md:hidden" />Not affiliated with Starter Story.
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-gray-900">プライバシーポリシー</Link>
            <Link href="#" className="hover:text-gray-900">利用規約</Link>
            <Link href="#" className="hover:text-gray-900">特定商取引法に基づく表記</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
