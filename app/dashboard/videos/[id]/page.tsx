import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Calendar, TrendingUp, Wrench, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default async function VideoDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: userData } = await supabase
        .from('users')
        .select('subscription_status, is_admin')
        .eq('id', user.id)
        .single();

    const isSubscribed = userData?.subscription_status === 'active' || userData?.subscription_status === 'trialing' || userData?.is_admin;

    const { data: video, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !video) {
        return <div className="p-10 text-center">Video not found.</div>;
    }

    const summary = video.summary_json;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center">
                    <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">一覧に戻る</span>
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">

                {/* Meta Info */}
                <div className="mb-6 flex items-center gap-3 text-sm text-gray-500">
                    <Calendar size={16} />
                    <span>{new Date(video.published_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">ビジネス分析</span>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight text-gray-900 tracking-tight">
                    {video.title}
                </h1>

                {/* Thumbnail */}
                {video.thumbnail_url && (
                    <div className="mb-12 rounded-2xl overflow-hidden shadow-xl border border-gray-200">
                        <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full aspect-video object-cover"
                        />
                    </div>
                )}

                {/* Quick Stats Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-16">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                <TrendingUp size={18} className="text-white" />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900">ビジネス概要</h3>
                        </div>
                        <p className="text-gray-800 leading-relaxed">{summary.business_overview}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">¥</span>
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-green-900">主要メトリクス</h3>
                        </div>
                        <p className="text-gray-800 font-medium leading-relaxed">{summary.key_metrics}</p>
                    </div>
                </div>

                {/* Detailed Article Content */}
                <article className="
                    mb-16 bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100
                    prose prose-lg max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
                    prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-10 prose-h1:first:mt-0
                    prose-h2:text-2xl prose-h2:mb-5 prose-h2:mt-10 prose-h2:pb-3 prose-h2:border-b-2 prose-h2:border-gray-200
                    prose-h3:text-xl prose-h3:mb-4 prose-h3:mt-8
                    prose-p:text-gray-700 prose-p:leading-loose prose-p:mb-6 prose-p:text-[17px]
                    prose-ul:my-6 prose-ul:space-y-3 prose-ul:pl-6
                    prose-ol:my-6 prose-ol:space-y-3 prose-ol:pl-6
                    prose-li:text-gray-700 prose-li:leading-relaxed prose-li:marker:text-blue-500
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    prose-em:text-gray-600 prose-em:italic
                    prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline hover:prose-a:text-blue-700
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:bg-blue-50 prose-blockquote:py-4 prose-blockquote:rounded-r-lg
                    prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-pink-600 prose-code:font-mono
                    prose-pre:bg-gray-900 prose-pre:text-gray-100
                ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {summary.detailed_article || "詳細記事は準備中です。"}
                    </ReactMarkdown>
                </article>

                {/* Additional Insights */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                <TrendingUp size={20} className="text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">獲得戦略</h3>
                        </div>
                        <div className="prose prose-lg max-w-none prose-p:text-gray-700 prose-p:leading-loose prose-p:text-[17px] prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:space-y-2 prose-li:text-gray-700">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {summary.acquisition_strategy}
                            </ReactMarkdown>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Wrench size={20} className="text-orange-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">使用ツール</h3>
                        </div>
                        <div className="prose prose-lg max-w-none prose-p:text-gray-700 prose-p:leading-loose prose-p:text-[17px] prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:space-y-2 prose-li:text-gray-700">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {summary.tools_used}
                            </ReactMarkdown>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-2xl shadow-lg text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Globe size={20} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold">日本市場での応用アイデア</h3>
                        </div>
                        <div className="prose prose-lg max-w-none prose-p:text-blue-50 prose-p:leading-loose prose-p:text-[17px] prose-strong:text-white prose-strong:font-semibold prose-ul:space-y-2 prose-li:text-blue-50">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {summary.japan_application}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-16 pt-10 border-t border-gray-200 text-center">
                    <p className="text-gray-500 mb-6 text-lg">元の動画をチェックする</p>
                    <Button asChild size="lg" className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg">
                        <a href={`https://youtube.com/watch?v=${video.yt_video_id}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={18} />
                            YouTubeで見る
                        </a>
                    </Button>
                </div>

            </main>
        </div>
    );
}
