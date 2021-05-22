const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {

    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
      }

      calculateHash() {
        return crypto.createHash('sha256').update(this.fromAddress + this.toAddress + this.amount + this.timestamp).digest('hex');
      }
    signTransaction(signingKey){
        if(signingKey.getPublic('hex')!==this.fromAddress){
            throw new Error('Error, you cannot sign transac of diff wallets');
        }

        const hashTx= this.calculateHash();
        const sig= signingKey.sign(hashTx,'base64');
        this.signature=sig.toDER('hex');
    }

    isValid(){
        // assuming its a mining reward
        if (this.fromAddress === null) return true;

        if(!this.signature||this.signature.length===0){
            throw new Error('Error, Signature not present in the transaction');
        }

        const publickey = ec.keyFromPublic(this.fromAddress,'hex');
        return publickey.verify(this.calculateHash(),this.signature);
    }
}
class CryptoBlock {
    /**
     * @param {number} timestamp
     * @param {Transaction[]} transactions
     * @param {string} previousHash
     */
    constructor(timestamp, transactions, previousHash = '') {
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        let calculatedHash = crypto.createHash('sha256')
            .update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce)
            .digest('hex');

        return calculatedHash;
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
    }

    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
            return true;
        }
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    createGenesisBlock() {
        return new CryptoBlock(Date.parse('2021-05-22'), [], '0');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {

        // transaction for mining reward 
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        const block = new CryptoBlock(Date.now(),this.pendingTransactions,this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        this.chain.push(block);

        this.pendingTransactions=[];
    }

    addTransaction(transaction){
        if(!transaction.fromAddress||!transaction.toAddress){
            throw new Error("Error, no from or to address");
        }

        if(!transaction.isValid){
            throw new Error("Transaction is not valid");
        }

        if(transaction.amount<=0){
            throw new Error("Error, transac amt shall be higer than 0");
        }

        if(this.getBalanceOfAddress(transaction.fromAddress)<transaction.amount){
            throw new Error("Error, not enough bal!")
        }

        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address){
        let balance=0;
        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if(trans.fromAddress===address){
                    balance -= trans.amount;
                }
                if(trans.toAddress===address){
                    balance+=trans.amount;
                }
            }
        }
        return balance;
    }

    getAllTransactionsOfWallet(address){
        const txs=[];

        for (const block of this.chain) {
            for (const tx of block.transactions) {
                if(tx.fromAddress === address || tx.toAddress === address){
                    txs.push(tx);
                }
                
            }
            return txs;
        }
    }

    isChainValid(){
        const realGenesis= JSON.stringify(this.createGenesisBlock());
        if(realGenesis!==JSON.stringify(this.chain[0])){
            return false;
        }

        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            if(!currentBlock.hasValidTransactions()){
                return false;
            }

            if(currentBlock.hash!==currentBlock.calculateHash()){
                return false;
            }
        }
        return true;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Block = CryptoBlock;
module.exports.Transaction = Transaction;