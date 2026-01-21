# YT2Mail 運用マニュアル

**対象:** システム管理者・運用担当者  
**最終更新:** 2026-01-21

---

## 📚 目次

1. [日常運用](#日常運用)
2. [チャンネル管理](#チャンネル管理)
3. [動画処理](#動画処理)
4. [メンテナンス](#メンテナンス)
5. [よくある質問](#よくある質問)

---

## 日常運用

### 毎日の作業フロー

#### 1. 新着動画の確認
```bash
# 全チャンネルの状況確認
npx tsx scripts/list-channels.ts
```

#### 2. 動画インポート（手動）
```bash
# 各チャンネルから最新5件を取得
npx tsx scripts/import-channel-videos.ts <channel_id> 5
```

#### 3. 進捗確認
```bash
# インポート状況を確認
npx tsx scripts/check-import-progress.ts
```

### 週次作業

#### 1. 新規チャンネル検討
- `docs/recommended-channels.md` を参照
- 候補チャンネルを選定
- テスト追加（5件程度）

#### 2. 品質チェック
- 記事の内容確認
- タイトルの適切性チェック
- サムネイル確認

#### 3. データクリーンアップ
```bash
# ショート動画削除
npx tsx scripts/remove-shorts.ts

# タイトル修正
npx tsx scripts/fix-bad-titles.ts
```

---

## チャンネル管理

### 新規チャンネル追加

#### ステップ1: チャンネル情報を追加
```bash
npx tsx scripts/add-channel.ts "<YouTubeチャンネルURL>" <カテゴリー>
```

**カテゴリー一覧:**
- `business` - 一般ビジネス
- `saas` - SaaS/ソフトウェア
- `ecommerce` - Eコマース/物販
- `side_hustle` - 副業
- `app` - モバイルアプリ
- `content` - コンテンツビジネス

**例:**
```bash
# My First Million を追加
npx tsx scripts/add-channel.ts "https://www.youtube.com/@MyFirstMillionPod" business

# MicroConf を追加
npx tsx scripts/add-channel.ts "https://www.youtube.com/@MicroConf" saas
```

#### ステップ2: テスト動画を取得
```bash
# 追加したチャンネルから5件取得
npx tsx scripts/import-channel-videos.ts "<channel_id>" 5
```

#### ステップ3: 品質確認
1. ダッシュボードで記事を確認
2. 内容が適切か評価
3. 問題なければ継続、問題あればチャンネル削除

### チャンネル一覧確認

```bash
# 全チャンネル表示
npx tsx scripts/list-channels.ts

# 簡易表示
npx tsx scripts/quick-check-channels.ts
```

### チャンネル削除

Supabase Studioで手動削除：
```sql
DELETE FROM youtube_channels WHERE channel_id = 'UCxxx...';
```

---

## 動画処理

### 基本的なインポート

#### 単一チャンネルから取得
```bash
npx tsx scripts/import-channel-videos.ts "<channel_id>" <件数>

# 例: 10件取得
npx tsx scripts/import-channel-videos.ts "UCyaN6mg5u8Cjy2ZI4ikWaug" 10
```

#### 複数チャンネルから取得
```bash
# チャンネル1
npx tsx scripts/import-channel-videos.ts "UCyaN6mg5u8Cjy2ZI4ikWaug" 5

# チャンネル2
npx tsx scripts/import-channel-videos.ts "UCzOAAJUiSO2uyu1xyxw__2Q" 5

# チャンネル3
npx tsx scripts/import-channel-videos.ts "UCHoBKQDRkJcOY2BO47q5Ruw" 5
```

### 処理時間の目安

- **1動画あたり:** 3-5分
- **10動画:** 30-50分
- **50動画:** 2.5-4時間

**推奨:** バックグラウンドで実行し、定期的に進捗確認

### 進捗確認

```bash
# 現在の処理状況を確認
npx tsx scripts/check-import-progress.ts
```

---

## メンテナンス

### 1. 動画メタデータ更新

YouTube APIから最新のタイトル・サムネイルを取得：

```bash
npx tsx scripts/update-video-metadata.ts
```

**実行タイミング:**
- 新規チャンネル追加後
- タイトルが英語のまま残っている場合
- サムネイルが欠けている場合

### 2. 詳細記事の補完

既存動画で記事が生成されていない場合に実行：

```bash
npx tsx scripts/fill-missing-articles.ts
```

**注意:** 
- Gemini APIクォータを消費
- 処理時間が長い（1動画3-5分）
- バックグラウンド実行推奨

### 3. ショート動画削除

60秒以下の動画を自動検出・削除：

```bash
npx tsx scripts/remove-shorts.ts
```

**実行タイミング:**
- 週1回程度
- 新規チャンネル追加後

### 4. タイトル修正

マークダウン記号が残っているタイトルを修正：

```bash
npx tsx scripts/fix-bad-titles.ts
```

**修正対象:**
- `**Option 1**` などの選択肢表記
- マークダウン記号（`**`, `*`, `#`）
- 英語のままのタイトル

---

## よくある質問

### Q1: 動画インポートが失敗する

**A:** 以下を確認してください：

1. **YouTube API クォータ**
   - Google Cloud Console でクォータ確認
   - 1日10,000ユニットまで

2. **Gemini API クォータ**
   - Google AI Studio でクォータ確認
   - Free tier: 15 RPM, 1M TPM

3. **動画の種類**
   - 年齢制限動画は処理不可
   - プライベート動画は処理不可
   - ショート動画は自動除外

### Q2: 記事の品質が低い

**A:** 以下を試してください：

1. **プロンプト調整**
   - `scripts/import-channel-videos.ts` の `SYSTEM_INSTRUCTION` を編集

2. **チャンネル選定**
   - 質の高いコンテンツのチャンネルを選ぶ
   - 登録者数10万人以上を目安

3. **手動修正**
   - Supabase Studioで直接編集可能

### Q3: マークダウンが表示されない

**A:** 以下を確認：

1. **パッケージインストール**
   ```bash
   npm install react-markdown remark-gfm
   ```

2. **開発サーバー再起動**
   ```bash
   # Ctrl+C で停止
   npm run dev
   ```

### Q4: Stripe決済が反映されない

**A:** Webhook設定を確認：

1. Stripe Dashboard → Developers → Webhooks
2. Endpoint URL: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.*`
4. Webhook Secret を `.env.local` に設定

### Q5: データベースエラーが出る

**A:** マイグレーション実行：

1. Supabase Studio → SQL Editor
2. `supabase/migrations/*.sql` を実行
3. エラーメッセージを確認

---

## 緊急時の対応

### サービス停止時

1. **Vercel ダッシュボード確認**
   - デプロイログを確認
   - エラーメッセージを特定

2. **ロールバック**
   ```bash
   git revert HEAD
   git push
   ```

3. **環境変数確認**
   - Vercel Dashboard → Settings → Environment Variables
   - 必要な変数がすべて設定されているか確認

### データ損失時

1. **Supabase バックアップ確認**
   - Supabase Dashboard → Database → Backups
   - 最新のバックアップから復元

2. **再インポート**
   ```bash
   # チャンネル情報を再追加
   npx tsx scripts/add-channel.ts <url> <category>
   
   # 動画を再取得
   npx tsx scripts/import-channel-videos.ts <channel_id> <count>
   ```

---

## 連絡先

**技術サポート:** [Your Email]  
**緊急連絡:** [Your Phone]

---

**最終更新:** 2026-01-21
