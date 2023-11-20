---
title: "Datastream for BigQueryを本格導入した話"
author: Yoshihiro Harada
tags: Data, BigQuery, Datastream
date: 2022-06-30
image: 
---

WED株式会社でデータエンジニアをしている[thimi0412](https://twitter.com/thimi0412)です。
2023年11月現在弊社はDatastreamによるBigQueryへのデータ転送を行っており、導入に至った経緯やその準備、実際に運用してみての感想を記します。

Datastrema for BigQuery
https://cloud.google.com/datastream-for-bigquery

# 導入の経緯
経緯としては以下です。
- **CloudSQLからAlloyDBへの移行**
- **旧BigQueryの転送(Airflow)が保守しづらくなっている**
- **DBのスキーマ変更に対してBigQuery側のスキーマ変更が追いつかない**

ONEのサービスで使用しているDBがCloudSQLからAlloyDBへの移行するということが決まっており、プロジェクトとしては3ヶ月前から移行の準備をしていました。
その際、アプリケーションで使用しているDBからBigQueryへの転送を行っているシステムを改修する必要があり、改修のコストも高く保守できる人間が存在していないという問題があり、新規に1から作ろうということになりました。
そして、DB側のオペレーションでカラムの変更や削除等が行われると、BQ側でも対応しなけれないけないので運用コストも上がっていました。

`Datastream for BigQuery`の採用理由としては以下の点が挙げられます。
- **フルマネージドなサービスを使用してアプリケーションで使用しているDBからBigQueryにデータを転送したい**
- **DB側のスキーマが変更されても追従して変更される**
- **ニアリアルタイムなデータ連携なのですぐにデータを見れる**

Datastreamの仕様については[akabe](https://zenn.dev/akabe)の記事がとても丁寧に説明されています。
https://zenn.dev/openlogi/articles/survey-datastream-for-bigquery#ddl-(data-definition-language) 

# BigQueryへのデータ転送
## 以前までのBigQueryへの転送
以前はGKE上に作成したAirflow内でEmbulkを実行して前日分のデータをCloudSQLからBigQueryにデータを入れています。

すでにこのアーキテクチャを作成した方も在籍しておらず、運用面も辛くなってました。

![](https://storage.googleapis.com/zenn-user-upload/2fe75968e222-20231117.png)

差分転送もうまく行えていない状況でしたので扱いづらいという問題もありました。
理由としては`updated_at`が前日のものをBigQueryの各テーブルにappendしていくものだったので重複するidできてしまい。BigQuery側で`QUALIFY ROW_NUMBER()`等を使用して重複レコードをなくしていました。

以下のようなテーブルで新規にレコードが入るとCloudSQLとBigQueryのテーブルは同じ状態になります。
**CloudSQL**
| id  | name    | created_at          | updated_at          | 
| --- | ------- | ------------------- | ------------------- | 
| 1   | shimizu | 2023-11-01 00:00:00 | 2023-11-01 00:00:00 | 
| 2   | yasuda  | 2023-11-01 00:00:00 | 2023-11-01 00:00:00 | 
| 3   | harada  | 2023-11-01 00:00:00 | 2023-11-01 00:00:00 | 

**BigQuery**
| id  | name    | created_at          | updated_at          | 
| --- | ------- | ------------------- | ------------------- | 
| 1   | shimizu | 2023-11-01 00:00:00 | 2023-11-01 00:00:00 | 
| 2   | yasuda  | 2023-11-01 00:00:00 | 2023-11-01 00:00:00 | 
| 3   | harada  | 2023-11-01 00:00:00 | 2023-11-01 00:00:00 |

しかし`shimiz`→を`shimizu2`に更新して`updated_at`も更新されるとidが重複してまう。
**CloudSQL**
| id  | name     | created_at          | updated_at          | 
| --- | -------  | ------------------- | ------------------- | 
| 1   | shimizu2 | 2023-11-01 00:00:00 | 2023-12-01 00:00:00 | 
| 2   | yasuda   | 2023-11-01 00:00:00 | 2023-11-01 00:00:00 | 
| 3   | harada   | 2023-11-01 00:00:00 | 2023-11-01 00:00:00 | 

**BigQuery**
| id  | name     | created_at          | updated_at          | 
| --- | -------  | ------------------- | ------------------- | 
| 1   | shimizu  | 2023-11-01 00:00:00 | 2023-11-01 00:00:00 | 
| 1   | shimizu2 | 2023-11-01 00:00:00 | 2023-12-01 00:00:00 | 
| 2   | yasuda   | 2023-11-01 00:00:00 | 2023-11-01 00:00:00 | 
| 3   | harada   | 2023-11-01 00:00:00 | 2023-11-01 00:00:00 | 

## Datastream for BigQueryへの移行後
Datastream for BigQueryに移行したことにより構成がシンプルになりました。以前と違ってGKEやその上に乗っているAirflowやEmbulkを管理しなくて良くなったことはとても大きいメリットです。

DB側のスキーマ変更の際にBigQuery側のスキーマ変更をしなくて良くなりました。
![](https://storage.googleapis.com/zenn-user-upload/274d814fb696-20231118.png)

以下のことを勝手にやってくれる
- columnが追加されるとそのcolumnが追加される
- columnが削除されるとそのcolumnがnullになる
- columnの名前が変更されるとその以前のcolumnはnullになり、変更後のcolumnが作られる


# 運用をしてみてのポイントや辛いところ
## テーブルのパーティション化
BigQueryを運用しいて巨大なレコード数になってくるとスキャン量を抑えるためにパーティション化を行う必要があるのですが、Datastream for BigQueryで作成されるテーブルはパーティション化されていないという点があります。

以下の記事を読んだところ方法としてはDatastream for BigQueryによって作成されるテーブルをDropしたのち同じテーブル情報でパーティション化したテーブルを作成するという方法です。
https://medium.com/google-cloud/configure-streams-in-datastream-with-predefined-tables-in-bigquery-for-postgresql-as-source-528340f7989b

弊社ではスクリプトを作成し、BigQuery側からよく参照されるテーブルをパーティション化するスクリプトを作成しました。

**パーティション化の手順**
1. 実行しているDatastreamを止める
2. パーティション化をするスクリプトを実行
3. Datastreamを再開

ここについてはGCP側でDatastreamを作成する際に向き先テーブルの詳細設定等の機能でパーティションテーブルを作成するようになってくれると嬉しいです。


## 大量データのバックフィルが辛い
Datastreamには過去のDBにあるデータを同期する機能が備わっています。新規に追加されるレコードやスキーマの変更イベントはBigQuery側に反映されるのですが過去データもBigQuery上に入れる必要があるのでバックフィルを実行してDBをBigQueryのデータをsyncするような感じです。
https://cloud.google.com/datastream/docs/manage-backfill-for-the-objects-of-a-stream

ONEのサービスが2018年からリリースされこれまでに買い取ってきたレシート数は**9億(2023/11/17現在)を超えています**。となると、レシート情報を格納したテーブルも9億を超えるレコードが存在します。

Datastreamの導入は比較的すぐ行えましたが。レシート情報やそれに関連した9億レコードを超えるテーブルの**バックフィルにおよそ一ヶ月ほどかかりました**。

Datastream側のバックフィルは順調に進んでいてもデータを受けるBigQuery側でデータが詰まってしまう問題がありました。データの転送の順番も設定できない(2018年から転送 or 直近1年を先に送るなど)ので実際にデータの集計等を行うのに1ヶ月ほどのタイムラグは発生していました。

我々もこの大量データのバックフィルのベターなやり方はまだわかっていないので有識者の方がいれば教えてください。

# 終わりに
`Datastream for BigQuery`の導入はとてもいいと思っています。
比較的新しいサービスでまだ使い辛い点などがありますが今後のGCP側のアップデート等によって上記で述べた点などが改善される可能性もあるのでそれを心待ちにしています。