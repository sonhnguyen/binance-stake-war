require('dotenv').config()
const {
  BncClient,
  crypto,
  utils,
  Transaction,
  Transfer,
  types
} = require("@binance-chain/javascript-sdk")
var Tx = require('ethereumjs-tx');

var fs = require('fs');
var cron = require('node-cron');
var sleep = require('sleep');
const fetch = require('node-fetch');
const Web3 = require('web3')
const axios = require('axios')
const EthereumTx = require('ethereumjs-tx')
const Common = require('ethereumjs-common').default;

const testnet = `https://data-seed-prebsc-1-s1.binance.org:8545`

const web3 = new Web3(new Web3.providers.HttpProvider(testnet))

const client = new BncClient("https://testnet-dex.binance.org/")
client.chooseNetwork("testnet")
client.chainId = "Binance-Chain-Ganges"

const customCommon = Common.forCustomChain(
  'mainnet', {
  name: 'my-network',
  networkId: 97,
  chainId: 97,
},
  'petersburg',
)

const erc20TokenContractAbi = [{
  "type": "constructor",
  "stateMutability": "nonpayable",
  "payable": false,
  "inputs": []
}, {
  "type": "event",
  "name": "Approval",
  "inputs": [{
    "type": "address",
    "name": "owner",
    "internalType": "address",
    "indexed": true
  }, {
    "type": "address",
    "name": "spender",
    "internalType": "address",
    "indexed": true
  }, {
    "type": "uint256",
    "name": "value",
    "internalType": "uint256",
    "indexed": false
  }],
  "anonymous": false
}, {
  "type": "event",
  "name": "OwnershipTransferred",
  "inputs": [{
    "type": "address",
    "name": "previousOwner",
    "internalType": "address",
    "indexed": true
  }, {
    "type": "address",
    "name": "newOwner",
    "internalType": "address",
    "indexed": true
  }],
  "anonymous": false
}, {
  "type": "event",
  "name": "Transfer",
  "inputs": [{
    "type": "address",
    "name": "from",
    "internalType": "address",
    "indexed": true
  }, {
    "type": "address",
    "name": "to",
    "internalType": "address",
    "indexed": true
  }, {
    "type": "uint256",
    "name": "value",
    "internalType": "uint256",
    "indexed": false
  }],
  "anonymous": false
}, {
  "type": "function",
  "stateMutability": "view",
  "payable": false,
  "outputs": [{
    "type": "uint8",
    "name": "",
    "internalType": "uint8"
  }],
  "name": "_decimals",
  "inputs": [],
  "constant": true
}, {
  "type": "function",
  "stateMutability": "view",
  "payable": false,
  "outputs": [{
    "type": "string",
    "name": "",
    "internalType": "string"
  }],
  "name": "_name",
  "inputs": [],
  "constant": true
}, {
  "type": "function",
  "stateMutability": "view",
  "payable": false,
  "outputs": [{
    "type": "string",
    "name": "",
    "internalType": "string"
  }],
  "name": "_symbol",
  "inputs": [],
  "constant": true
}, {
  "type": "function",
  "stateMutability": "view",
  "payable": false,
  "outputs": [{
    "type": "uint256",
    "name": "",
    "internalType": "uint256"
  }],
  "name": "allowance",
  "inputs": [{
    "type": "address",
    "name": "owner",
    "internalType": "address"
  }, {
    "type": "address",
    "name": "spender",
    "internalType": "address"
  }],
  "constant": true
}, {
  "type": "function",
  "stateMutability": "nonpayable",
  "payable": false,
  "outputs": [{
    "type": "bool",
    "name": "",
    "internalType": "bool"
  }],
  "name": "approve",
  "inputs": [{
    "type": "address",
    "name": "spender",
    "internalType": "address"
  }, {
    "type": "uint256",
    "name": "amount",
    "internalType": "uint256"
  }],
  "constant": false
}, {
  "type": "function",
  "stateMutability": "view",
  "payable": false,
  "outputs": [{
    "type": "uint256",
    "name": "",
    "internalType": "uint256"
  }],
  "name": "balanceOf",
  "inputs": [{
    "type": "address",
    "name": "account",
    "internalType": "address"
  }],
  "constant": true
}, {
  "type": "function",
  "stateMutability": "view",
  "payable": false,
  "outputs": [{
    "type": "uint256",
    "name": "",
    "internalType": "uint256"
  }],
  "name": "decimals",
  "inputs": [],
  "constant": true
}, {
  "type": "function",
  "stateMutability": "nonpayable",
  "payable": false,
  "outputs": [{
    "type": "bool",
    "name": "",
    "internalType": "bool"
  }],
  "name": "decreaseAllowance",
  "inputs": [{
    "type": "address",
    "name": "spender",
    "internalType": "address"
  }, {
    "type": "uint256",
    "name": "subtractedValue",
    "internalType": "uint256"
  }],
  "constant": false
}, {
  "type": "function",
  "stateMutability": "view",
  "payable": false,
  "outputs": [{
    "type": "address",
    "name": "",
    "internalType": "address"
  }],
  "name": "getOwner",
  "inputs": [],
  "constant": true
}, {
  "type": "function",
  "stateMutability": "nonpayable",
  "payable": false,
  "outputs": [{
    "type": "bool",
    "name": "",
    "internalType": "bool"
  }],
  "name": "increaseAllowance",
  "inputs": [{
    "type": "address",
    "name": "spender",
    "internalType": "address"
  }, {
    "type": "uint256",
    "name": "addedValue",
    "internalType": "uint256"
  }],
  "constant": false
}, {
  "type": "function",
  "stateMutability": "nonpayable",
  "payable": false,
  "outputs": [{
    "type": "bool",
    "name": "",
    "internalType": "bool"
  }],
  "name": "mint",
  "inputs": [{
    "type": "uint256",
    "name": "amount",
    "internalType": "uint256"
  }],
  "constant": false
}, {
  "type": "function",
  "stateMutability": "view",
  "payable": false,
  "outputs": [{
    "type": "address",
    "name": "",
    "internalType": "address"
  }],
  "name": "owner",
  "inputs": [],
  "constant": true
}, {
  "type": "function",
  "stateMutability": "nonpayable",
  "payable": false,
  "outputs": [],
  "name": "renounceOwnership",
  "inputs": [],
  "constant": false
}, {
  "type": "function",
  "stateMutability": "view",
  "payable": false,
  "outputs": [{
    "type": "string",
    "name": "",
    "internalType": "string"
  }],
  "name": "symbol",
  "inputs": [],
  "constant": true
}, {
  "type": "function",
  "stateMutability": "view",
  "payable": false,
  "outputs": [{
    "type": "uint256",
    "name": "",
    "internalType": "uint256"
  }],
  "name": "totalSupply",
  "inputs": [],
  "constant": true
}, {
  "type": "function",
  "stateMutability": "nonpayable",
  "payable": false,
  "outputs": [{
    "type": "bool",
    "name": "",
    "internalType": "bool"
  }],
  "name": "transfer",
  "inputs": [{
    "type": "address",
    "name": "recipient",
    "internalType": "address"
  }, {
    "type": "uint256",
    "name": "amount",
    "internalType": "uint256"
  }],
  "constant": false
}, {
  "type": "function",
  "stateMutability": "nonpayable",
  "payable": false,
  "outputs": [{
    "type": "bool",
    "name": "",
    "internalType": "bool"
  }],
  "name": "transferFrom",
  "inputs": [{
    "type": "address",
    "name": "sender",
    "internalType": "address"
  }, {
    "type": "address",
    "name": "recipient",
    "internalType": "address"
  }, {
    "type": "uint256",
    "name": "amount",
    "internalType": "uint256"
  }],
  "constant": false
}, {
  "type": "function",
  "stateMutability": "nonpayable",
  "payable": false,
  "outputs": [],
  "name": "transferOwnership",
  "inputs": [{
    "type": "address",
    "name": "newOwner",
    "internalType": "address"
  }],
  "constant": false
}];

