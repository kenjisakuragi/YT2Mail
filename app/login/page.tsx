
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2, TrendingUp, Zap, Globe } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [mode, setMode] = useState<'magic-link' | 'password'>('magic-link')
    const router = useRouter()
    const supabase = createClient()

    const handleMagicLinkLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        })

        if (error) {
            setMessage({ type: 'error', text: error.message })
        } else {
            setMessage({ type: 'success', text: '認証メールを送信しました。メールボックスを確認してください。' })
        }
        setLoading(false)
    }

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setMessage({ type: 'error', text: 'ログインに失敗しました。メールアドレスまたはパスワードを確認してください。' })
            setLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="flex min-h-screen bg-white selection:bg-blue-100">
            {/* Left Side: Visuals & Benefits (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gray-900 text-white">
                <div className="absolute inset-0 opacity-40">
                    <img
                        src="/login-bg.png" /* This would be the mapping for the generated image or similar */
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-transparent to-black/90"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-12">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <TrendingUp className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Starter Story Insights</span>
                    </div>

                    <div className="space-y-12 max-w-md">
                        <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
                            情報の差が、<br />
                            ビジネスの差になる。
                        </h2>

                        <div className="space-y-8">
                            {[
                                {
                                    icon: <Zap className="text-yellow-400" />,
                                    title: "30分の動画を、3分で吸収",
                                    desc: "AIが要点を徹底分析。時間を無駄にせずコアな知識だけを習得。"
                                },
                                {
                                    icon: <Globe className="text-blue-400" />,
                                    title: "世界基準の成功事例を日本語で",
                                    desc: "海外で話題のビジネスモデルや集客戦略を、即実行可能な形で解説。"
                                },
                                {
                                    icon: <CheckCircle2 className="text-green-400" />,
                                    title: "あなたのアイデアを加速させる",
                                    desc: "収益性から使用ツール、日本での応用案までを構造化して提供。"
                                }
                            ].map((benefit, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                        {benefit.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{benefit.title}</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">{benefit.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 pt-10 border-t border-white/10">
                    <p className="text-sm text-gray-500">
                        &copy; 2026 Starter Story Insights (JP). 毎日更新中。
                    </p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 bg-gray-50/50">
                <div className="max-w-md w-full mx-auto space-y-10">
                    {/* Header */}
                    <div className="space-y-3">
                        <div className="lg:hidden flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <TrendingUp className="text-white w-5 h-5" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">Starter Story Insights</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {mode === 'magic-link' ? 'おかえりなさい！' : 'パスワードでログイン'}
                        </h1>
                        <p className="text-gray-500">
                            最新のビジネスインサイトにアクセスしましょう。
                        </p>
                    </div>

                    {/* Tabs-like Switch */}
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => setMode('magic-link')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'magic-link' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            マジックリンク
                        </button>
                        <button
                            onClick={() => setMode('password')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'password' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            パスワード
                        </button>
                    </div>

                    {/* Alert Messages */}
                    {message && (
                        <div className={`p-4 rounded-xl flex items-start gap-3 border transition-all animate-in fade-in slide-in-from-top-2 ${message.type === 'success'
                                ? 'bg-green-50 border-green-100 text-green-800'
                                : 'bg-red-50 border-red-100 text-red-800'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <Loader2 className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                            <p className="text-sm font-medium leading-relaxed">{message.text}</p>
                        </div>
                    )}

                    {/* Form */}
                    <div className="space-y-6">
                        {mode === 'magic-link' ? (
                            <form onSubmit={handleMagicLinkLogin} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">メールアドレス</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <Input
                                            type="email"
                                            placeholder="you@example.com"
                                            className="h-12 pl-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'マジックリンクを送信'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handlePasswordLogin} className="space-y-5">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">メールアドレス</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <Input
                                                type="email"
                                                placeholder="you@example.com"
                                                className="h-12 pl-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-sm font-bold text-gray-700">パスワード</label>
                                            <Link href="#" className="text-xs text-blue-600 hover:underline font-medium">忘れた場合</Link>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                <Lock size={18} />
                                            </div>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="h-12 pl-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'ログイン'}
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Test User Option */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-100" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400">
                            <span className="bg-white px-4">あるいは</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-gray-600 text-sm mb-4">
                            アカウントをお持ちでないですか？
                        </p>
                        <Link href="/login" onClick={() => setMode('magic-link')}>
                            <Button variant="outline" className="w-full h-12 rounded-xl text-blue-600 border-blue-100 hover:bg-blue-50 hover:text-blue-700 border-2 font-bold transition-all">
                                7日間の無料トライアルを始める
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    {/* Social Proof / Trust */}
                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-center gap-4 text-xs font-medium text-gray-400">
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-blue-500" /> カード登録不要のトライアル</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-blue-500" /> いつでも解約可能</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
