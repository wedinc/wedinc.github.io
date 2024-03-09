---
title: '画像を綺麗に縮小する方法'
date: 2024-03-09
author: 'shinora008'
image:
---


WED株式会社でエンジニアをしています篠崎です。
この記事では画像縮小をする際に、できる限りジャギらないようにする方法を紹介しています。

## はじめに
1つの画像を縮小して異なる2つのサイズの生成し3つの画像をGCSに保存する
という、画像アップロードの機能を実装していた際に、画像がうまく縮小されずかなり詰まり、
ググっても綺麗に縮小する方法は見つからなかったので、備忘録として残すことにしました。

## 結論
**大きい画像から小さい画像に縮小する際は、サイズの段階を踏んで縮小するとジャギりにくい。**

```js
export const generateMultiResolutionImages = async (
  originalFile: File,
  originalWidth: number,
  originalHeight: number,
  fileName: string,
) => {
  // 画像のリサイズは縮小になるので、元の画像サイズの名前@3xの画像になる
  try {
    // @2xサイズ
    const twoThirdsScaleImage = await resizeImage(
      originalFile,
      fileName + '@2x',
      originalWidth * (2 / 3),
      originalHeight * (2 / 3),
    )
    if (!twoThirdsScaleImage) throw new Error('@2xサイズの画像の生成に失敗しました')

    // 通常のサイズ
    // 綺麗に段階的に縮小するために@2xサイズを使用する
    const oneThirdScaleImage = await resizeImage(
      twoThirdsScaleImage,
      fileName,
      originalWidth / 3,
      originalHeight / 3,
    )
    if (!oneThirdScaleImage) throw new Error('オリジナルサイズの画像の生成に失敗しました')

    // ファイル名を変更するためにFileオブジェクトを作成
    const renamedOriginalFile = new File(
      [originalFile],
      `${fileName + '@3x'}.${originalFile.name.split('.').pop()}`,
      {
        type: originalFile.type,
        lastModified: new Date().getTime(),
      },
    )

    return [renamedOriginalFile, twoThirdsScaleImage, oneThirdScaleImage]
  } catch (error) {
    console.error('画像のリサイズ中にエラーが発生しました:', error)
    throw error
  }
}
```

## 試したこと

1. canvas(1回目)
2. sharp
3. canvas(段階的に縮小)

の順番に試していきました。

今回サンプルで使う画像のサイズは

- @1x: 414 × 300
- @2x: 828 × 600
- @3x: 1242 × 900

となっており、
@3x→@1xへ縮小したイメージを使って解説していきます。

比較しやすいように下記の画像がオリジナルです。
サイズは414 × 300になっており、ここを目指します。

![original.png](<content/20240309-resize-image/original.png>)


### canvas(1回目)

canvasってなにかというと簡単にいうとHTML要素の一つで、canvasタグを使用するとJavaScriptによって画像等を描画することができます。
画像サイズを変更したり、加工したりが非常に簡単です。

**生成した画像**

![canvas-1.png](<content/20240309-resize-image/canvas-1.png>)


ワンくん(左上)が悲しい感じになってる！
1/3の画像に縮小したらこんなにジャギるのかびっくりしました。
正直画像が荒くなるのって縮小から拡大した時だけだろうと思っていたので、まさかこんなところで詰まるわけないと余裕かましていた時ですね。
今の心境はあと今週くらいでテストできますよとか自ら締切り切った自分を殴ってやりたい気持ちです。

ただ、アプリで見た時ってすごく小さく表示されるのでギリ許容範囲内ではないかと思い、デザイナーの方に見せたら一瞬でダメ出しくらいました。
当然ですよね。

ということで、別の方法を考えることに。。。

### sharp

**生成した画像**

![sharp.png](<content/20240309-resize-image/sharp.png>)

だいぶマシになったぞと思いつつ、ちょっと文字がジャギってるなぁって感じです。

なぜsharpを使ってみたかというと、
sharpenという機能を使えば画像が鮮明になるって書いてあったんですよね。
これを使えばもしかしたらと思い試しました。

ただ、懸念点としてはNode.jsの環境が必要なので、サーバー側で処理する必要があるんですよね。

確かコードはこんな感じで書きました。
```js
const resizedImage = await sharp(file.filepath)
  .resize(Number(req.query.width), Number(req.query.height))
  .sharpen()
  .toBuffer()
  .then((buffer) => {
    return buffer.toString('base64');
  })
  .catch((err) => {
    console.error(err);
  });
```

Next.jsを使用してたのでAPIの実装自体は楽にできたものの、画像のサイズ変更するだけでちょっと大袈裟だなと。
さらにサーバー側で処理する関係上、画像の形式も変更しなきゃならないのでやることは多かったです。

これでもよかったんですが、若干文字が崩れていたりするのでもっといい方法がないものかと別の方法を考えることにしました。。。


### canvas(段階的に縮小)

**生成した画像**

![canvas-2.png](<content/20240309-resize-image/canvas-2.png>)


かなり綺麗に縮小することができましたね。
オリジナルと比べても遜色ないように見えます。

今回やったことは、
3サイズのイメージを作成する為、
先に@2xに縮小し、
@2xの画像から@1xへリサイズする方法でした。

これだけでわざわざsharpを使用することなく、画像の形式を変換することなくそれよりさらに綺麗に縮小させることに成功しました。


## おわり
画像を綺麗に縮小する方法を紹介させて頂きました。

やっていることは簡単ですが、ここまでに至るまでに2~3日は悩んでいたと思います。
ただ、なにかライブラリを使わなくては綺麗に画像をリサイズできないと思い込んでいたので、ちょっとした工夫でシンプルに設計できたことは非常にいい開発体験でした。
