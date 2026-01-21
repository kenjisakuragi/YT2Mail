
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { createCheckoutSession, createPortalSession } from '@/lib/stripe/actions';
import { Lock, Zap } from 'lucide-react';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch User's subscription status
    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    const isSubscribed = userData?.subscription_status === 'active' || userData?.subscription_status === 'trialing' || userData?.is_admin;

    const { data: videos } = await supabase
        .from('videos')
        .select('*')
        .order('published_at', { ascending: false });

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="font-bold text-lg tracking-tight">Starter Story Insights (JP)</div>
                <div className="flex gap-4 items-center">
                    <span className="text-sm text-gray-500">
                        {userData?.email}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/settings">マイページ</Link>
                    </Button>
                    <form action={async () => {
                        'use server';
                        const supabase = await createClient();
                        await supabase.auth.signOut();
                        redirect('/login');
                    }}>
                        <Button variant="outline" size="sm">ログアウト</Button>
                    </form>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6 md:py-12">
                {!isSubscribed && (
                    <div className="mb-12">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <Zap size={120} />
                            </div>
                            <div className="relative z-10 space-y-4 max-w-xl">
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                                    Limited Access
                                </div>
                                <h1 className="text-3xl font-extrabold tracking-tight">
                                    すべての分析レポートを解放しましょう
                                </h1>
                                <p className="text-blue-50 text-lg leading-relaxed">
                                    現在は概要のみ閲覧可能です。7日間の無料トライアルを開始して、詳細な戦略分析や日本市場への応用アイデアにアクセスしてください。
                                </p>
                                <div className="pt-2">
                                    <form action={async () => {
                                        'use server';
                                        await createCheckoutSession(user.email!, user.id);
                                    }}>
                                        <Button size="lg" variant="secondary" className="h-12 px-8 text-blue-700 font-bold hover:bg-white transition-colors">
                                            7日間無料で試す
                                        </Button>
                                    </form>
                                    <p className="mt-3 text-xs text-blue-200">トライアル期間中のキャンセルは無料です。</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold">Latest Insights</h1>
                        <p className="text-gray-500">最新のビジネス分析レポート</p>
                    </div>
                    {isSubscribed && (
                        <form action={async () => {
                            'use server';
                            if (userData?.stripe_customer_id) {
                                await createPortalSession(userData.stripe_customer_id);
                            }
                        }}>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!userData?.stripe_customer_id}
                                title={!userData?.stripe_customer_id ? 'Stripe顧客IDが見つかりません' : 'お支払い情報を管理'}
                            >
                                お支払い情報の管理
                            </Button>
                        </form>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {videos?.map((video) => (
                        <Card key={video.id} className="flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
                            {!isSubscribed && (
                                <div className="absolute top-3 right-3 z-10">
                                    <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-gray-400 border border-gray-100 flex items-center gap-1 shadow-sm">
                                        <Lock size={10} /> PREMIUM
                                    </div>
                                </div>
                            )}
                            <CardHeader className="p-0">
                                {video.thumbnail_url ? (
                                    <div className="aspect-video w-full overflow-hidden rounded-t-lg relative group">
                                        <img
                                            src={video.thumbnail_url}
                                            alt={video.title}
                                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isSubscribed ? 'grayscale-[0.5]' : ''}`}
                                        />
                                        {!isSubscribed && <div className="absolute inset-0 bg-black/5"></div>}
                                    </div>
                                ) : (
                                    <div className="aspect-video w-full bg-gray-200 rounded-t-lg flex items-center justify-center">
                                        <span className="text-gray-400 text-xs">No Image</span>
                                    </div>
                                )}
                            </CardHeader>
                            <div className="p-6 pb-2">
                                <CardTitle className="line-clamp-2 text-lg leading-snug">{video.title}</CardTitle>
                                <div className="text-xs text-gray-500 mt-2">
                                    {new Date(video.published_at).toLocaleDateString('ja-JP')}
                                </div>
                            </div>
                            <CardContent className="flex-1">
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <span className="font-bold text-gray-700 block mb-1 uppercase tracking-wider text-[11px]">Business Overview</span>
                                        <p className="text-gray-600 line-clamp-3 leading-relaxed">
                                            {video.summary_json?.business_overview || 'No overview available'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-700 block mb-1 uppercase tracking-wider text-[11px]">Key Metrics</span>
                                        <p className="text-gray-600">
                                            {isSubscribed ? (video.summary_json?.key_metrics || 'N/A') : '••••••••••••'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4 border-gray-100 flex gap-3">
                                <Button className={`flex-1 ${!isSubscribed ? 'bg-gray-900 border-gray-900' : ''}`} asChild>
                                    <Link href={`/dashboard/videos/${video.id}`}>
                                        {isSubscribed ? 'レポートを読む' : '続きを読み解く'}
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {videos?.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-lg border border-dashed">
                        <p className="text-gray-500">まだレポートが配信されていません。<br />毎朝8時の定期配信をお待ちください。</p>
                    </div>
                )}
            </main>
        </div>
    );
}
