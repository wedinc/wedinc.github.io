---
title: 'WED技術ブログを GitHub Pages で作成した'
description: 'Nuxt3 + GitHub Pages で WED 技術ブログを作成した'
date: '2023-11-13'
author: 'yanskun'
image: ''
---

## はじめに
WED, inc. で、Engineering Manger をしている [yanskun](https://github.com/yanskun) です。  
GitHub が大好きなので、 [wedinc](https://github.com/wedinc) でも GitHub Pages を使って、何か作れないかなと思っていました。  
そんなときにとあるメンバーから  
**「安田さん、いつになったら技術ブログ書けるようになるんですか？」**  
とめちゃくちゃ、めちゃくちゃ煽られることになったので、  
Nuxt でなら、サクッと作る自信があったので、作ってみました。  
作ったばかりの頃は、かなり簡素なデザインですが、かなり生意気なモダンな開発環境で作成しているので、そのあたりを紹介できたらと思います。

## 使用技術

- Framework
  - [Nuxt3](https://content.nuxt.com/)
- UI
  - [Tailwind CSS](https://tailwindcss.com/)
  - [Nuxt Tailwind](https://tailwindcss.nuxtjs.org/)
- CMS
  - [Nuxt Content](https://content.nuxt.com/)
- Hosting
  - [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)
- CI/CD
  - [GitHub Actions](https://github.com/features/actions)
- Others
  - [TypeScript](https://www.typescriptlang.org/)
  - [Google Analytics](https://developers.google.com/analytics)

### こだわり

Nuxt Content の採用がこだわりポイントです。  
Nuxt Content は、Markdown で記事を書くことができる CMS です。  
Markdown で記事を書くことができるので、記事を書くのがとても楽です。

## 作り方

基本的に公式のドキュメントに沿って作成していきます。

### プロジェクト作成

```bash
npx nuxi@latest init wedinc.github.io
```

[Quickstart for GitHub Pages](https://docs.github.com/en/pages/quickstart) を見ると、  
> Enter username.github.io as the repository name. Replace username with your GitHub username. For example, if your username is octocat, the repository name should be octocat.github.io.

とあるので、 Project Name もとい、Repository Name は `wedinc.github.io` とします。

### 設定

#### TypeScript
TS（型） を使わないと、困ることが個人的に多いので、入れます。

```bash
yarn add -D typescript @typescript-eslint/eslint-plugin @typescript-eslint/parser @nuxtjs/eslint-config-typescript
```

これで
```vue
<script lang='ts'>
</script>
```
が使えるようになったので、ニッコニコで script タグのコーディングができるようになりました。

#### Tailwind CSS
CSS は人生で触れたものの中で最も難しい言語でした。  
みんなも同じ気持ちに決まっているはずなので、入れてあげます。

```bash
yarn add -D @nuxtjs/tailwindcss
```

#### Nuxt Content
肝心のブログ記事を書くために、Nuxt Content を入れます。

```bash
yarn add @nuxt/content
```

ここまでで、 `nuxt.config.ts` は以下のようになりました。

```ts
export default defineNuxtConfig({
  components: true,
  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss',
  ],
})
```

簡単そう。

### ページ作成

#### 一覧ページの作成

index.vue に、適当に記事の一覧ページを作成します。

```vue
<template>
  <main>
    <ContentList v-slot="{ list }">
      <ul v-for="article in list" :key="article._path">
        <li>
          <nuxt-link
            :to="article._path"
          >
            {{ article.title }}
          </nuxt-link>
        </li>
      </ul>
    </ContentList>
  </main>
</template>
```

これで、記事の一覧ページができました。

#### 記事ページの作成

`pages/[slug].vue` に、記事ページを作成します。

```vue
<template>
  <main>
    <article>
      <ContentRenderer:value="data" />
    </article>
  </main>
</template>

<script setup lang="ts">
  const route = useRoute()
  const { data } = await useAsyncData('get-document', () =>
    queryContent(route.path).findOne()
  )

  const { page } = useContent()
  useContentHead(page)
</script>
```

path param で受け取った slug を使って、記事を取得しています。

useContentHead は Nuxt Content の API で、  
Markdown File から受け取った情報をもとに、 `<head>` タグの中身を設定することができます。  
Nuxt の useHead と同じような感じです。

![slug](content/created-the-blog/slug.png)

こんな感じになりました。
**とっても素敵ですね**

### GitHub Pages へのデプロイ
公式のドキュメント通りにやればできるのでとても簡単です。

https://github.com/wedinc/wedinc.github.io/blob/main/.github/workflows/deploy.yml

## 終わりに

思想の話をさせてください。  
僕はこの WED Tech Blog を、Engineer が全員で書く。だけではなく、  
Engineer 全員で作る。ブログにしたいと考えています。  

**ブログを作る** のです。  

なので、このブログの初期構想はかなりシンプルにしました。  

Engineer Team の MTG で良く言われます。  
「ブログ、こういうときはどうするんですか？」  
「ブログのページにこういうの追加してほしい」  

僕の回答はいつも決まってます  
**「それ PR でちょうだい」**

何をしたっていいです。  
Engineer なのだから、実現したいことは自分で実装したら良いと思っています。  

そんな思想で作った技術ブログです。

この技術ブログが  
Engineer がより Engineer らしく自己表現できる遊び場になれば嬉しいです。
