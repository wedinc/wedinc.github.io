---
title: CloudComposer 始めました
author: thimi0412
date: 2022-06-06
image: start-CloudComposer.png
---

WEDでデータエンジニアをしている[thimi0412](https://twitter.com/thimi0412) こと清水です。

## 始めに

WEDでは現在GKE上に[Airflow](https://airflow.apache.org/) の環境を構築し、[Embulk](https://www.embulk.org/) 使用してアプリケーションで使用しているCloudSQLから分析用のBigQueryにデータを転送しています。そして、自前のGEK上のAirflowからCloudComposerへの移行を現在行っている最中です。

今回はCloudComposerの作成と開発運用について紹介します。

## なぜCloudComposer

移行の理由については以下の2点

- 自前でAirlfowの環境を作成し運用している、各リソースの設定等も必要となり運用のコストが上がってしまう
- 今後他社とのデータ連携のプロジェクトの予定もあるので、Airflowを使用してデータ連携系タスクを管理したい

## 構築

CloudComposerはv1とv2があり今回は新しいv2で作りました。(Airflowが2系なので使ってみたい&GKEがAutopilotモード等の理由)

GCPのリソースは[Terraform](https://www.terraform.io/)で管理してるのでこんな感じでかけます。

ハマった点としてはGoogleのproviderのバージョンが古くて各設定値が使えないことがあったので、バージョンはなるべく新しいものを使うことをお勧めします。

`terraform apply` するとCloudComposerが作成されますが、10分以上待たされるので気長に待ちましょう。

```json
resource "google_composer_environment" "analytics" {
  name    = "analytics"
  project = var.project_id
  region  = var.default_region

  config {
    software_config {
      # 2022/05/25: latest version
      image_version = "composer-2.0.13-airflow-2.2.5"

      pypi_packages = {
        boto3                           = ""
        apache-airflow-providers-amazon = ""
      }
    }
    node_config {
      service_account = var.composer_sa_email
    }
  }
}
```

[https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/composer_environment](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/composer_environment)

作成が完了するとGCPのコンソールで見るとこんな感じ。

![Untitled](content/start-CloudComposer/Untitled.png)

AirflowウェブサーバーからAirflowの管理画面にいけます。

![Untitled](<content/start-CloudComposer/Untitled 1.png>)

## DAGの管理

DAGはAirflowで使われるタスクの依存関係を整理して、どのように実行するか定義されているものです。

Pythonファイルで定義と処理を記述できます。

こんな感じで。

```python
from datetime import timedelta

import airflow
from airflow import DAG
from airflow.operators.python_operator import PythonOperator

default_args = {
    "start_date": airflow.utils.dates.days_ago(0),
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

def test(**context):
    print("Hello World")

with DAG(
    "example_dag",
    default_args=default_args,
    description="test dag",
    schedule_interval=None,
    dagrun_timeout=timedelta(minutes=20),
) as dag:
    task1 = PythonOperator(
        task_id="test",
        python_callable=test,
        provide_context=True,
        dag=dag,
    )
```

CloudComposerではGCS上に `dags/` 配下にファイルを配置すると読み取りを行ってくれて、DAGの追加更新が行えます。

GCS上にファイルをアップロードするだけなのでCIも簡単です。

WEDではGitHub Actionsを使用していて、Workload Identityを使用してGCSのファイルをアップロードしています。

GitHubのリポジトリはこのような構成になってます。

```yaml
.
├── README.md
├── dags
│   └── exapmle
│       └── dag.py
├── poetry.lock
└── pyproject.toml
```

staging環境とproduction環境それぞれ環境を作成していてstaging環境はPR作成時、production環境はmain branchにpushされたらGCSにファイルをアップロードするようになっています。

```yaml
name: production gcs upload

on:
  push:
    branches:
      - "main"
    paths:
      - "**.py"
      - "pyproject.toml"
      - ".github/workflows/production_gcs_upload.yml"

jobs:
  upload:
    name: upload
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - name: Check out code
        uses: actions/checkout@v3

      - id: auth
        uses: google-github-actions/auth@v0
        with:
          workload_identity_provider: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}
          service_account: "<service_account>"
      - name: "Set up Cloud SDK"
        uses: "google-github-actions/setup-gcloud@v0"

      - id: upload-folder
        uses: google-github-actions/upload-cloud-storage@v0
        with:
          path: ./dags/
          destination: "<gcs_path>"
```

[https://cloud.google.com/blog/ja/products/identity-security/enabling-keyless-authentication-from-github-actions](https://cloud.google.com/blog/ja/products/identity-security/enabling-keyless-authentication-from-github-actions)

## 終わりに

まだデータ転送は現在移行中ですがデータ連携等のタスクは本番運用しています。データ転送の移行完了や運用面で気になったことやハマりどころなどあればまた記事を書こうと思っています。