async function main() {
  const toAddress = process.env.TO
  const cleanPrivs = process.env.CLEAN_PRIVS
  await cleanFunds(cleanPrivs.split(","), toAddress)
  const cleanBtcPrivs = process.env.CLEAN_BTC_PRIVS
  await cleanBtcs(cleanBtcPrivs.split(","), toAddress)
  const bcPrivesInactives = process.env.CLEAN_INACTIVES_PRIVS
  await cleanFunds(bcPrivesInactives.split(","), toAddress)

  const bcAddress = process.env.CLEAN_BC_TO
  const bcMnemonics = process.env.CLEAN_BY_MNEMONIC
  await cleanBCFunds(bcMnemonics.split(","), bcAddress)
  const bcPrives = process.env.CLEAN_BY_PRIVS
  await cleanBCFunds(bcPrives.split(","), bcAddress)
  const bcMneInactives = process.env.CLEAN_INACTIVES_MNE
  await cleanBCFunds(bcMneInactives.split(","), bcAddress)
  await cleanAccounts("keys/accounts.json", process.env.PASSWORD, "tbnb...")
}

async function cleanAccounts(path, pw, bcAddress) {
  const accounts = await readAccounts(path, pw)
  const privs = accounts.map(x => x.privateKey)
  await cleanBCFunds(privs, bcAddress)
}


