---
title: Neovim で init.lua を汚さずに plugin を設定する
author: yanskun
tags: Architecture
Published At: February 21, 2022
date: 2022-02-21
image: neovim-clean-config.png
---

フロントエンジニアの [yanskun](http://github.com/yanskun) です。

最近 Zero のサーバサイド（Golang）も書いてます。

## そうだ、Vim を使おう

git や GitHub CLI を業務でもよく使っていて、キーボードも HHKB を使っている僕は、

いっそコーディングもターミナルでやろう。と思い VSCode から Vim に切り替えることを決断しました。

GitHub Copilot を使いたい。という理由から、Vim ではなく Neovim を選択しました。

[https://github.com/neovim/neovim](https://github.com/neovim/neovim)

せっかく Neovim を使うので、設定は Vim script ではなく Lua で全て記載をすることにしました。 

色々設定をしていくなかで、自分の中で、だいぶ綺麗なフォルダ構成で Neovim の設定ファイルをまとめることができたので、共有させてください。 

### Neovim Plugins

意見が分かれるであろう中核を担う Plugin は以下を選択しています。

- Plugin Manager
    
    [packer](https://github.com/wbthomason/packer.nvim)
    
- A**utocomplete**
    
    [nvim-cmp](https://github.com/hrsh7th/nvim-cmp)
    
- Key Bind
    
    [which-key](https://github.com/folke/which-key.nvim)
    
- LSP
    
    [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig)
    
- File Explorer
    
    [nvim-tree](https://github.com/kyazdani42/nvim-tree.lua)
    
- Status Line
    
    [lualine](https://github.com/nvim-lualine/lualine.nvim)
    

plugin を選定する際に、なるべく lua で書かれている plugin を選択する。という決め事を持っています。

特に深い理由はありませんが、Vim script で書かれている plugin を選択するなら、わざわざ Neovim を使う理由が薄れちゃうんじゃないかな。という漠然とした理由です。

## Neovim のフォルダ構成と役割

```bash
# dotfiles/vim/
$ tree -L 3
.
├── init.lua
├── installer.sh
└── lua
    ├── libraries
    │   ├── _set_config.lua
    │   ├── _set_lsp.lua
    │   └── _set_mappings.lua
    ├── lsp
    │   └── 各種 lsp の　config file
    ├── plugins
    │   ├── init.lua
    │   └── 各種 plugin の config file
    ├── settings
    │   ├── _mappings.lua
    │   ├── _options.lua
    │   └── _provider.lua
    └── spell
        └── en.utf-8.add

6 directories, 35 files
```

1. `./init.lua` 
ほぼ何も書いてないです。
配下の lua ファイルを呼び出すだけ。
2. `./lua/libraries/` 
単体では意味を持たず、他の file で繰り返し呼び出される煩わしい作業を任せています。
`utils` という言い方をしてもいいかもしれないですが、なんとなくこの名前にしてます。
3. `./lua/lsp/`
一番闇が深いフォルダ。
[nvim-lspconfig](https://github.com/neovim/nvim-lspconfig) に大きく依存をしています。
詳細は後述します。
4. `./lua/plugins/`
packer で install する plugin を `init.lua` に記載しています。
他のファイルで plugin は install せず、全てここの `init.lua` にまとめることにしています。
また、同階層に、plugin ごとの設定ファイルを配置しています。
こちらも詳細は後述します。
5. `./lua/settings/`
シンプルな `.vimrc`  に書くような設定を役割ごとにファイルに分けてるだけです。
特に難しいことは何もしていないです。
ファイルに名前を付けることで、import しないといけないというデメリットがつきますが、どこに何を書けばいいかというのが明確になるメリットがあります。
6. `./lua/spell/`
global spell を記載してます。
`yanskun` とかの辞書にない単語を登録してます。

### Plugin Config

plugin の config ファイルを簡易的に読み込めるようにするための関数をまとめています。

```lua
-- vim/lua/libraries/_set_config.lua
local M = {}
local fmt = string.format

function M.conf(name)
	return require(fmt("plugins.%s", name))
end

return M
```

`_set_config.lua` から `conf` という関数を取り出します。

plugin を指定する use のなかで、 `conf` を呼び出し、引数に plugin の名前を渡してあげます。

```lua
-- vim/lua/plugins/init.lua
local utils = require('libraries._set_config')
local conf = utils.conf

require'packer'.startup {function(use)
	use 'wbthomason/packer.nvim'

	use {
		'kyazdani42/nvim-tree.lua'
		config = conf 'nvim-tree'
	}
	end
}
```

`plugins/` に先ほど `conf` に渡した plugin の名前を同じ名前の lua ファイルを作成し、config を書き込んでいきます。

plugin 専用の key bind もこのフォルダ内で定義します。

```lua
-- vim/lua/plugins/nvim-tree.lua
require('nvim-tree').setup {
	-- customize
}

require('which-key').register {
	-- key bind
}
```

ここまでやると、plugin ごとにファイルに設定をまとめられるので、探しやすいです。

エラーが出た際にも、ファイル名が出るので、どの plugin のバグかってところまでわかるので、debug もしやすいです。

### LSP

先ほどの `_set_config.lua` に lsp 用の関数を追加します。

```lua

-- vim/lua/libraries/_set_config.lua
-- ~略~

function M.conf_lsp(name)
	return require(fmt('lsp.%s', name))
end

return M
```

`plugins/init.lua` で、 `nvim-lspconfig` を指定し、 `config = conf 'lspconfig'` をして、config を読み込む準備をします。

実際に `lspconfig.lua` を記載していきます。

配列に、使いたい LSP の名前を定義し、それを for loop で読み込ませる方法を取ります。

```lua
-- vim/lua/plugins/lspconfig.lua

return function()
	local utils = require('libraries._set_config')
	local conf_lsp = utils.conf_lsp

	local servers = {
		'gopls',
		'sumneko_lua',
	}
	
	for _, lsp in ipairs(servers) do
		conf_lsp(lsp)
	end
end
```

LSP の config ファイルをそれぞれ記載していきます。例として gopls

一行目で、gopls の確認をします。

なければ、install command が表示されるようにします。そうすることで、新しい PC を使うときや、gopls が入ってないバージョンの go を触るときに、どうしたらいいか迷わないで済みます。

```lua
-- vim/lua/lsp/gopls.lua
if vim.fn.exepath('gopls') ~= '' then
	require'lspconfig'.gopls.setup{
		-- customize
	}
else
	print('go install golang.org/x/tools/gopls@latest')
end
```

以上です。

## おわり

結構綺麗にまとめることができました。

今後も一生育てていくことになるのですが、それのたびに汚れていくことを考えると、それの基盤を作れたのは結構でかいなと思っています。

ちょっと前まで、 plugin manager に dein を採用して、tmol ファイルで plugin とその config を管理していたのですが、toml ファイルが巨大になりすぎて、どこに何書いてあるかわからない。ってことが頻発していました。

packer に切り替え、plugin ごとに config file を分ける。という今のやり方にしてからは、どこに何があるかが明確で、どこに書くのがいいのか微妙になっていた key binding 周りもスッキリするようになりました。

~~実際のコードもこれくらいスッキリ書きてえな！！！~~

その甲斐あって、
現在 Golang に関しては、Neovim だけで書いてます。

VSCode の Vim Plugin とかではなく Neovim だけなので、Terminal Emulator を開けば開発ができる。という状態になっています。

ただ、TypeScript の設定がまだうまくできていないので、フロントだけ VSCode で書いているので、これも早く Neovim で完結させたいと考えています。

この記事が、皆様の vim の config file の整理の参考になれば幸いです！

最後に、僕の [dotfiles](https://github.com/yanskun/dotfiles) です。

`./vim` のなかに今回紹介したファイルが入ってます。
