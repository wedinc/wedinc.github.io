---
title: とある PR のおかげで Neovim がもはや VSCode な件について
author: yanskun
Tags: Architecture
date: 2022-04-12
image: neovim-like-a-vscode.png
---

[yanskun](http://github.com/yanskun) です。

以前、Neovim の設定を結構丁寧におこなって、それ自体楽しんでいることについてブログを書きました。

**[Neovim で init.lua を汚さずに plugin を設定する](neovim-clean-config.md)**

今回は、とある Neovim の PR によって、Status Line に革命が起きたので、そちらの紹介をさせていただきます。

## 何が起きたのか

これまでは画面を Split すると Status Line も Split される。という仕様があったのですが、

それを Status Line は Split されないようにする Option が追加されました。

こちらの PR をご覧ください。

**[feat(statusline): add global statusline](https://github.com/neovim/neovim/pull/17266)**

> Adds the option to have a single global statusline for the current window at the bottom of the screen instead of a statusline at the bottom of every window. Enabled by setting `laststatus = 3`.
> 

とあるように、

`laststatus = 3` という option を加えることで、Status Line を画面の下部に一定に表示することができるようになるよ。

というものです。

この PR 自体は以前から知っていて、
随分前に、lualine にこんな Issue を投げたことがあります。

**[Feat: Always displayed in one place](https://github.com/nvim-lualine/lualine.nvim/issues/562)**

これは、lualine 側で、Split しないように制御できないものか。という旨の Issue です。

開発者には、「Neovim 側でやってるから、そっちを待ってね」との回答がありました。

（実際には、僕の Issue は重複していて、オリジナルの方でされていた回答です。）

それが、遂に実装が完了して使えるようになったので、今回はそちらの設定をしていこうと思います。

## やってみる

前置きが長くなりました。

早い話、Status Line が綺麗に表示できるようになったから、それをします。

```lua
local o = vim.opt

o.laststatus = 3
```

この laststatus = 3 が今回の Global Status Line を有効にするオプションになります。

ただ lualine を使っている場合、これだけでは不十分です。

```lua
use {
	'nvim-lualine/lualine.nvim',
  config = function() {
		require('lualine').setup({
		  options = {
				globalstatus = true,
		  }
		})
  }
}
```

lualine 側の options.globalstatus を true にしてあげる必要があります。

これで準備は OK です。

## 結果

### Before

![スクリーンショット 2022-04-08 11.45.52.png](content/neovim-like-a-vscode/スクリーンショット_2022-04-08_11.45.52.png)

### After

![スクリーンショット 2022-04-08 11.43.43.png](content/neovim-like-a-vscode/スクリーンショット_2022-04-08_11.43.43.png)

これまで僕が感じていた課題としては

- split して window 幅を狭めている影響で、ファイル名が潰れて読めなかった
- window を複数展開してると、ファイル名がどこに記載されているのかわからなかった

以上の問題がありました。

（もちろん、Active な Window がどれなのかが、わかりやすいという利点はありましたが、そんなに固執するようなものでは個人的にはありませんでした。）

これが解消され、もうほぼほぼ VSCode と同じ UI になってきたんじゃないか。というのが、この PR の感想です。