async function readAccounts(accountsPath, password) {
  const content = JSON.parse(fs.readFileSync(accountsPath, 'utf8'))
  accounts = []
  content.forEach(account => {
    const a = client.recoverAccountFromKeystore(account, password)
    accounts.push(a)
  });
  return accounts
}

async function cleanBCFunds(privates, bcAddress) {
  for (const private of privates) {
    if (private == "") {
      return
    }
    const account = private.length > 100 ? await client.recoverAccountFromMnemonic(private) : client.recoverAccountFromPrivateKey(private)
    const apiBalance = await client.getBalance(account.address)
    if (apiBalance.length == 0) {
      continue
    }
    balance = Number(apiBalance[0].free)
    console.log(account.address, balance)
    if (balance < 1) {
      continue
    }
    await client.setPrivateKey(account.privateKey)
    const addressFrom = await client.getClientKeyAddress() // sender address string (e.g. bnb1...)
    const result = await client.transfer(
      addressFrom,
      bcAddress,
      (Number(balance) - 1).toFixed(4),
      "BNB",
    )
    sleep.sleep(1)
    console.log(`https://testnet-explorer.binance.org/tx/${result.result[0].hash}`)
  }
}

async function cleanBtcs(privs, toAddress) {
  console.log(privs)
  privs.forEach(async (priv) => {
    const account = web3.eth.accounts.privateKeyToAccount(priv);
    const nonce = await web3.eth.getTransactionCount(account.address)
    const from = account.address;
    const contractAddress = "0x6ce8da28e2f864420840cf74474eff5fd80e65b8";
    const contract = new web3.eth.Contract(erc20TokenContractAbi, contractAddress, {
      from: from
    });

    const balance = await contract.methods.balanceOf(from).call()
    if (balance == 0) {
      return
    }
    var rawTransaction = {
      "from": from,
      "gasPrice": web3.utils.toHex(20 * 1e9),
      "gasLimit": web3.utils.toHex(210000),
      "to": contractAddress,
      "value": "0x0",
      "data": contract.methods.transfer(toAddress, balance).encodeABI(),
      "nonce": web3.utils.toHex(nonce),
      "chainId": 97
    }

    const transaction = new EthereumTx.Transaction(rawTransaction, {
      common: customCommon
    })
    transaction.sign(Buffer.from(priv, 'hex'))

    const tx = await web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))
    const url = `https://explorer.binance.org/smart-testnet/tx/${tx.transactionHash}`
    console.log(url)
  });
}

async function cleanFunds(privs, toAddress) {
  console.log(privs)
  privs.forEach(async (priv) => {
    const account = web3.eth.accounts.privateKeyToAccount(priv);
    const nonce = await web3.eth.getTransactionCount(account.address)
    const balance = await web3.eth.getBalance(account.address)
    const amountToSend = balance / 1e18 - 1
    if (amountToSend < 1) {
      return
    }
    var details = {
      "to": toAddress,
      "value": web3.utils.toHex(web3.utils.toWei(amountToSend.toFixed(18), 'ether')),
      "gas": 21000,
      "gasPrice": web3.utils.toHex(Math.floor(100 * 1000000000)), // converts the gwei price to wei
      "nonce": nonce,
      "chainId": 97
    }
    const transaction = new EthereumTx.Transaction(details, {
      common: customCommon
    })
    transaction.sign(Buffer.from(priv, 'hex'))
    const serializedTransaction = transaction.serialize()
    const tx = await web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'))
    const url = `https://explorer.binance.org/smart-testnet/tx/${tx.transactionHash}`
    console.log(url)
  });
}
main()
