---
title: next/image のunoptimizedをtrueにしたら動いてた機能が動かなくなった話
author: ym19851201
tags: Next.js, CORS, next/image
date: 2024-01-27
---

WED株式会社でバックエンドだったりフロントエンドだったりのエンジニアをやっている[宮崎](https://twitter.com/tera_hertz)です。  
基本的にはONEという、レシートがお金に変わるサービスに関わる開発全般を行なっています。

## 結論

next/imageのunoptimizedを設定したことでCORSのエラーが発生した際には、Next.jsの [rewrites](https://nextjs.org/docs/pages/api-reference/next-config-js/rewrites) を設定するとよいです。

- next.config.js

```js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/assets/:path*',
        destination: 'https://<画像を配置しているドメイン>/:path*'
      }
    ]
  }
}
```

- CORSエラーが発生したコンポーネント

```tsx
const src = originalSrc.replace(/^https:\/\/<画像を配置しているドメイン>/, '/assets')
return (
  <>
    ...
    <Image
      src={src}
      width={200}
      height={100}
    />
    ...
  <>
)
```

## 経緯

Next.js製のウェブアプリをホストしているVercelからこんなメールが届きました。

![email.png](/content/20240127-unoptimized-next-image/email.png)

要約すると、「next/imageの画像の最適化やりすぎましたね。これ以上はお金取りますよ」です。  
このウェブアプリは現在のところ社内向けだし、画像を最適化してもそんなに恩恵はないと判断し、最適化をOFFにするということになりました。

最適化をOFFにする方法は簡単です。下記のようにImageに対して `unoptimized` をpropsとして渡せばよいです。

```tsx
<Image
  src="https://somewhere.image.stored"
  width={200}
  height={100}
  unoptimized
/>
```

ですが、next/imageのImageタグ一つ一つにこのpropsを追記するのは面倒です。今後も増えていくでしょうし、何なら将来的にやっぱり最適化をしたいという判断が下されるかもしれません。  
そこで、next.config.jsに下記のような設定を追記し、全てのnext/imageの最適化をデフォルトでOFFにすることにしました。

```js
const nextConfig = {
  images: {
    unoptimized: true
  }
}
```

**この過ちが我々の運命に何をもたらすのかも知らずに**

## 事件

上記対応といくつかの修正をデプロイした直後、それは突然起きました。

「アップロードした画像のサイズと容量がずっと計算中と表示されている。昨日までは動いてたのに」

同僚からそう報告を受けた瞬間、ちらっとunoptimizedの設定が頭を過ぎりましたが、すぐその可能性を捨て去りました。  
画像の最適化をやめたところで、サイズ計算に影響はないはずと考えたからです。(表題にもしているのでお気づきでしょうが、この考えは後に間違っていたことが判明します)  
致命的なバグでもないので新機能の実装をしていたのですが、その間原因を調査してくれていたメンバーから、バグが発生する条件はunoptimized設定以外にはなさそうという報告があり、無事に伏線を回収しました。

本腰を入れて調査を開始したところ、原因はCORSの条件に抵触していたことにありました。通常imgタグは、フロントエンドのoriginとsrcのoriginが一致しようがしまいが画像を表示してくれます。  
next/imageも結局はブラウザ上でimgタグとしてレンダリングされるため、ただ画像を表示するだけなら何の問題もありませんでした。  
ですが我々は、画像アップロード用のコンポーネント内の処理で一時的にブラウザ上に表示されないcanvasを生成して、そこにimgタグの内容を描画することで画像の幅・高さと容量を計算させていました。
最適化をONにしていたとき、画像は一度デプロイ先であるVercelで処理されるためブラウザでレンダリングされるimgタグのsrcはフロントエンドと同一originのURLが設定されていましたが、最適化されなくなった今、そのsrcは画像の置き場であるGCSのURLとなっていました。  
imgタグはCORSの制限に引っかからないですが、canvasタグはCORSの制限を受けます。(初めて知りました)  
GCSという別originが指定されたことで、canvas内でCORSに抵触し、計算の処理が止まっていたというのが事件の原因でした。  
next/imageではなく通常のimgタグを使っていれば気づけた問題でしたが、まあnext/imageは便利ではありますし、eslintのデフォルト設定でもimgタグを使うと怒られるので、致し方なかったかなと思っています。

## 対策

さて、上記を踏まえてこのバグを修正するとなった場合、最も簡単なのは画像の最適化設定を元に戻すことです。  
ですが、現状必要ではない機能にお金を払うのも癪です。別に弊社がお金を出してくれないとかではなく、一会社員であり一エンジニアとして会社に余計な負担をかけるよりは何かtechな方法で解決したいと思いました。

となると次に思いつくのは、全体的に設定してしまったunoptimizedを必要な箇所だけOFFにするという方法です。  
幸いこのバグは一つのコンポーネントのみで発生していたため、下記のように局所的に修正するだけで問題が解決できそうです。  
Vercelの最適化リミットは少し怖いですが、それでも相当最適化される枚数を削減できるでしょう。

```tsx
<Image
  src="https://somewhere.image.stored"
  width={200}
  height={100}
  unoptimized={false}
/>
```

しかし実際にはこの方法はうまくいきませんでした。どうやらnext.config.jsで設定したunoptimizedは上書きできないようです。

さて、困りました。  
あと思いつく方法といえば、next.config.jsで全体的なunoptimizedを設定するのをやめ、上記コンポーネントを除くnext/imageを使っている全ての箇所にunoptimized設定を追加していく必要があります。  
言うまでもなくひどく面倒な方法ですし、いつか設定を忘れそうです。  
数行前にカッコつけてこんなことを言った以上、もう少しtechな方法を考えたいところです。

> 一会社員であり一エンジニアとして会社に余計な負担をかけるよりは何かtechな方法で解決したいと思いました。

色々調査したり考えたりした結果、unoptimized設定は残したままNext.jsの[rewrites](https://nextjs.org/docs/pages/api-reference/next-config-js/rewrites)という機能を使うというのが最終的な結論となりました。
rewritesはNext.js自身のルーティングに向けたリクエストを別のURLにマッピングするという機能で、next.config.jsで設定できます。  
下記のような設定をすると `/about` に来たリクエストは実際には `/` で処理されます。

```js
module.exports = {
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/about',
        destination: '/'
      }
    ]
  }
}
```

sourceはNext.jsアプリケーションの外側のURLは指定できませんが、destinationはそれが可能です。また、ワイルドカードも使えます。  
つまりnext.config.jsで下記のような設定をし、

```js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/assets/:path*',
        destination: 'https://<gcsのドメイン>/:path*'
      }
    ]
  }
}
```

さらにCORSでエラーを起こしている箇所で `/assets` へのリクエストとして書き換えてあげれば

```tsx
const src = originalSrc.replace(/^https:\/\/<gcsのドメイン>/, '/assets')
return (
  <>
    ...
    <Image
      src={src}
      width={200}
      height={100}
    />
    ...
  <>
)
```

ブラウザはimgタグに指定されている同一origin `/assets` のsrcを取得しに行き、それを受け取ったNext.jsのバックエンドはdestinationに指定されたGCSの画像を返すことができます。  
ブラウザの視点からは画像はあくまで同一originであり、canvas上でCORSの制限に抵触することがなくなるため、無事この問題を解決することができました。

## 感想

canvasってCORS引っかかるんだーというのが正直な感想です。next/imageのデフォルト設定のせいで潜在していただけで、本来はすぐに発見できる類のエラーでした。  
じゃあnext/imageが悪いのかというとそんなことはなく、意識しないでも様々な便利機能が勝手に動いてくれますし、意識すればもっといろいろなことができます。(そんなに詳しいわけじゃないのでちゃんと学びたいですが)

また、rewritesという機能も今回始めて知ったのですが、CORS問題を解決するだけでなく様々な利用方法がありそうです。  
sourceには正規表現も書けるようなので、ルータのslugでは対応しきれない複雑なルーティングも実現できそうですし、他にもかなりの設定項目があります。  
まあルーティングを必要以上に複雑化せざるを得ないケースというのは、往々にして何か設計に問題が発生していそうではありますが。。。

とはいえ色々遊びの余地もありそうなので、皆さんもぜひ試してみてください！
