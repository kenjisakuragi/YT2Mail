
# Deployment Guide (本番環境へのデプロイ手順)

このガイドでは、**Vercel** へのデプロイと本番環境設定について説明します。

## 1. 前提条件

以下のサービスのアカウントが必要です。
- **GitHub** (ソースコード管理)
- **Vercel** (ホスティング)
- **Supabase** (データベース & 認証)
- **Stripe** (決済)
- **Resend** (メール配信)
- **Google AI Studio** (Gemini API)
- **Google Cloud Console** (YouTube Data API)

## 2. 環境変数の設定 (Environment Variables)

Vercelのプロジェクト設定 > **Environment Variables** に以下を設定してください。

### 一般設定
| 変数名 | 説明 | 例 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | 本番サイトのURL（最後にスラッシュなし） | `https://yt2mail.vercel.app` |

### Supabase
| 変数名 | 説明 | 取得場所 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | プロジェクトURL | Supabase Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公開APIキー (anon) | Supabase Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | 管理者用キー (service_role) | Supabase Settings > API |

### Stripe (本番環境)
**重要**: Stripeダッシュボードの「本番環境データの表示」をオンにして取得してください。
| 変数名 | 説明 |
|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 公開キー (`pk_live_...`) |
| `STRIPE_SECRET_KEY` | 秘密キー (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook署名シークレット (`whsec_...`) |
| `STRIPE_PRICE_ID` | 本番環境で作った定期課金商品のPrice ID (`price_...`) |

### API Keys
| 変数名 | 説明 |
|---|---|
| `GEMINI_API_KEY` | Google AI Studioキー |
| `YOUTUBE_API_KEY` | Google Cloud ConsoleのAPIキー |
| `RESEND_API_KEY` | ResendのAPIキー |

## 3. 各サービスの設定

### Stripe
1. **商品の作成**: ダッシュボードで「月額プラン」を作成し、**Price ID** を控える。
2. **Webhookの設定**:
   - エンドポイント: `https://[あなたの本番ドメイン]/api/stripe-webhook`
   - イベント: 
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

### Supabase
1. **Authentication > URL Configuration**:
   - **Site URL**: `https://[あなたの本番ドメイン]`
   - **Redirect URLs**: `https://[あなたの本番ドメイン]/auth/callback` を追加。

### Resend (メール)
1. **Domains**: `[あなたの本番ドメイン]` を追加し、DNSレコード（DKIM/SPF）を設定してVerifiedにする。
2. **コード修正**: `lib/email/service.ts` の `from` アドレスを、認証済みドメインのアドレス（例: `insights@yourdomain.com`）に変更する。

## 4. 定期実行 (GitHub Actions)

毎朝8時の配信ジョブを動かすため、GitHubリポジトリの **Settings > Secrets and variables > Actions** に以下の変数を登録します。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `YOUTUBE_API_KEY`
- `RESEND_API_KEY`

---
これで本番環境の構築は完了です。
まずはご自身でサインアップ・決済を行い、正常に動作するか確認してください（本番クレジットカードでの少額決済テストを行い、あとで返金処理をすることをお勧めします）。
