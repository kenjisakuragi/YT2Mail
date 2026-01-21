
import { Button } from '@/components/ui/button';
import { Lock, Zap } from 'lucide-react';
import { createCheckoutSession } from '@/lib/stripe/actions';

interface SubscribePromptProps {
    email: string;
    userId: string;
    title?: string;
    description?: string;
}

export function SubscribePrompt({ email, userId, title, description }: SubscribePromptProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 md:p-12 text-center shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-600 rounded-full blur-3xl opacity-10"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-indigo-600 rounded-full blur-3xl opacity-10"></div>

            <div className="relative z-10 max-w-lg mx-auto space-y-6">
                <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 ring-4 ring-white">
                    <Lock className="text-white w-8 h-8" />
                </div>

                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                    {title || "この先の分析レポートはプレミアム会員限定です"}
                </h2>

                <p className="text-gray-600 text-lg leading-relaxed">
                    {description || "30分の動画から抽出された詳細な創業ストーリー、戦略分析、そして日本市場への応用案。あなたのビジネスを加速させるヒントがここにあります。"}
                </p>

                <div className="pt-4 flex flex-col gap-4">
                    <form action={async () => {
                        'use server';
                        await createCheckoutSession(email, userId);
                    }}>
                        <Button size="lg" className="w-full h-14 text-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 group transition-all">
                            7日間無料で試す <Zap className="ml-2 w-5 h-5 group-hover:animate-pulse" />
                        </Button>
                    </form>
                    <p className="text-sm text-gray-500 font-medium">
                        トライアル期間中の解約なら料金は一切かかりません。<br />
                        その後は月額 ¥980 で毎日インサイトをお届けします。
                    </p>
                </div>

                <div className="flex items-center justify-center gap-6 pt-6 text-sm font-semibold text-gray-400">
                    <span className="flex items-center gap-1.5 underline decoration-blue-200 decoration-2 underline-offset-4">海外ビジネス最新事例</span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    <span className="flex items-center gap-1.5 underline decoration-blue-200 decoration-2 underline-offset-4">毎日午前8時配信</span>
                </div>
            </div>
        </div>
    );
}
