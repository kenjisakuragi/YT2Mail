# YT2Mail - Starter Story Insights (JP)

海外のスモールビジネス・副業の成功事例を紹介するYouTube動画を自動分析し、日本語の詳細記事として配信するSaaSプラットフォーム。

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payment-purple)](https://stripe.com/)

---

## 🚀 主要機能

- ✅ **YouTube動画の自動分析** - Gemini AIによる音声文字起こし＆ビジネス分析
- ✅ **日本語記事生成** - 3000-4000文字の詳細記事を自動作成
- ✅ **マルチチャンネル対応** - 複数のYouTubeチャンネルから自動収集
- ✅ **サブスクリプション管理** - Stripe統合（7日間無料トライアル）
- ✅ **ユーザー設定** - メール配信頻度・興味カテゴリーのカスタマイズ
- ✅ **Markdown表示** - 美しく読みやすい記事レイアウト

---

## 📚 ドキュメント

- **[システム仕様書](docs/SYSTEM_SPECIFICATION.md)** - 技術スタック、データベース設計、API仕様
- **[運用マニュアル](docs/OPERATIONS_MANUAL.md)** - 日常運用、チャンネル管理、メンテナンス
- **[おすすめチャンネル](docs/recommended-channels.md)** - 追加推奨YouTubeチャンネルリスト

---

## 🛠️ 技術スタック

### フロントエンド
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- react-markdown

### バックエンド
- Supabase (PostgreSQL)
- Stripe (決済)
- Google Gemini 2.0 (AI分析)
- YouTube Data API
- Resend (メール配信)

---

## 📦 セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd YT2Mail
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルを作成：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx

# Google APIs
GEMINI_API_KEY=AIzaxxx
YOUTUBE_API_KEY=AIzaxxx

# Email
RESEND_API_KEY=re_xxx

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. データベースマイグレーション

Supabase Studioで以下のSQLを実行：

```bash
# マイグレーションファイルを確認
cat supabase/migrations/*.sql
```

1. `20260121_add_user_preferences.sql`
2. `20260121_add_multi_channel_support.sql`

### 5. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

---

## 📖 使い方

### チャンネル追加

```bash
# YouTubeチャンネルを追加
npx tsx scripts/add-channel.ts "https://www.youtube.com/@MyFirstMillionPod" business
```

### 動画インポート

```bash
# チャンネルから最新10件を取得
npx tsx scripts/import-channel-videos.ts "<channel_id>" 10
```

### 進捗確認

```bash
# インポート状況を確認
npx tsx scripts/check-import-progress.ts
```

詳細は [運用マニュアル](docs/OPERATIONS_MANUAL.md) を参照。

---

## 🗂️ プロジェクト構成

```
YT2Mail/
├── app/                    # Next.js App Router
│   ├── page.tsx            # ランディングページ
│   ├── dashboard/          # ダッシュボード
│   ├── settings/           # マイページ
│   └── api/webhooks/       # Stripe Webhook
├── components/             # Reactコンポーネント
├── lib/                    # ユーティリティ
├── scripts/                # 管理スクリプト
├── supabase/migrations/    # DBマイグレーション
└── docs/                   # ドキュメント
```

---

## 🔧 主要スクリプト

| スクリプト | 説明 |
|-----------|------|
| `add-channel.ts` | YouTubeチャンネルを追加 |
| `import-channel-videos.ts` | 動画をインポート |
| `list-channels.ts` | チャンネル一覧表示 |
| `update-video-metadata.ts` | メタデータ更新 |
| `fill-missing-articles.ts` | 記事補完 |
| `remove-shorts.ts` | ショート動画削除 |
| `fix-bad-titles.ts` | タイトル修正 |

---

## 🚢 デプロイ

### Vercelへのデプロイ

1. GitHubにプッシュ
2. Vercelでプロジェクト作成
3. 環境変数を設定
4. 自動デプロイ

詳細は [システム仕様書](docs/SYSTEM_SPECIFICATION.md#デプロイ手順) を参照。

---

## 📝 ライセンス

MIT License

---

## 🤝 コントリビューション

プルリクエスト歓迎！

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 サポート

- **ドキュメント:** [docs/](docs/)
- **Issue:** [GitHub Issues](<repository-url>/issues)
- **Email:** [Your Email]

---

**Built with ❤️ using Next.js, Supabase, and Gemini AI**
