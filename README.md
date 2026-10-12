# nh-works

エンジニア 長谷錦（Hase Nishiki）のポートフォリオサイトです。
個人開発した Chrome 拡張機能・Web アプリ・開発支援ツールなどをまとめています。

- **公開 URL**：https://nishiki-hase03.github.io/nh-works/
- **プロフィール**：[profile.html](./profile.html)（経歴・技術・資格）

## 作品一覧

### Chrome拡張機能（Chrome ウェブストアで公開中・9本）

9本すべて、AI エージェント型の開発環境 Google Antigravity を活用して開発しました。

| 作品 | 説明 |
|---|---|
| [Date Format Copier](https://chromewebstore.google.com/detail/fpejmpkmjikddohmgahkkeelnfkfplel) | 日付を好きな形式に変えてコピーできる |
| [slimDiff](https://chromewebstore.google.com/detail/gikdfpnfcegkihalddhhpaoehbamilii) | 2つのテキストの違いを比較して表示する |
| [Domain Notepad](https://chromewebstore.google.com/detail/iknbibjpdkflbocpldklmnbfmccfddni) | Web サイト（ドメイン）ごとにメモを残せる |
| [slimViewer](https://chromewebstore.google.com/detail/ocnhkohndmgfhefdenphiebnimepdmmo) | Web ページの文字を読みやすく整えて表示する |
| [Smart Table of Contents](https://chromewebstore.google.com/detail/ekchhdamcldgpdoinkflcfeiojoanfif) | ページの見出しから目次を自動で作る |
| [slimEditor for Chrome](https://chromewebstore.google.com/detail/jlonkdichpgcfdmofdeoajbpeanfbajl) | ブラウザで使えるシンプルなメモ帳 |
| [MemoDock](https://chromewebstore.google.com/detail/lmjhgkdlbjajeoeokhckmaephfbofhol) | ドラッグ＆ドロップでテキストをメモできる |
| [文字コードシーザー暗号](https://chromewebstore.google.com/detail/fdhchlcchagcldpldpbehgdhfnkhhcil) | 文字コードをずらして暗号化・復号する |
| [腕木通信オーバーレイ](https://chromewebstore.google.com/detail/bmieiplenngacjhcbllpdhibdodochnn) | Web ページ上で文字を腕木通信の動きで表示する |

### Webアプリ

| 作品 | 説明 | 使用技術 |
|---|---|---|
| [対戦用パーティランダム生成](https://poke-front-two.vercel.app/) | ポケモン対戦用のパーティをランダムに作る | Next.js、Flask、Vercel |

### 開発系ツール

| 作品 | 説明 | 使用技術 |
|---|---|---|
| シーケンス図作成ツール（[Mermaid版](./sequence-m/) / [PlantUML版](./sequence-p/)） | フォームでライフラインとメッセージを追加し、ドラッグで並べ替えながらシーケンス図を作れる。コードのコピーと PNG での保存に対応 | JavaScript、Mermaid、PlantUML |
| クラス図作成ツール（[Mermaid版](./class-m/) / [PlantUML版](./class-p/)） | クラス・属性・操作と、関係（継承・実装・集約・コンポジションなど）や多重度をフォームで指定してクラス図を作れる | JavaScript、Mermaid、PlantUML |
| [Markdownエディタ](./md-editor/) | ブラウザでフォルダを開いて Markdown を編集できる。Mermaid・PlantUML の図、数式、目次、変更前後の差分を表示でき、PWA としてインストールもできる | JavaScript、File System Access API、marked、Mermaid、KaTeX、PWA |

### 業務系ツール

| 作品 | 説明 | 使用技術 |
|---|---|---|
| [予定共有アプリ](./calendar/) | カレンダーで日ごとの都合（○△×）を入力し、URL や QR コードで共有できる。予定は URL の中に圧縮して入れるので、サーバーもログインも不要 | React、TypeScript、Vite、Tailwind CSS |
| [slimEditor](./slimEditor/) | Esc キーを押すだけで自動保存して終了する、Windows 用の軽量テキストエディタ。最前面表示・透過・ダークモードに対応 | C、Win32 API、GCC（MinGW） |

### 趣味・実験（歴史上の通信方式をブラウザで再現）

| 作品 | 説明 | 使用技術 |
|---|---|---|
| [腕木通信](./semaphore/) | 入力した文章を、腕木通信の腕の動きでアニメーション表示する | JavaScript、CSS |
| [手旗信号](./flag/) | 入力したカタカナの文を、手旗信号の動作で表示する | JavaScript、jQuery、SVG |
| [単針式電信機](./single-needle/) | 1本の針を左右に振る順番の組み合わせで、アルファベットを1文字ずつ送る様子を再現する | JavaScript、jQuery、SVG |
| [2針式電信機](./double-needle/) | 左右2本の針の振れの組み合わせで文字を送る様子を再現する | JavaScript、jQuery、SVG |
| [5針式電信機](./five-needle/) | 5本の針のうち2本を傾けて、盤面上の文字を指し示す様子を再現する | JavaScript、jQuery、SVG |
| [シャッター通信](./shutter/) | シャッターの開け閉めのパターンで文字を送る様子を再現する | JavaScript、jQuery、SVG |

## 技術構成

- **静的サイト**：HTML / CSS / JavaScript のみで、サーバー側の処理はありません。フレームワークは使っていません。
- **CSS**：Tailwind CSS v4 を CLI（`@tailwindcss/cli`）でビルドし、`dist/output.css` を各ページから読み込んでいます。
- **公開**：GitHub Pages（`main` ブランチの内容をそのまま公開）。ビルド済みの `dist/output.css` もリポジトリに含めています。

## ビルド方法

Node.js が必要です。

```bash
npm install       # 初回のみ
npm run build     # src/input.css → dist/output.css（minify）
npm run dev       # 変更を監視して自動でビルド（開発中）
```

- Tailwind のクラスを抽出する対象は、[src/input.css](./src/input.css) の `@source` で指定しています（`index.html`、`inquiry.html`、`profile.html`、`slimEditor/index.html`）。
- **HTML を変更したら `npm run build` を実行し、`dist/output.css` も一緒にコミットします**（GitHub Pages はビルドを行わないため）。

### slimEditor の更新

ソースは [slimEditor/src/](./slimEditor/src/) にあります。ビルドには GCC（MinGW-w64）と Python（Pillow）が必要です。

1. `slimEditor/src/compile.bat` でアイコンを変換し、`slimEditor.exe` をビルドする。
2. `slimEditor.exe`・`README.md`・`LICENSE` を zip にまとめ、`slimEditor/software/slimEditor.zip` を置き換える。
3. [slimEditor/index.html](./slimEditor/index.html) に載せている SHA-256 を、新しい zip の値に書き換える。

## ディレクトリ構成

```
nh-works/
├── index.html            トップページ（作品一覧）
├── profile.html          プロフィール
├── inquiry.html          お問い合わせ（Google フォーム）
├── 404.html            ページが見つからないときのエラーページ
├── src/input.css         Tailwind の入力（@source の指定など）
├── dist/output.css       Tailwind のビルド結果（コミット対象）
├── img/                  favicon・プロフィール画像・作品のスクリーンショット（works/）
├── js/                   共通ライブラリ（jQuery）
├── sequence-m/ sequence-p/   シーケンス図作成ツール（Mermaid版・PlantUML版）
├── class-m/ class-p/         クラス図作成ツール（Mermaid版・PlantUML版）
├── md-editor/                Markdownエディタ
├── calendar/                 予定共有アプリ（ビルド済みのファイル）
├── slimEditor/               slimEditor の紹介ページ・配布用 zip・ソース（src/）
├── semaphore/ flag/ shutter/                    腕木通信・手旗信号・シャッター通信
├── single-needle/ double-needle/ five-needle/   電信機（単針式・2針式・5針式）
└── CLAUDE.md             AI（Claude Code）への作業指示書
```

## AI を活用した開発の進め方

このサイトは、AI コーディングエージェントを使って開発しています。

- **2026年2月ごろ**：Google Antigravity で、エラーページの作成や Markdown エディタの開発などを進めた。
- **2026年10月**：Claude Code でサイト全体をリニューアルした（不要ファイルの整理、Tailwind CSS v4 への移行、トップページ・プロフィールの作り直し、この README の作成など）。

### CLAUDE.md（作業指示書）

[CLAUDE.md](./CLAUDE.md) は、AI に渡している作業指示書です。次の内容を書いています。

- サイトの目的と、見る人（採用担当者・面接官・エージェント）
- サイトや README に載せてよい事実（経歴・技術・資格・実績）。これ以外を推測で書き足さないこと
- 作業ルール：作業用ブランチで作業する、計画を本人が承認してから実装する、コミットは本人が差分を確認してから行う、個人情報を書かない、など
- タスク一覧と進み具合

### 進め方と品質の担保

1. AI がコードを読み、計画（変更内容・対象ファイル・確認方法）を出す。
2. **本人が計画を確認し、承認する。** 前提が不明な点は、AI が推測せずに質問する。
3. AI が実装し、確認する。見た目の変更は、ヘッドレス Chrome で変更前後のスクリーンショットを撮って1ピクセルずつ比べる。リンク切れやコンソールエラーも確認する。
4. **本人が差分と表示を確認してからコミットする。**
5. タスクごとに、計画・作業項目・実施内容と本人のレビューで修正した点を、作業記録として残す（作業記録は公開していない）。
