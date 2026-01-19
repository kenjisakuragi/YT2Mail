
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { createCheckoutSession, createPortalSession } from '@/lib/stripe/actions';

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

    const isSubscribed = userData?.subscription_status === 'active' || userData?.subscription_status === 'trialing';

    // Fetch Videos (If isSubscribed, show full content? Or just show list?)
    // Requirement: "Trialing users can verify full content".
    // So if active/trialing, show content.

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
                {!isSubscribed ? (
                    // --- NON-SUBSCRIBED USER VIEW (Strict Gate) ---
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                            <h1 className="text-2xl font-bold mb-4">アカウント作成を完了してください</h1>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                Starter Story Insights (JP) は会員限定のサービスです。<br />
                                以下のボタンからクレジットカード情報を登録し、<br />
                                <span className="font-bold text-gray-900">7日間の無料トライアル</span>を開始してください。<br />
                                <span className="text-sm text-gray-400 mt-2 block">(トライアル期間中に解約すれば料金は一切かかりません)</span>
                            </p>

                            <form action={async () => {
                                'use server';
                                await createCheckoutSession(user.email!, user.id);
                            }} className="w-full">
                                <Button size="lg" className="w-full text-lg h-12">
                                    7日間無料で試す (その後 ¥980/月)
                                </Button>
                            </form>

                            <p className="mt-6 text-xs text-gray-400">
                                Secure payment via Stripe
                            </p>
                        </div>
                    </div>
                ) : (
                    // --- SUBSCRIBED USER VIEW ---
                    <> {/* Fragment to keep structure */}
                        <div className="mb-8 flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-bold">Latest Insights</h1>
                                <p className="text-gray-500">最新のビジネス分析レポート</p>
                            </div>
                            <form action={async () => {
                                'use server';
                                if (userData?.stripe_customer_id) {
                                    await createPortalSession(userData.stripe_customer_id);
                                }
                            }}>
                                <Button variant="outline" size="sm">お支払い情報の管理</Button>
                            </form>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {videos?.map((video) => (
                                <Card key={video.id} className="flex flex-col hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="line-clamp-2 text-lg leading-snug">{video.title}</CardTitle>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {new Date(video.published_at).toLocaleDateString('ja-JP')}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="space-y-4 text-sm">
                                            <div>
                                                <span className="font-bold text-gray-700 block mb-1">【ビジネス概要】</span>
                                                <p className="text-gray-600 line-clamp-3 leading-relaxed">{video.summary_json.business_overview}</p>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-700 block mb-1">【主要メトリクス】</span>
                                                <p className="text-gray-600">{video.summary_json.key_metrics}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="border-t pt-4 bg-gray-50/50">
                                        <Button className="w-full" asChild>
                                            <a href={`https://youtube.com/watch?v=${video.yt_video_id}`} target="_blank" rel="noopener noreferrer">
                                                動画を見る
                                            </a>
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
                    </>
                )}
            </main>
        </div>
    );
}
