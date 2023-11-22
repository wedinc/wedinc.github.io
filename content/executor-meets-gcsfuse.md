---
title: Vertex AI Workbench で Executorをgcsfuseとともに使う
author: catabon55
tags: Vertex AI, Google Cloud Storage, gcsfuse
date: 2023-11-22
---

## はじめに
WED株式会社でデータエンジニアをしているcatabon55です。

仕事では主にVertex AIのWorkbenchを用いて作業をしています。JupyterLab Notebookで作業できて割と快適です。

Notebook上で小さめのデータで対話的にあれこれ試して、いけそうとなったら大規模なデータに対して[https://cloud.google.com/vertex-ai/docs/workbench/managed/executor?hl=ja](Executor)という機能を使ってNotebookを別プロセスで実行しています。


## Executor on Vertex AI Workbench

Executorは、JupyterLab で利用しているリソースとは別に使用するCPUやGPU数、メモリ量を指定できて、実行をスケジューリングすることもでき、便利です。

実行もほぼJupyterLab上のNotebookをそのまま利用できるのですが、注意点がいくつかあります。

1. project_idを明示的に指定する

[  https://cloud.google.com/vertex-ai/docs/workbench/managed/executor?hl=ja#explicit-project-selection](公式ドキュメント)にも書いてありますが、
BigQuery上のテーブルにNotebookでアクセスするとき、ふだんは何も指定せず：

```
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
JupyterLabでは`from_pretrained("[stored_path]")`だけでそのモデルを読み込めますが、
Executorでは、そのままだと暗黙にHuggingface.coのアドレスを追加して読み込みに行って失敗します。

これを防ぐためには、例えば以下のようにlocal_files_onlyのフラグを追加する必要があります：
```
from transformers import BertForSequenceClassification
model = BertForSequenceClassification.from_pretrained(your_model_path, local_files_only=True)
```

3. 生成したファイルを保持したいときは別途GCSに保存する

ExecutorでNotebookを実行すると、Notebook自体は Google Cloud Storageの対象バケットに保存されて、そこで実行されるが、実行時に生成されたファイルはそのバケットに保存されません。
そのため、生成したファイルを後で利用したい場合には明示的にGCS上のバケットを指定して、保存してやる必要があります。
方法の一つとしては、upload_from_filename()を使うことで、例えば:

```
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

利用したいときは、download_to_filename()を使って：
```
blob = bucket.blob(gcs_path)
blob.download_to_filename(local_path)
```
ローカルにコピーできます。

## gcsfuse

ただ、複数ファイルを生成・利用する際に毎度ローカルとGCSの間でファイルをコピーするのもちょっと面倒です。
そこで gcsfuse を使って、bucketをマウントすると便利です。
[https://cloud.google.com/storage/docs/gcsfuse-mount?hl=ja](gcsfuse)は、[https://cloud.google.com/storage/docs/gcs-fuse?hl=ja](Cloud Storage FUSE)を使ってバケットをローカルファイルシステムにマウントするものです。
UNIXで mount コマンドを利用していた人にはイメージが湧きやすいでしょう。

[https://cloud.google.com/storage/docs/gcsfuse-install?hl=ja](Cloud Storage FUSEをインストールする)と、gcsfuseというコマンドが利用できます。
[https://cloud.google.com/storage/docs/gcsfuse-mount?hl=ja#authenticate_requests](リクエストの認証)は利用環境に依存しますが、弊社の環境では利用しているサービスアカウントにロール(roles/storage.objectAdmin)を付与することで実行できました(https://cloud.google.com/storage/docs/access-control/using-iam-permissions?hl=ja)。
認証を与えることができれば、gcsfuseの利用方法は簡単で、マウントポイントとなるディレクトリを作っておいて、そこに対象bucketをマウントするよう指定します。
これをNotebookのcell上に
```
!mkdir -p your_mount_point
!gcsfuse your_bucket_name your_mount_point
```
として実行するようにしておけば、あとは例えば
```
your_dataframe.to_pickle("your_mount_point/your_folder/your_output_file")
```
などとしてファイルをGCS上のバケットに保存していくことができます。
JupyterLab上でも同様にbucketをマウントするだけでExecutorで生成したファイルを利用できます。

## 終わりに

はじめてUNIXのNFS mountを知ったときには、ローカルのマシンからネットワーク越しのファイルアクセスが簡単にできることに感動した記憶があります。gcsfuseはその記憶を呼び起こしてくれました。
マシン環境はいろいろ変化・進歩してきましたが、考えてみれば昔も今も端末からサーバマシンに接続して、重いプロセスを走らせて、コーヒーなど飲みながら実行を待って、エラーが出たらログを、正常終了したら生成ファイルをチェック、というサイクルを繰り返してきた気がします。Executorでジョブを実行させながら、そんなことを思いました。


