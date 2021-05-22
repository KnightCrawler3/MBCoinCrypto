const { Blockchain, Transaction } = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const mykey = ec.keyFromPrivate('7c4c45907dec40c91bab3480c39032e90049f1a44f3e18c3e07c23e3273995cf');

const myWalletAddress = mykey.getPublic('hex');

const MBCoin = new Blockchain();

MBCoin.minePendingTransactions(myWalletAddress);

const tx1=new Transaction(myWalletAddress,'add1',100);
tx1.signTransaction(mykey);
MBCoin.addTransaction(tx1);

MBCoin.minePendingTransactions(myWalletAddress);
console.log(`Balance of xavier is ${MBCoin.getBalanceOfAddress(myWalletAddress)}`);
console.log('Blockchain valid?', MBCoin.isChainValid() ? 'Yes' : 'No');

for (let index = 0; index < 100; index++) {
    var d = new Date();
    var start = (d.getTime());
    console.log('Mining MBCoin block '+(index));

    // Create second transaction
    const tx4 = new Transaction(myWalletAddress, 'address'+index, 50);
    tx4.signTransaction(mykey);
    MBCoin.addTransaction(tx4);
    
    // Mine block
    MBCoin.minePendingTransactions(myWalletAddress);

    var d1 = new Date();
    var end = (d1.getTime());

    console.log('Time taken to mine block',(end-start));
    console.log();
    console.info(`Balance of Manish is ${MBCoin.getBalanceOfAddress(myWalletAddress)}`);
    
}