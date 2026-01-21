# YT2Mail システム仕様書

**バージョン:** 1.0  
**最終更新:** 2026-01-21  
**プロジェクト名:** Starter Story Insights (JP)

---

## 📋 目次

1. [システム概要](#システム概要)
2. [技術スタック](#技術スタック)
3. [データベース設計](#データベース設計)
4. [主要機能](#主要機能)
5. [ディレクトリ構成](#ディレクトリ構成)
6. [環境変数](#環境変数)
7. [スクリプト一覧](#スクリプト一覧)
8. [API・外部サービス](#api外部サービス)
9. [デプロイ手順](#デプロイ手順)
10. [トラブルシューティング](#トラブルシューティング)

---

## システム概要

### プロジェクトの目的
海外のスモールビジネス・副業の成功事例を紹介するYouTube動画を自動的に分析し、日本語の詳細記事として配信するSaaSプラットフォーム。

### 主要な価値提供
- YouTube動画の音声を自動文字起こし
- Gemini AIによるビジネス分析と日本語記事生成
- サブスクリプション型（7日間無料トライアル、月額¥980）
- 複数チャンネル対応のマルチソース管理

---

## 技術スタック

### フロントエンド
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Markdown Rendering:** react-markdown, remark-gfm

### バックエンド
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Payment:** Stripe (Checkout & Billing Portal)
- **AI Analysis:** Google Gemini 2.0 Flash Lite
- **Video Processing:** ytdl-core (YouTube download)

### インフラ
- **Hosting:** Vercel (推奨)
- **Storage:** Supabase Storage
- **Email:** Resend (メール配信)

---

## データベース設計

### テーブル構成

#### 1. `users`
ユーザー情報とサブスクリプション状態を管理

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'unpaid',
    trial_end_date TIMESTAMP,
    is_admin BOOLEAN DEFAULT false,
    email_frequency VARCHAR(20) DEFAULT 'daily',
    email_time VARCHAR(10) DEFAULT '07:00',
    interested_categories TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);
```

**主要カラム:**
- `subscription_status`: 'active' | 'trialing' | 'canceled' | 'past_due' | 'unpaid'
- `email_frequency`: 'daily' | 'three_per_week' | 'weekly' | 'off'
- `interested_categories`: ['saas', 'ecommerce', 'app', 'content', 'side_hustle']

#### 2. `youtube_channels`
管理対象のYouTubeチャンネル情報

```sql
CREATE TABLE youtube_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id VARCHAR(255) UNIQUE NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    channel_url TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50),
    subscriber_count INTEGER,
    is_active BOOLEAN DEFAULT true,
    last_checked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**カテゴリー:**
- `business`: 一般ビジネス
- `saas`: SaaS/ソフトウェア
- `ecommerce`: Eコマース/物販
- `side_hustle`: 副業
- `app`: モバイルアプリ
- `content`: コンテンツビジネス

#### 3. `videos`
処理済み動画と分析結果

```sql
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yt_video_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary_json JSONB NOT NULL,
    published_at TIMESTAMP,
    thumbnail_url TEXT,
    channel_id UUID REFERENCES youtube_channels(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

**summary_json 構造:**
```json
{
  "business_overview": "ビジネスモデルの概要",
  "key_metrics": "月商、利益率などの数値",
  "acquisition_strategy": "顧客獲得戦略",
  "tools_used": "使用ツール・スタック",
  "japan_application": "日本市場への応用アイデア",
  "detailed_article": "3000-4000文字の詳細記事（Markdown形式）",
  "transcript": "動画の文字起こし全文"
}
```

#### 4. `delivery_logs`
メール配信履歴

```sql
CREATE TABLE delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    video_id UUID REFERENCES videos(id),
    sent_at TIMESTAMP DEFAULT NOW()
);
```

---

## 主要機能

### 1. ユーザー認証・サブスクリプション
- **ログイン/サインアップ:** Supabase Auth（メール認証）
- **サブスクリプション:** Stripe Checkout（7日間無料トライアル）
- **支払い管理:** Stripe Billing Portal

### 2. 動画処理パイプライン
1. YouTube動画の音声ダウンロード（ytdl-core）
2. Gemini APIへアップロード
3. AI分析（文字起こし + ビジネス分析）
4. 日本語記事生成
5. Supabaseへ保存

### 3. マルチチャンネル管理
- チャンネル追加・編集
- カテゴリー分類
- 自動/手動インポート
- 処理状況ダッシュボード

### 4. ユーザー設定（マイページ）
- メール配信頻度・時刻設定
- 興味カテゴリー選択
- アカウント情報管理
- 支払い情報管理

### 5. コンテンツ表示
- ランディングページ（カルーセル表示）
- ダッシュボード（動画一覧）
- 詳細ページ（Markdown記事表示）

---

## ディレクトリ構成

```
YT2Mail/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # ランディングページ
│   ├── login/                    # ログインページ
│   ├── dashboard/                # ダッシュボード
│   │   ├── page.tsx              # 動画一覧
│   │   └── videos/[id]/          # 動画詳細
│   ├── settings/                 # マイページ
│   │   ├── page.tsx
│   │   └── actions.ts            # Server Actions
│   └── api/                      # API Routes
│       └── webhooks/
│           └── stripe/           # Stripe Webhook
├── components/                   # Reactコンポーネント
│   ├── ui/                       # shadcn/ui
│   └── VideoCarousel.tsx         # カルーセル
├── lib/                          # ユーティリティ
│   ├── supabase/                 # Supabase クライアント
│   ├── stripe/                   # Stripe 設定
│   ├── gemini/                   # Gemini API
│   ├── youtube/                  # YouTube処理
│   └── types.ts                  # 型定義
├── scripts/                      # 管理スクリプト
│   ├── add-channel.ts            # チャンネル追加
│   ├── import-channel-videos.ts  # 動画インポート
│   ├── list-channels.ts          # チャンネル一覧
│   ├── update-video-metadata.ts  # メタデータ更新
│   ├── fill-missing-articles.ts  # 記事補完
│   ├── remove-shorts.ts          # ショート削除
│   └── fix-bad-titles.ts         # タイトル修正
├── supabase/
│   └── migrations/               # DBマイグレーション
├── docs/                         # ドキュメント
│   └── recommended-channels.md   # おすすめチャンネル
└── .env.local                    # 環境変数
```

---

## 環境変数

`.env.local` に以下を設定：

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

---

## スクリプト一覧

### チャンネル管理

#### チャンネル追加
```bash
npx tsx scripts/add-channel.ts <channel_url> [category]

# 例
npx tsx scripts/add-channel.ts "https://www.youtube.com/@MyFirstMillionPod" business
```

#### チャンネル一覧表示
```bash
npx tsx scripts/list-channels.ts
```

#### チャンネル確認（簡易版）
```bash
npx tsx scripts/quick-check-channels.ts
```

### 動画処理

#### チャンネルから動画インポート
```bash
npx tsx scripts/import-channel-videos.ts <channel_id> [max_videos]

# 例: 最新10件をインポート
npx tsx scripts/import-channel-videos.ts "UCyaN6mg5u8Cjy2ZI4ikWaug" 10
```

#### インポート進捗確認
```bash
npx tsx scripts/check-import-progress.ts
```

### メンテナンス

#### 動画メタデータ更新（タイトル・サムネイル）
```bash
npx tsx scripts/update-video-metadata.ts
```

#### 詳細記事の補完（既存動画）
```bash
npx tsx scripts/fill-missing-articles.ts
```

#### ショート動画削除
```bash
npx tsx scripts/remove-shorts.ts
```

#### タイトル修正（マークダウン記号除去）
```bash
npx tsx scripts/fix-bad-titles.ts
```

---

## API・外部サービス

### 1. Supabase
- **用途:** データベース、認証、ストレージ
- **料金:** Free tier（開始時）
- **設定:** https://supabase.com/dashboard

### 2. Stripe
- **用途:** サブスクリプション決済
- **料金:** 取引手数料 3.6%
- **設定:** https://dashboard.stripe.com

### 3. Google Gemini API
- **用途:** 動画分析、文字起こし、記事生成
- **料金:** Free tier（月間制限あり）
- **設定:** https://aistudio.google.com/apikey

### 4. YouTube Data API
- **用途:** チャンネル情報取得、動画メタデータ
- **料金:** Free（クォータ制限あり）
- **設定:** https://console.cloud.google.com

### 5. Resend
- **用途:** メール配信
- **料金:** Free tier 100通/日
- **設定:** https://resend.com/api-keys

---

## デプロイ手順

### Vercelへのデプロイ

1. **GitHubリポジトリ作成**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Vercelプロジェクト作成**
   - https://vercel.com/new
   - GitHubリポジトリを選択
   - Framework Preset: Next.js

3. **環境変数設定**
   - Vercel Dashboard → Settings → Environment Variables
   - `.env.local` の内容をすべて追加

4. **デプロイ**
   - 自動デプロイ（main ブランチへのpush時）

### Stripe Webhook設定

1. Vercel デプロイ後、URLを取得
2. Stripe Dashboard → Developers → Webhooks
3. Endpoint URL: `https://your-domain.vercel.app/api/webhooks/stripe`
4. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Webhook Secretを `.env.local` に追加

---

## トラブルシューティング

### 1. Gemini API エラー（404 Not Found）
**原因:** API キーが無効、またはプロジェクト設定の問題

**解決策:**
- Google AI Studio で新しいAPIキーを作成
- 新しいプロジェクトで「Free tier」を選択
- `.env.local` を更新

### 2. YouTube動画ダウンロード失敗
**原因:** 年齢制限、地域制限、プライベート動画

**解決策:**
- 動画URLを確認
- 公開動画のみ処理可能
- ショート動画は除外される

### 3. Stripe決済が反映されない
**原因:** Webhook未設定、または署名検証エラー

**解決策:**
- Webhook URLを確認
- `STRIPE_WEBHOOK_SECRET` が正しいか確認
- Stripe Dashboard でイベントログを確認

### 4. マークダウンが正しく表示されない
**原因:** `react-markdown` 未インストール

**解決策:**
```bash
npm install react-markdown remark-gfm
```

### 5. データベースマイグレーションエラー
**原因:** テーブルが存在しない

**解決策:**
- Supabase Studio → SQL Editor
- `supabase/migrations/*.sql` を実行

---

## 今後の拡張予定

### フェーズB: 管理画面（1-2週間後）
- `/admin/channels` ページ
- チャンネル追加・編集UI
- 動画インポートボタン
- 処理状況ダッシュボード

### フェーズA: 完全自動化（2-4週間後）
- Cron/GitHub Actions による定期実行
- チャンネル自動発見機能
- 品質フィルター
- メール配信自動化

### 追加機能候補
- ブックマーク機能
- 閲覧履歴
- コメント機能
- API連携（Notion, Slack）
- 多言語対応

---

## サポート・問い合わせ

**開発者:** [Your Name]  
**Email:** [Your Email]  
**GitHub:** [Repository URL]

---

**最終更新:** 2026-01-21  
**バージョン:** 1.0
