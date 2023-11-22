---
title: Vertex AI Workbench で Executorをgcsfuseとともに使う
author: catabon55
tags: Vertex AI, Google Cloud Storage, gcsfuse
date: 2023-11-21
---

## はじめに
WED株式会社でデータエンジニアをしているcatabon55です。

仕事では主にVertex AIのWorkbenchを用いて作業をしています。JupyterLab Notebookで作業できて割と快適です。
普段はNotebook上で小さめのデータで対話的にあれこれ試して、いけそうとなったら大規模なデータに対して[Executor](https://cloud.google.com/vertex-ai/docs/workbench/managed/executor?hl=ja)を使ってNotebookを別プロセスで実行しています。


## Executor on Vertex AI Workbench

Executorは、JupyterLab で利用しているリソースとは別に使用するCPUやGPU数、メモリ量を指定できて、実行をスケジューリングすることもでき便利です。

![executor_resource_list.png](<content/20231121-executor-meets-gcsfuse/executor_resource_list.png>)

実行もほぼJupyterLab上のNotebookをそのまま利用できるのですが、注意点がいくつかあります。

1. project_idを明示的に指定する

[公式ドキュメント](https://cloud.google.com/vertex-ai/docs/workbench/managed/executor?hl=ja#explicit-project-selection)にも書いてありますが、
BigQuery上のテーブルにNotebookでアクセスするとき、ふだんは何も指定せず

```python
from google.cloud import bigquery
client = bigquery.Client()
```
でいいのですが、Executorは暗黙にprojectを取得できないので、明示的に指定しておく必要があります。
```
project_id = "your-own-project-name"
client = bigquery.Client(project=project_id)
```
後者の書き方でもJupyterLab上では問題ないので、いずれExecutorで実行したいと考えているときは、普段からこのように書いておくとよいかもしれません。


2. モデルをローカルから読み込むように明示する

学習済みモデルをHuggingfaceからロードして、ローカルでトレーニングを追加して保存した後それを呼び出すとき、
JupyterLabでは`from_pretrained("stored_path")`だけでそのモデルを読み込めますが、
Executorでは、そのままだと暗黙にHuggingface.coのアドレスを追加して読み込みに行って失敗します。

これを防ぐためには、例えば以下のように`local_files_only`のフラグを追加しておけば大丈夫です：
```python
from transformers import BertForSequenceClassification
model = BertForSequenceClassification.from_pretrained(your_model_path, local_files_only=True)
```

3. 生成したファイルを保持したいときは別途GCSに保存する

ExecutorでNotebookを実行すると、Notebook自体は Google Cloud Storageの対象バケットに保存されて、そこで実行されます。
Notebook上の実行結果はそこから確認できるのですが、実行時に生成されたモデルなどのファイルはそのバケットには保存されません。
そのため、生成したファイルを後で利用したい場合には、明示的にGCS上のバケットを指定して保存してやる必要があります。

方法の一つとしては、`upload_from_filename()`を使うことで、例えば：

```python
from google.cloud import storage

local_path = "file_path_of_your_data_or_model"
gcs_path = "corresponding_path_at_a_gcs_bucket"
bucket_name = "your-gcs-bucket-name"
project_id = "your-own-project-name"
client = storage.Client(project=project_id)
bucket = client.bucket(bucket_name)
blob = bucket.blob(gcs_path)
blob.upload_from_filename(local_path)
```
のようにして保存できます。
利用したいときは、`download_to_filename()`を使って
```python
blob = bucket.blob(gcs_path)
blob.download_to_filename(local_path)
```
のようにしてローカルにコピーできます。

## gcsfuse

ただ、複数ファイルを生成・利用する際に毎度ローカルとGCSの間でファイルをコピーするのもちょっと面倒です。
そこで gcsfuse を使って、bucketをマウントすると便利です。
[gcsfuse](https://cloud.google.com/storage/docs/gcsfuse-mount?hl=ja)は、[Cloud Storage FUSE](https://cloud.google.com/storage/docs/gcs-fuse?hl=ja)を使ってバケットをローカルファイルシステムにマウントするものです。
UNIXで mount コマンドを利用していた人にはイメージが湧きやすいでしょう。

[Cloud Storage FUSEをインストールする](https://cloud.google.com/storage/docs/gcsfuse-install?hl=ja)と、gcsfuseというコマンドが利用できます。
[リクエストの認証](https://cloud.google.com/storage/docs/gcsfuse-mount?hl=ja#authenticate_requests)は利用環境に依存しますが、弊社の環境では利用しているサービスアカウントにロール(roles/storage.objectAdmin)を付与することで実行できました ([バケットレベルのポリシーにプリンシパルを追加する](https://cloud.google.com/storage/docs/access-control/using-iam-permissions?hl=ja%E3%80%82#bucket-add))。
認証を与えることができれば、gcsfuseの利用方法は簡単で、マウントポイントとなるディレクトリを作っておいて、そこに対象bucketをマウントするよう指定します。
これをNotebookのセル上に
```
!mkdir -p your_mount_point
!gcsfuse your_bucket_name your_mount_point
```
として先に実行するようにしておけば、あとは例えば
```python
your_dataframe.to_pickle("your_mount_point/your_folder/your_output_file")
```
などとしてファイルをGCS上のバケットに保存していくことができます。
Executorでのジョブが終了した後は、JupyterLab上でも同様にbucketをマウントすればExecutorで生成したファイルを利用できます。

## 終わりに

はじめてUNIXのNFS mountを知ったときには、ローカルのマシンからネットワーク越しのファイルアクセスが簡単にできることに感動した記憶があります。gcsfuseはその記憶を呼び起こしてくれました。

マシン環境はいろいろ進歩してきましたが、一歩引いてみれば昔も今も自分の仕事の流れはあまり変わらなくて、端末からサーバマシンに接続して、重いプロセスを走らせて、コーヒーなど飲みながら実行を待って、エラーが出たらログを、正常終了したら結果や生成されたファイルをチェック、というサイクルを繰り返してきた気がします。Executorでジョブを実行させながら、そんなことを思いました。


