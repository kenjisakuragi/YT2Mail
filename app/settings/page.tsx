import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createPortalSession } from '@/lib/stripe/actions';
import { updateUserPreferences } from './actions';

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    const isSubscribed = userData?.subscription_status === 'active' ||
        userData?.subscription_status === 'trialing' ||
        userData?.is_admin;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="font-bold text-lg tracking-tight">設定</div>
                <div className="flex gap-4 items-center">
                    <Button variant="outline" size="sm" asChild>
                        <a href="/dashboard">ダッシュボードに戻る</a>
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

            <main className="max-w-4xl mx-auto p-6 md:py-12 space-y-6">
                {/* Account Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>アカウント情報</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">メールアドレス</label>
                            <div className="mt-1 text-gray-900">{userData?.email}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">サブスクリプション状態</label>
                            <div className="mt-1">
                                {isSubscribed ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        有効
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                        未登録
                                    </span>
                                )}
                            </div>
                        </div>
                        {userData?.trial_end_date && (
                            <div>
                                <label className="text-sm font-medium text-gray-700">トライアル終了日</label>
                                <div className="mt-1 text-gray-900">
                                    {new Date(userData.trial_end_date).toLocaleDateString('ja-JP')}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Email Delivery Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>メール配信設定</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={updateUserPreferences} className="space-y-6">
                            <input type="hidden" name="userId" value={user.id} />

                            <div>
                                <label htmlFor="email_frequency" className="block text-sm font-medium text-gray-700 mb-2">
                                    配信頻度
                                </label>
                                <select
                                    id="email_frequency"
                                    name="email_frequency"
                                    defaultValue={userData?.email_frequency || 'daily'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="daily">毎日</option>
                                    <option value="three_per_week">週3回</option>
                                    <option value="weekly">週1回</option>
                                    <option value="off">配信停止</option>
                                </select>
                                <p className="mt-1 text-sm text-gray-500">
                                    新しい分析レポートをどのくらいの頻度で受け取りますか？
                                </p>
                            </div>

                            <div>
                                <label htmlFor="email_time" className="block text-sm font-medium text-gray-700 mb-2">
                                    配信時刻
                                </label>
                                <select
                                    id="email_time"
                                    name="email_time"
                                    defaultValue={userData?.email_time || '07:00'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="07:00">朝 7:00</option>
                                    <option value="12:00">昼 12:00</option>
                                    <option value="20:00">夜 20:00</option>
                                </select>
                                <p className="mt-1 text-sm text-gray-500">
                                    メールを受け取りたい時間帯を選択してください
                                </p>
                            </div>

                            <Button type="submit" className="w-full">
                                配信設定を保存
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Interested Categories */}
                <Card>
                    <CardHeader>
                        <CardTitle>興味のあるカテゴリー</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={updateUserPreferences} className="space-y-4">
                            <input type="hidden" name="userId" value={user.id} />

                            <p className="text-sm text-gray-600 mb-4">
                                興味のあるビジネスカテゴリーを選択してください（複数選択可）
                            </p>

                            <div className="space-y-3">
                                {[
                                    { value: 'saas', label: 'SaaS / ソフトウェア' },
                                    { value: 'ecommerce', label: 'Eコマース / 物販' },
                                    { value: 'app', label: 'モバイルアプリ' },
                                    { value: 'content', label: 'コンテンツビジネス' },
                                    { value: 'service', label: 'サービス業' },
                                    { value: 'other', label: 'その他' },
                                ].map((category) => (
                                    <label key={category.value} className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="interested_categories"
                                            value={category.value}
                                            defaultChecked={userData?.interested_categories?.includes(category.value)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">{category.label}</span>
                                    </label>
                                ))}
                            </div>

                            <Button type="submit" className="w-full">
                                カテゴリー設定を保存
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Payment Management */}
                <Card>
                    <CardHeader>
                        <CardTitle>お支払い情報</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                            クレジットカード情報の変更、請求履歴の確認、サブスクリプションの解約などはStripeの管理画面で行えます。
                        </p>
                        <form action={async () => {
                            'use server';
                            if (userData?.stripe_customer_id) {
                                await createPortalSession(userData.stripe_customer_id);
                            }
                        }}>
                            <Button
                                variant="outline"
                                className="w-full"
                                disabled={!userData?.stripe_customer_id}
                                title={!userData?.stripe_customer_id ? 'Stripe顧客IDが見つかりません' : 'お支払い情報を管理'}
                            >
                                Stripe管理画面を開く
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
