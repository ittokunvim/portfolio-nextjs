# Blog Ittoku Tech

このリポジトリは、ittokunのブログサイトです。日々の出来事をブログ記事として記録することが出来ます。

## アプリを動かす

アプリを動作させるには[api-ittoku-tech](https://github.com/ittokun/api-ittoku-tech)が必要です。
[ittoku-tech](https://github.com/ittokun/ittoku-tech)を入手してアプリを動かしてみましょう。

以下のコマンドを実行することで、アプリを動かすことができます。

```bash
docker-compose build
docker-compose up
```

[http://localhost:3000](http://localhost:3000)にアクセスして、動作を確認してみましょう。

アプリを終了するには以下のコマンドを実行します。

```bash
docker-compose down
```

webコンテナに入るには以下のコマンドを実行します。

```bash
make web-bash
```

ESlintで構文をチェックするには以下のコマンドを実行します。

```bash
make web-lint
```
