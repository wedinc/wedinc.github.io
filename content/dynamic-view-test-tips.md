---
title: 動的な View 表示時の Espresso テスト TIPS
author: dahhara
tags: Android
date: 2022-06-30
image: dynamic-view-test-tips.jpeg
---

こんにちは。Android / iOS エンジニアの原田です。

今回は Android ONE で実際に実行している Espresso を使った UI テストの Tips を紹介しようと思います。

## はじめに

Espresso は簡潔に UI テストを書ける非常に強力なライブラリです。しかし、実際に稼働しているプロダクトは非同期 かつ 動的に UI が変わるのが普通です。公式 Docs を読んだだけでは挙動が複雑な View に対して、どのようにテストを書けばいいか戸惑うことも多いかと思います。

今回はそういったエンジニアに向けて、Espresso の Tips をまとめてみました。

## 対象者

動的に表示内容が変わる View の Espresso テストを書くエンジニア 

[https://developer.android.com/training/testing/espresso/basics](https://developer.android.com/training/testing/espresso/basics)

## 実行環境

Android Studio Chipmunk | 2021.2.1 patch 1

## Test Libraries

2022/6/30時点の Stable Releaseを採用

- androidx.test:rules:1.4.0
- androidx.test.espresso:espresso-contrib:3.4.0
- androidx.test.uiautomator:uiautomator:2.2.0

[https://developer.android.com/jetpack/androidx/releases/test](https://developer.android.com/jetpack/androidx/releases/test)

## Tips of Espresso Test

## 1. 非同期に更新される View の場合

テスト実行時に、任意の非同期処理でテスト対象の view の表示を待つ必要がある場合、下記のようなメソッドを準備しておくと便利です。

```kotlin
private val uiDevice = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

/**
 * @param selector テスト対象の view の Selector
 * @param timeoutMilliSec タイムアウト
 */
fun waitUntilHasObject(selector: BySelector, timeoutMilliSec: Long = 10000) =
    ViewMatchers.assertThat(
        // selector に合致する view が表示されるまで待機
        uiDevice.wait(
            Until.hasObject(selector),
            timeoutMilliSec
        ),
        Matchers.`is`(true)
    )
```

```kotlin
@Test
fun displayAsyncViewTest() {
    // 「test view」と書かれた view が表示されたら success
    // タイムアウトの場合 failed
    waitUntilHasObject(By.text("test view")
}
```

## 2. RecyclerView 内の View の場合

下記のように、テスト対象の view が RecyclerView 上の画面外にある場合を考えます。

![Blank board - Page 1 (2).png](<content/dynamic-view-test-tips/Blank_board_-_Page_1_(2).png>)

この場合のテストをするためには、画面内にテスト対象の view が表示されるようにスクロールしてあげる必要があります。

```kotlin
@Test
fun viewInRecyclerViewTest() {
	val recyclerView = Espresso.onView(
		ViewMatchers.withId(R.id.recyclerView)
	)

    recyclerView.perform(
        // targetView までスクロール
        RecyclerViewActions.scrollTo<GroupieViewHolder>(   
            ViewMatchers.hasDescendant(ViewMatchers.withId(R.id.targetView))
        )
    )
		
    // targetView をタップ
    Espresso.onView(
        ViewMatchers.withId(R.id.targetView)
    ).perform(ViewActions.click())
}
```

## 3. ViewPager 内の RecyclerView

今度は下記のようにViewPager 内の RecyclerView へテストをしたいとします。

なお、ここではより複雑なケースの知見を共有するために、RecyclerView 同士の ID が Fragment 内で重複しているものとします。

![Blank board - Page 1 (3).png](<content/dynamic-view-test-tips/Blank_board_-_Page_1_(3).png>)

まずは、目的の RecyclerView を取得するために、下記のような Matcher を用意してあげます。

```kotlin
/**
 * @param viewPagerMather テスト対象の viewPager の Matcher
 * @param index テスト対象の item の index
 * @return Matcher
 */
fun existItemInViewPager(viewPagerMather: Matcher<View>, index: Int): Matcher<View> {
    return object : TypeSafeMatcher<View>() {
        override fun matchesSafely(item: View): Boolean {
            val pager = item.parent
            return if (pager is ViewGroup) {
                // Mathcer に合致する かつ viewPager の指定 index の item と一致する
                viewPagerMather.matches(pager) &&
                    pager.getChildAt(index).equals(item)
                } else {
                    viewPagerMather.matches(pager)
                }
            }
        }

        override fun describeTo(description: Description) {
        }
    }
}
```

上記を用いて、RecyclerView の ID × ViewPager の ID × index で一意に RecyclerView を Match させます。

```kotlin
@Test
fun viewInRecyclerViewOnViewPagerTest() {
    val recyclerView = Espresso.onView( 
        Matchers.allOf(
            // テスト対象の RecyclerView の ID
            ViewMatchers.withId(R.id.recyclerView),
            // 条件に合致する RecyclerView が ViewPager 内に存在するか
            ViewMatchers.isDescendantOfA(
                existItemInViewPager(
                    ViewMatchers.withId(R.id.viewpager),
                    2
                )
            )
        )
    )

    // 2. の要領で recyclerView の targetView に対して任意テストを実行
}
```

# 最後に

プロダクトを作り込む際には、より洗練された操作感やデザインを実現するために、View の構造は複雑になりがちです。特に、RecyclerView や ViewPager は Android 開発において頻出の概念かと思います。

今回はそれらが用いられた画面に対して、Espresso テストを作成する時の参考になれば幸いです。
