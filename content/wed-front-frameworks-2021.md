---
title: WED で使っているフロントエンドのフレームワーク
author: yanskun
tags: Frontend
date: 2021-10-27
image: wed-front-frameworks-2021.png
---

## はじめに

### 自己紹介

WED で Web フロントエンジニアとして働いている安田（[@yanskun](https://github.com/yanskun)）です。

売上管理アプリ Zero の管理画面を始め、コーポレートサイトのメンテナンスなど、WED の Webフロントの多くを任せてもらっています。

### 世間の Web フロント

Vue.js と React どちらを選択するか。というのは Web フロント界隈でよく議論されています。

![Untitled](content/wed-front-frameworks-2021/Untitled.png)

Google Trends を見てみると、国内の検索数は常に競っている印象です。

ただ、若干 React が優勢になってきたのかもしれないですね。

では、WED ではどちらを使っているのか。

# WED での Web フロントの開発と運用

結論、WED では両方を使っています。

また、Vue.js ではなく Nuxt.js を使っています。

WED での使い分けはざっくり

```bash
Nuxt.js: 静的ページ
React: 動的ページ
```

商用のもの以外は Nuxt.js で書いているって感じです。

## Zero

技術スタック

```bash
Node: v16.11.0
Language: TypeScript(v4.4.3)
Framework: React(v17.0.2)
UI　Framework: Material UI(v5.0.3)
```

UI Framework には Material UI を採用し、コンポーネント設計には、Storybook を使って、 Atomic Design を実現しています。

**コンポーネントのディレクトリ構成の簡易図**

```bash
./src
├── components
│   └── atoms
│       └── AppButton
│           ├── index.test.tsx
│           └── index.tsx
└── stories
    └── atoms
        └── AppButton.stories.tsx
```

また、1つのコンポーネント *.index.txs / *.test.tsx / *.stories.tsx の3ファイルを作成することになり、煩わしいため [hygen](https://www.hygen.io/) を使って、対話式に component の level と名前を入力すると生成できるようにしています。

他にも、Page 用、Redux の Slice 用の hygen ファイルを用意し、同様にテンプレート化し、ファイルごとでの決まり文句のような箇所を、繰り返し人の手で記載する手間を極力削減するようにしています。

Zero で使っている hygen のコードを紹介します。

`propmt.js` で対話式で、コンポーネントの名前や種別を入力できるようにし、

```jsx
// .hygen/generator/component/prompt.js
module.exports = [
  {
    type: 'input',
    name: 'name',
    message: "What's this Component's Name?",
  },
  {
    type: 'select',
    name: 'level',
    message: 'Choose a component level',
    choices: ['atoms', 'molecules', 'organisms', 'templates'],
  },
]
```

入力内容を元に
同じフォルダ内にある `*.t` ファイルの内容に沿って、テンプレート生成します。

```tsx
// .hygen/generator/component/index.tsx.t
---
to: src/components/<%= level %>/<%= Name %>/index.tsx
---
<%
  name = h.inflection.underscore(name)
  Name = h.inflection.camelize(name)
-%>
import React from 'react'
import { makeStyles } from '@material-ui/core'

export type <%= Name %>Props = {
}<% if (level !== 'templates') { -%> & React.StyledProps <% } %>

const useStyles = makeStyles({
})

const <%= Name %>: React.StyledFC<<%= Name %>Props> = ({
  className,
}: <%= Name %>Props) => {
  const classes = useStyles()
  return (
    <></>
  )
}

export default <%= Name %>
```

## ONE Media Site

技術スタック

```bash
Node: v14.15.3
Language: JavaScript
Framework: Nuxt.js(v2.9.0)
CMS: Contentful
```

## Corporate Site

```bash
Node: v14.17.5
Language: JavaScript
Framework: Nuxt.js(v2.10.2)
CMS: Ghost
```

弊社のコーポレートサイトのニュースの記事の内容は、Ghost に、

弊社のブログ **[ONE MAGAZINE](https://wow.one/magazine/)** に記載されている内容は、Contentful に、
それぞれ格納されています。

先にコーポレートサイトで Ghost を採用していたのですが、次に開発した社内ブログなどでは、柔軟性を持たせるために Contentful の採用をしました。

### 運用方法

CMS の更新があるたびに build & deploy が走るようにして、最新の記事を公開できるようにしています。

また、 CMS の更新など、後のことはエンジニアチームはほとんど関与せず、広報のメンバーがやってくれています。

また、記事の内容に関するデータの取得もエンジニアではなく、広報のメンバーが自ら SQL を叩いて自ら取得しています。凄すぎる。

---

## 最後に

さいごに、安田が妄想してる、やりたいなって思ってることをつらつらと書いてみます。

1. Nuxt3 を使ってみたい

僕が元々 Vue 系が得意ということもあり、Nuxt v3 がリリースされたので、今の Vue2 ベースの Options API で書かれている vue ファイルを、 Vue3 ベースの Composition API での書き換えを行っていきたいなーと密かに考えています。

1. Storybook を公開したい

Zero の Storybook を外部に公開して見るのも面白いと思っています。

他の企業がどんなコンポーネント設計してるのか、って見れたら面白くないですか？

1. Svelte に挑戦してみたい

日本でもじわじわ人気が出てきてる Svelte 使ってみたい感ある。

ちょっと個人で触ってみて、いい感じになったら仕事でも使ってみたいですね。

Vue.js, React どれも目まぐるしく進化をしているので、最新を追い切るのは少々要求値が高いですし、目が回ります。

しかし「どちらも触れる」と言うのは、今後フロントエンドのスペシャリストとしてキャリアを進めるぞ！という人の選択肢を広げることに、つながると信じています。
