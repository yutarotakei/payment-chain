'use strict';

const { Contract } = require('fabric-contract-api');

class PaymentContract extends Contract {
    // 初期化（サンプル取引データを登録）
    async InitLedger(ctx) {
        console.info('=== Initializing Ledger ===');

        const txTimestamp = ctx.stub.getTxTimestamp();
        // getTxTimestamp() は { seconds, nanos } のオブジェクトを返すので、秒部分をDateオブジェクトに変換
        const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();

        const transactions = [
            {
                id: 'tx1',
                payer: 'user1',
                payee: 'merchant1',
                amount: 100,
                timestamp: timestamp    
            }
        ];

        for (const tx of transactions) {
            await ctx.stub.putState(tx.id, Buffer.from(JSON.stringify(tx)));
            console.info(`Initialized transaction ${tx.id}`);
        }
        console.info('=== Ledger Initialized ===');
    }

    // 送金取引を新規作成する関数
    async CreateTransaction(ctx, id, payer, payee, amount) {
        console.info('=== Creating Transaction ===');
        const exists = await this.TransactionExists(ctx, id);
        if (exists) {
            throw new Error(`Transaction ${id} already exists`);
        }

        const txTimestamp = ctx.stub.getTxTimestamp();
        // getTxTimestamp() は { seconds, nanos } のオブジェクトを返すので、秒部分をDateオブジェクトに変換
        const timestamp = new Date(txTimestamp.seconds.low * 1000).toISOString();

        const tx = {
            id,
            payer,
            payee,
            amount: parseFloat(amount),
            timestamp: timestamp  // 決定的なタイムスタンプを利用
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(tx)));
        console.info(`Transaction ${id} created`);
        return JSON.stringify(tx);
    }

    // 指定した取引の詳細を取得する関数
    async QueryTransaction(ctx, id) {
        console.info('=== Querying Transaction ===');
        const txAsBytes = await ctx.stub.getState(id);
        if (!txAsBytes || txAsBytes.length === 0) {
            throw new Error(`Transaction ${id} does not exist`);
        }
        console.info(`Transaction ${id} retrieved`);
        return txAsBytes.toString();
    }

    // 取引の存在チェック
    async TransactionExists(ctx, id) {
        const txAsBytes = await ctx.stub.getState(id);
        return txAsBytes && txAsBytes.length > 0;
    }
}

module.exports = PaymentContract;
