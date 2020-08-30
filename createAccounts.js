const { BncClient, crypto, utils, Transaction, Transfer, types } = require("@binance-chain/javascript-sdk")

var fs = require('fs');
require('dotenv').config()
var cron = require('node-cron');
var sleep = require('sleep');
const request = require("request");
const fetch = require('node-fetch');

const client = new BncClient("https://testnet-dex.binance.org/")
client.chooseNetwork("testnet")
client.chainId = "Binance-Chain-Ganges"

async function main() {
    await createAccounts(100, "password")
    await fundDelegators("keys/accounts.json", 0, 100, 9.5, process.env.PASSWORD)
    await delegateValidator("keys/accounts.json", 0, 100, 1, "bva....", process.env.PASSWORD)
    await pumpAction(1, 10)
    await pump(1, 10)
    console.log(await readAccounts(process.env.PASSWORD))
    await parsehistoryDelegatorRewards()
    await parseHistoryMedianCollectedReward()
    const account = client.recoverAccountFromMnemonic("mnenomic")
    await bcMovefund("keys/mnemonics.txt", "tbnb...")
}


async function delegateValidator(accountsPath, start, end, amount, validatorAddress, password) {
    console.log(password)
    console.log(client.chainId)
    const delegators = (await readAccounts(accountsPath, password)).slice(start, end)
    for (const delegator of delegators) {
      client.setPrivateKey(delegator.privateKey)
      try {
          const res = await client.stake.bscDelegate({
              delegateAddress: delegator.address,
              sideChainId: "chapel",
              validatorAddress,
              amount,
          })
          console.log(res)
      } catch (error) {
          continue
      }
    }
}

async function fundDelegators(accountsPath, start, end, amount, password) {
    const validatorAccount = await readValidator("keys/validator.json", password)
    client.setPrivateKey(validatorAccount.privateKey)
    const delegators = (await readAccounts(accountsPath, password)).slice(start, end)
    const outputs = delegators.map(d => {
        return {
            to: d.address,
            coins: [{
                "denom": "BNB",
                "amount": amount
            }]
        }
    })
    const result = await client.multiSend(validatorAccount.address, outputs)
    console.log(result)
}

async function createAccounts(count, password) {
    if (!fs.existsSync('keys')) {
        fs.mkdirSync('keys');
    }
    list = []
    for (var i = 0; i < count; i++) {
        const account = client.createAccountWithKeystore(password)
        list.push(account.keystore)
    }
    const json = JSON.stringify(list)
    fs.writeFile('keys/accounts.json', json, function (err) {
        if (err) throw err;
        console.log('complete');
    })
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

async function createValidator(mnemonic, password) {
    if (!fs.existsSync('keys')) {
        fs.mkdirSync('keys');
    }
    const account = client.recoverAccountFromMnemonic(mnemonic)
    var keystore = crypto.generateKeyStore(account.privateKey, password);
    const json = JSON.stringify(keystore)
    fs.writeFile('keys/validator.json', json, function (err) {
        if (err) throw err;
        console.log('complete');
    })
}

async function readValidator(path, password) {
    const content = fs.readFileSync(path, 'utf8')
    const account = client.recoverAccountFromKeystore(content, password)
    return account
}
main()
