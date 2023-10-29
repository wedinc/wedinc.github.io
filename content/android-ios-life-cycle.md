---
title: Android と iOS のライフサイクル
author: Yoshihiro Harada
tags: Android, iOS
date: 2022-06-30
image: android-ios-life-cycle.jpeg
---

# はじめに

こんにちは。Android / iOS エンジニアの原田です。

今回はネイティブアプリ開発では必ず意識しないといけないライフサイクルについて、Android と iOS をそれぞれ解説してみようかと思います。

ネイティブアプリ開発において、専門のプラットフォームではなくとも同じプロダクトの実装仕様を調べたりする機会があるかと思います。そんな時、まずは担当の開発者とコミュニケーションを取ると思いますが、こちらの確認観点を伝えるのに苦労したり、プラットフォームの違いから認識に齟齬があって回答が誤りだった、みたいな経験はありませんか？私はあります。
そんな時、やはり開発者の共通言語は技術だと自分は考えます。両 OS への理解の解像度が上がれば、より効率のよいコミュニケーションができます。もっと言えば、自分で調査から実装まで出来るので、何かと開発がやりやすくなる場面は多いです。

本記事は、そんなネイティブアプリの開発を学ぶ上で、一番基盤となるライフサイクルについて OS ごとに簡単にまとめてました。ぜひ、畑の違うプラットフォームについての翻訳書として、参考いただければと思います。

# 対象者

- iOS のコードを読む Android 開発者
- Android のコードを読む iOS 開発者

# 前提

- Android 側の解説は、 Activity よりも頻出であると考えられる Fragment を用います。
- iOS 側の解説は、UIViewController を用います。
- 執筆時点の環境は下記です。
    - Android 12
    - iOS 15

# Fragment Lifecycle

Fragment の Lifecycle は下記のようになります。プロダクトの設計や実装方針によって気にするべき状態は変わってきますが、どういう状況であっても知っていた方がいいと考えるのは赤枠で囲んだ6つです。

![Blank board - Page 1 (5).png](<content/android-ios-life-cycle/Blank_board_-_Page_1_(5).png>)

## onCreate()

Fragment が生成された時に一度だけ呼び出されます。

以降、Fragment が生存している限りは2回目が呼ばれることはありません。

## onCreateView()

Fragment に表示する View を生成する時に呼び出されます。返り値として、表示する View のインスタンスを返却する必要があります。

バックグラウンドからアプリを復帰させたり、別の画面へ遷移してからバックキーで戻ってきた場合など、画面を再表示するたびに呼び出されます。

## onViewCreated()

View が生成された後に呼び出されます。

引数として、 `onCreateView` で返却した View が渡ってくるため、ここで View の表示内容や制御等の初期化を行うことが多いです。

iOS 開発者に注意する点があるとするなら、**この時点では View のサイズが決定していない**ため、View のサイズを使って座標を計算したりすることはできません。もっと言うなら、Android には`viewWillLayoutSubViews()` のような状態はありません。実際に描画されるまで View のサイズを取得することができないので、状況によっては `ViewTreeObserver` などを使って描画を監視する必要があります。

## onResume()

Fragment が表示されて、アクティブな状態になった時に呼び出されます。

特に何か推奨される処理がある訳ではないですが、強いて言うなら画面が表示されたタイミングでしたいことがあればここで処理します。

## onDestroyView()

`onCreateView()` で生成した View が破棄される時に呼び出されます。

具体的には、別の画面へ遷移した場合や、アプリをバックグラウンドにした時など、画面が見えなくなった時に都度呼び出されます。

## onDestroy()

Fragment が破棄される時に1度だけ呼び出されます。

Fragment が居なくなってしまうため、ここで任意の処理をさせたいと考えた場合、本当に必要な処理か、あるいは適切なタイミングか精査した方がよい印象です。

# UIViewController Lifecycle

UIViewController の Lifecycle は下記のようになります。こちらについても、採用する技術について気にするべき状態が大きく変わります。本記事では扱いませんが、xml で View を構築することが多い Android と比べて、iOS 開発では  Interface Builder や Swift UI と選択肢があるため、状況に応じて実装の作法が変わることがあります。

とは言え、基本的な部分は一緒ではあるため、その中で理解しておいたほうがいいと考える状態は赤枠で囲んだ6つです。

![Blank board - Page 1 (7).png](<content/>android-ios-life-cycle/Blank_board_-_Page_1_(7).png>)

## viewDidLoad()

View の階層構造が読み込まれた時に1度だけ呼ばれます。

View に対する追加の初期化処理や、Xib ファイルの読み込み、AutoLayout(Android で近い概念は ConstraintLayout) での制約の指定はここで行われます。

## viewWillAppear()

画面が表示される前に1度だけ呼ばれます。

ここでは、View の表示に関わる追加の処理を実行します。[公式 Docs](https://developer.apple.com/documentation/uikit/uiviewcontroller/1621510-viewwillappear) に具体例が載っているので、ここではそのまま引用しておきます。

> For example, you might use this method to change the orientation or style of the status bar to coordinate with the orientation or style of the view being presented.
> 

## viewWillLayoutSubViews()

ViewController に表示する SubViews をレイアウトを決定する前に呼び出されます。

画面のレイアウト処理に対して、もっともよく確認する部分です。AutoLayout で制約をつけられている場合はその限りではないですが、何かしらレイアウトに関する座標やサイズの計算をして配置する必要がある場合、必ずここで処理します。

## viewDidLayoutSubViews()

SubViews をレイアウトが決定した時に呼び出されます。

もしも、レイアウトした SubViews に対して何か変更をしたい場合はここで処理することになります。

代表的な例 かつ Android 開発者向けの注意点として、iPhone X 以降で導入された **safeArea はここ以降でないと取得できない**ため、マージン調整の処理をすることがあります。

## viewDidAppear()

 実際に画面が描画されて表示された時に呼び出されます。

Android の `onResume()` と同様に、実際に画面が表示された時にしたいことがあればここで処理します。

## viewDidDisappear()

View が破棄された時に呼び出されます。

こちらも Android の `onDestroyView()` に似ていて、別の画面へ遷移した場合や、アプリをバックグラウンドにした時など、画面が見えなくなった時に都度呼び出されます。

# 最後に

今回は Android の Fragment 及び iOS の UIViewController それぞれで簡単にライフサイクルの紹介をしました。

もっと細かい話をすれば、Android は Fragment と Activity の関係、iOS では ViewController と SubViews のレイアウトの順序など説明すべきことは沢山あるのですが、まずはそれぞれのプラットフォームを学ぶためのとっかかりとして活用していただければと思います。

# 参考

[https://developer.android.com/guide/fragments/lifecycle](https://developer.android.com/guide/fragments/lifecycle)

[https://developer.apple.com/documentation/uikit/uiviewcontroller](https://developer.apple.com/documentation/uikit/uiviewcontroller)

[https://developer.apple.com/documentation/uikit/uiview/2891103-safeareainsets](https://developer.apple.com/documentation/uikit/uiview/2891103-safeareainsets)
