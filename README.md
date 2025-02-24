
# Payment Chaincode Demo with Hyperledger Fabric

このプロジェクトは、Hyperledger Fabric を用いたブロックチェーン上での決済取引のデモ環境です。  
ペイメント取引（送金・決済）を記録するためのシンプルな Node.js チェーンコードと、Fabric のテストネットワーク（test-network）を利用した環境構築手順を含みます。

開発記事
https://qiita.com/YutaroTex/items/23ad90fd0f478300eccf

## プロジェクト概要

- **チェーンコード:**  
  `PaymentContract` という名前のチェーンコードで、`CreateTransaction` と `QueryTransaction` の 2 つの関数を提供します。  
  これにより、決済取引を台帳に記録し、その内容を後から問い合わせることが可能です。

- **台帳:**  
  各取引はトランザクション（tx1, tx2, tx3 など）として識別され、取引情報（取引ID、送金者、受取者、金額、タイムスタンプ）が記録されます。

- **組織:**  
  このデモでは、2 つの組織（Org1 と Org2）がネットワークに参加しており、各組織がそれぞれピアを運用しています。  
  エンドースメントポリシーは、両組織のピアからの承認が必要となるように設定されています。

## プロジェクト構成

```
payment-chaincode-demo/
├── chaincode-payment/        # チェーンコードのソースコード
│   ├── package.json         # Node.js の依存関係
│   ├── index.js             # チェーンコードのエントリポイント
│   ├── paymentContract.js   # PaymentContract の実装
│   └── metadata.json        # チェーンコードのメタデータ定義
├── fabric-samples/          # Hyperledger Fabric サンプルリポジトリ（test-network等）
│   └── test-network/        # Fabric テストネットワークスクリプト
└── README.md                # このファイル
```

## 前提条件

### 共通

- **Git:**  
  GitHub からプロジェクトをクローンするために必要です。
- **Hyperledger Fabric の知識:**  
  [Hyperledger Fabric のドキュメント](https://hyperledger-fabric.readthedocs.io/) を参考にしてください。

### Mac 用

- **Docker Desktop for Mac**
- **Node.js (LTS 推奨版)**
- **bash/zsh ターミナル**

### Windows 用

- **Docker Desktop for Windows (WSL2 推奨)**
- **WSL2 (Windows Subsystem for Linux 2) または PowerShell / Git Bash**
- **Node.js**
- **Git for Windows**

> **注意:** Windows 環境の場合、WSL2 ターミナル上で作業すると、Linux 環境とほぼ同様の操作が可能になります。  
> また、パスの表記（例：`/Users/...`）は、Windows 用に適宜調整してください。

---

## セットアップ手順

### 1. プロジェクトのクローン

ターミナル（Mac、WSL2、または Git Bash）で次のコマンドを実行します。

```bash
git clone https://github.com/yutarotakei/payment-chaincode-demo.git
cd payment-chaincode-demo
```

### 2. Fabric サンプルのセットアップ

Fabric サンプルリポジトリ（fabric-samples）が含まれていない場合は、Hyperledger Fabric のサンプルリポジトリをクローンしてください。  
Fabric サンプルのディレクトリ（例：fabric-samples/test-network）に移動し、必要なバイナリをダウンロードします。

```bash
cd fabric-samples
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.0
```

### 3. ネットワークの起動とチャネル作成

Fabric の `test-network` を利用してネットワークを起動します。  
この手順はデモ環境を初期状態にリセットするため、既存の台帳データは全て削除されます。

```bash
cd fabric-samples/test-network
./network.sh down          # 既存ネットワークがあれば停止
./network.sh up createChannel -ca
```

### 4. チェーンコードのデプロイ

チェーンコードを `test-network` にデプロイします。

```bash
./network.sh deployCC -ccn payment -ccp ../../chaincode-payment -ccl javascript -ccv 1.0 -ccs 1
```

正常にデプロイされると、以下のように表示されます：

```
Committed chaincode definition for chaincode 'payment' on channel 'mychannel':
Version: 1.0, Sequence: 1, ...
```

---

## 取引の実行

### 1. トランザクションの追加 (Invoke)

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "$ORDERER_CA" \
  -C mychannel -n payment \
  -c '{"function":"CreateTransaction","Args":["tx1","user1","merchant1","100"]}' \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
```

別の取引（tx2）を追加する場合:

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "$ORDERER_CA" \
  -C mychannel -n payment \
  -c '{"function":"CreateTransaction","Args":["tx2","user2","merchant2","200"]}' \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
```

### 2. 取引の確認 (Query)

```bash
peer chaincode query -C mychannel -n payment -c '{"Args":["QueryTransaction","tx1"]}'
```

成功すると、取引内容の JSON が返されます。

---

## 注意点とトラブルシューティング

- **エンドースメントの不一致**  
  同じ取引 ID でエンドースメントレスポンスが一致しない場合、タイミングや内部状態の問題が考えられます。  
  再実行するか、別の取引 ID で試してください。

- **環境変数の設定**  
  Windows ではパスの表記が異なるため、環境変数やスクリプト内のパスを適切に変更してください。

- **ネットワークのリセット**  
  ネットワークやチェーンコードの定義を完全にリセットする場合は、以下のコマンドを実行してください。

```bash
./network.sh down
docker system prune -a -f
```

---

## まとめ

このプロジェクトは、Hyperledger Fabric を用いた決済取引のデモ環境です。  
Mac や Windows (WSL2推奨) で環境構築が可能で、詳細なセットアップ手順、ネットワーク起動、チェーンコードデプロイ、トランザクション実行方法が含まれています。

ご不明な点があれば、Issue や Pull Request を通じてご連絡ください。


