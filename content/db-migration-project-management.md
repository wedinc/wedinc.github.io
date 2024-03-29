---
title: '2ヶ月でDB移行とデータ分析基盤リプレイスを完遂するためのディレクション'
author: Yoshihiro Harada
tags: ProjectManagement
date: 2023-12-26
image:
---

WED株式会社で Android/iOSエンジニア兼エンジニアリングマネージャーをしている[dahhara](https://twitter.com/kuma_moooon)です。

開発領域としてはアプリ開発がメインですが、今回は色々あって **2ヶ月** で ONE の DB 移行及びデータ分析基盤のリプレイスのディレクションをすることになりました。

そこで心がけたことを書き連ねてみます。

プロジェクト推進としてはどれも基本的な内容だと思っていますが、イレギュラーなことが起きて課題解消にチャレンジするのはエンジニアの常、何かの参考になれば幸いです。

## ONE とは?

WED が提供する「お買い物をしてお金がもらえるアプリ」です。

プロダクトの特性の一つとして、ユーザーのレシートを買い取ってお金になるというものがあります。

この記事においては「大量のレシートを OCR したデータを沢山取り扱っている」という点を念頭に置いてもらえれば OK ですが、実際に触ってみたい方はぜひ下記からどうぞ。

[ONE のストアへ](https://wowone.onelink.me/550n/mj5a6g2a)

## ONE の課題

兼ねてから ONE はアクセス負荷について懸念があり、特にレシート買い取りのトラフィックが増えるお昼の時間帯はシステムが不安定になりがちでした。
その直接的な原因としては下記が挙げられます。

- 2022年-2023年にかけてのユーザー数の急激な増加
- レシート買い取りの口開けタイミングによる局所的なアクセス増加
- ユーザー数増加に伴う技術負債の顕在化

とりわけ、技術負債としては特に DB へのコネクション数がボトルネックとなっており、その解消を図るべく2023年は期初から GCP の CloudSQL からよりハイパフォーマンスな AlloyDB への移行をメンバーへ委譲して進めていました。

FYI.
[AlloyDB とは？](https://cloud.google.com/alloydb?hl=en)

## 何が起きたか

7月の終わり頃、オフィスについた途端にデータエンジニアの [thimi0412](https://twitter.com/thimi0412) さんに「dahhara さん、このままだとこれヤバいですよ」とアラートをもらったのが PJ 始動のきっかけです。

状況としては、国内での DB 移行事例がほぼない CloudSQL から AlloyDB への Migration 手順の確立に目処がついて、さあ後はいつ頃にユーザー周知をして進めるべきか、というところでした。

端的に書くと、これについてはチーム横断で影響を認識できる人が居なかったが故のコミュニケーションエラーなのですが、

1. ONE は OCR したレシートのデータを分析するために BigQuery(BQ) へ転送している。
2. BQ への転送処理は **エンジニアが誰もメンテナンスできないブラックボックス**。
3. AlloyDB 移行を行うと**既存の BQ 転送処理が破壊される**。
4. BQ 転送処理が破壊されると、**ビジネスサイドのデータ分析チームの業務も破壊される**。
5. そのため、データ分析基盤のフルリプレイスも行わないといけない。

とのこと。
その場にはビジネスサイド側のマネージャーも居り、3人で議論をした結果、

**「あ、これは確かにまずいわ」**

ということで見解が一致。

そして、ONE は11月頃に高トラフィックが予測される案件が約束されている状況。「それまでには DB 移行を済ませて、1ヶ月程度は安定稼働するか十分に経過を見たいね」と余裕を持って作業を進めていたつもりでした。

そういう訳で、今日は7月の末日。

つまり、10月までの2ヶ月で、

- データ分析基盤のフルリプレイスをする。
- サービス的に問題ないように DB 移行を完遂する。

をするために、今すぐ動かなければ間に合わない状態だったりしました。

## チームの立ち上げをしよう！！！！

上述した通りですが、あまりにも時間がないので速やかに行動を起こさなければなりません。そもそも DB 移行すら考慮することが多いのに、その上データ分析基盤のリプレイスもするとなると強いチームとそのチームが動きやすい環境を作り上げなければいけません。そのために、心がけたのは下記です。

1. DB 移行に関連する諸問題を事業的な影響に翻訳して、経営層の理解を得る。
2. この問題に立ち向かうためのリソースを確保する。

1は基本ではありますが、何よりもこの課題に立ち向かう人たちを会社として肯定して、力を振るいやすい環境にするべきだと考えました。そして、これはマネージャーの自分にしかできません。とはいえ、WED の経営層は技術的な課題について関心があるし、わからなければどういう意思決定が必要になるか議論できる環境だったので、理解を得るまでにそこまでの苦労はありませんでした。

2については、課題解消はエンジニアだけで完結できるものでなく、

- システム的に安定に稼働できるか。
- BQ へのデータ転送処理を運用可能な状態に再構築できるか。
- 転送されたデータについて、**ビジネス側**で利用できる形になっているか。

と言った観点で、それぞれの分野のスペシャリストを集めなければいけませんでした。しかし、この点においても課題への温度感が高いメンバーが既に居たり、他のマネージャーの許可を取った上で重要性を説明をしたら協力してもらえるメンバーが居たりと、非常に助かる状況でした。

かくして、DB 移行兼データ分析基盤のリプレイスをミッションとする職種横断の混合チーム DB 移行 PJ の発足です。

## チームの運営

プロジェクトの速やかな進行において、自分が避けたかったことは3つあります。

1. 認識齟齬による手戻りが起こる。
2. 飛び石の作業時間によりパフォーマンスの低下する。
3. チームのメンバーが「次何をするか」わからなくなる。

これらの課題に対して、2ヶ月の間に自分が取ったアプローチの一部を紹介。

### 水曜日は一日オフィスで作業

2ヶ月という制限がある かつ 失敗できないプロジェクトだったために、ちょっとだけ過激ですが **「水曜日はオフィスの一室にメンバーを閉じ込めてみんなで作業する」** にしました。良い子は真似しないでね。

これを一般的な銀の弾丸としないで欲しいですが、とはいえ

- メンバー全員で最終的なゴールを話して合意できる。
- 悩んだら前の人に聞いたほうが早いので、一人で考えるリードタイムが削減。
- お互いの役割上、多少言いづらい意見があっても議題にあげて落とし所を探れる。

といった効果はあったのかな、と思っています。

なお、余談ですがこの取り組みは「何やら dahhara がメンバーを部屋に閉じ込めて作業させているらしい」と社内としても目立つ取り組みだった(それはそう)ので、心配したプロジェクト外の人が差し入れに来てくれたりもしました。その節はありがとうございました。

![work-scene.jpg](content/db-migration-project-management/work-scene.jpg)

### 徹底的な Issues と議事録の管理

議論を停滞させる要因として自分が重たく見ているのは「忘れる」ことです。

前回の作業の延長として、どうしたら最初からエンジンが温まった状態で作業を開始できるかを考えた結果、下記をルーティーンとして**全員で**実行することにしました。

- 始業時
  - 前回やったことを議事録で確認する。
  - 今日やる Issue を確認する。
- 終業時
  - 今日やったことを議事録に残す。
  - 次回やることを Issue 化する。

何を当たり前のことを、ということかもしれませんがこれが基本だと思っています。

ポイントなのは「議事録も Issue も全員が必要だと思った意味があるもの」という共通認識を作ることです。誰かが作った議事録や、誰かが作った Issue はどうしてもプレゼンスが低くなりがちで、これを回避したい次第でした。

また、「ここを見とけば安心」という情報の一元管理の面でも効果はあったと思っています。

### Issue 管理の一部

![issues.png](content/db-migration-project-management/issues.png)

### 当時の議事録の例

![meeting-note.png](content/db-migration-project-management/meeting-note.png)

### 必要な人を都度アサインする

ある程度固定メンバーでプロジェクトを進めていましたが、

- 次の作業に自分は必要ではない
- この判断をするためにはあの人が必要だ

というケースが増えてきました。

例えば、ビジネス的なデータの分析の話をしているときには SRE エンジニアは必須じゃないな、とかこの方針で進めるためには社外調整が必要なのでビジネスサイドと話したい、などです。

そこで、水曜日の作業が終了して次回やることを整理するタイミングで「次の作業でアサインしたい人は誰か」というのも話すことにしました。この人が必要という意見が出れば「このプロジェクトにおいて何故あなたが必要なのか」というのを Google カレンダーのスケジュールに記載してその人を招待し、逆に来週の作業では手が空きそうな人は予定から思い切って解放、と言うのをしました。

リソースを必要最低限にするための取り組みでしたが、「とりあえずアサインする」のをやめてそれぞれのメンバーに期待する役割をお願いした結果、チームの議論の質はかなり高まったなというふりかえりはあります。

![next-member.png](content/db-migration-project-management/next-member.png)

## まとめ

かくして、色々とありましたがプロジェクトの顛末としては下記です。

- 9月末にはデータ分析基盤のリプレイスは完了
  - 新しいデータセットについて、既存業務への運用にのせる部分はビジネスサイドとデータエンジニアが協力して遂行。
- AlloyDB 移行は10月頭に完了
  - チームで深夜に実施。
  - いくつかのイレギュラーはあったが、事前に用意していた全ての手続き/検証が完了。

一時はどうなることかと思いましたが、完遂できてよかったです。
これらのプロジェクトを遂行した結果、

- アクセス負荷について取れる対策の選択肢が増えた。
- BQ を使った解析業務のコストが激減した。

などのよい効果が得られました。
これらに関連した技術的な取り組みは、下記にもまとまっているのでご一読いただければと思います。

[Datastream for BigQueryを本格導入した話](https://wedinc.github.io/datastream-for-bigquery)

[Datastreamで作成されたテーブルをパーティション化するスクリプトを作った](https://wedinc.github.io/datastream-partition)

最後に、自分がプロジェクトのディレクションで心がけたことは本当に基本的なことばかりです。

羅列したとしても、

- チームが力を出せるように社内認知を上げよう！
- プロジェクトに纏わる情報の最新化と一元管理を徹底しよう！
- 各メンバーに責任と役割を伝えてアサインしよう！

ということだけだと思っています。

とはいえ、このようなあたりまえを積み重ねた先に、あたりまえじゃないすごいことができるのだなとプロジェクトを通して再認識しています。

DB 移行とデータ分析基盤のリプレイスを同時にしなければいけないのはレアケースかと思いますが、プロジェクトの大小に関わらず何らかのチームをディレクションすることになったら、ぜひこれらのエッセンスの一欠片でも参考にしていただけると幸いです。
