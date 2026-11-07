# xcx-minecraft

Xcratch extension for drawing in Minecraft (Education / Bedrock) with a turtle, in the spirit of Scratch2mcpi.

Minecraft にタートルグラフィックスで描くための Xcratch 拡張です。PC 上で動くアプリ **mcwss-microbit** と組み合わせて使います（アプリが Minecraft と WebSocket で接続し、この拡張からの指示を受けて描画します）。

## Xcratch での読み込み

拡張ローダー（Extension Loader）に、次の URL を入力してください。

```
https://naominix.github.io/xcx-minecraft/mcwssMinecraft.mjs
```

（改名前の `extension.mjs` の URL も、互換用に同一内容で残してあります。旧 URL で保存したプロジェクトもそのまま使えます）

## 使い方

1. PC で mcwss-microbit を起動し、Minecraft から `/connect` で接続する
2. Web UI（`http://<PCのアドレス>:8080/`）に表示される連携リンクをコピーする
3. 「アプリのリンク [ ] でマイクラにつないで開始する」ブロックのリンク欄に貼って実行する（リンクはプロジェクトに保存されます）
4. ペンを下ろして、前進・右折などのブロックで描く

初回接続時、Chrome が「ローカルネットワークへのアクセス」の許可を求めます。許可してください。Safari はこの仕組みに未対応のため、iPad の Safari では接続できない可能性があります（Chrome を使ってください）。

値取得のブロックはありません。Minecraft との WebSocket 接続ではゲーム内の値を読み取れないため、タートルの位置と向きはアプリ側で保持しています。

## このリポジトリについて

このリポジトリは拡張ファイルの公開場所です。拡張の原本は mcwss-microbit リポジトリの `scratch/mcwssMinecraft.mjs` で、リリースに合わせてこのリポジトリへ複製しています。アプリと拡張の API バージョンが食い違うと、開始ブロックがバージョン不一致エラーで止まります（その場合は拡張を読み込み直してください）。

## License

MIT
