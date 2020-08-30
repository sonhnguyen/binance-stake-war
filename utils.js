require('dotenv').config()

const EthereumTx = require('ethereumjs-tx')
const Common = require('ethereumjs-common').default;
const fetch = require('node-fetch');


exports.send = async function (fromPriv, nonce, amountToSend, toAddress, gasPrice, currentHeight, validator) {
  const customCommon = Common.forCustomChain(
      'mainnet',
      {
          name: 'my-network',
          networkId: 97,
          chainId: 97,
      },
      'petersburg',
  )

  var details = {
      "to": toAddress,
      "value": web3.utils.toHex(web3.utils.toWei(amountToSend.toFixed(18), 'ether')),
      "gas": 21000,
      "gasPrice": web3.utils.toHex(Math.floor(gasPrice * 1000000000)), // converts the gwei price to wei
      "nonce": nonce,
      "chainId": 97
  }

  const transaction = new EthereumTx.Transaction(details, { common: customCommon },)
  transaction.sign(Buffer.from(fromPriv, 'hex'))
  const serializedTransaction = transaction.serialize()

  account = web3.eth.accounts.privateKeyToAccount(fromPriv);
  fee = gasPrice * 1000000000 * 21000 / 1e18
  console.log("Validator:", validator, `FEE: ${fee} BNB, gasPrice: ${gasPrice}. Sending ${amountToSend} from ${account.address} to ${toAddress}`)
  const tx = await web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'))
  const url = `https://explorer.binance.org/smart-testnet/tx/${tx.transactionHash}`
  console.log("Validator:", validator, url)
  fs.appendFileSync('./txs.txt', `Fee: ${fee}, height: ${currentHeight}, Validator: ${validator}, Tx: ${url}\n`);
}

exports.queryStatus = async function (validator) {
  const validatorAPI = `https://explorer.binance.org/smart-testnet/address/${validator}/validations?type=JSON`
  const response = await fetch(validatorAPI);
  const json = await response.json()
  const lastValidatedBlock = Number(json.items[0].match(/^\d+|\d+\b|\d+(?=\w)/g)[0])
  const secondLastValidatedBlock = Number(json.items[1].match(/^\d+|\d+\b|\d+(?=\w)/g)[0])
  const third = Number(json.items[2].match(/^\d+|\d+\b|\d+(?=\w)/g)[0])
  const distance = lastValidatedBlock - secondLastValidatedBlock == 0 ? lastValidatedBlock - third : lastValidatedBlock - secondLastValidatedBlock
  const distanceValidated = distance - 2
  const step = distanceValidated > 39 ? 39 : distanceValidated
  const triggerBlockHeight = lastValidatedBlock + step
  return {
      lastValidatedBlock, triggerBlockHeight, step
  }
}

exports.querySecondsToBreath = async function () {
  const url = "https://data-seed-pre-1-s1.binance.org/status"
  const response = await fetch(url);
  const json = await response.json()
  const latestBlock = json.result.sync_info.latest_block_height;
  const secondsToBreath = (3112.0 - latestBlock % 3112) * 2 * 60 * 60 / 3112
  return secondsToBreath
}


exports.queryCurrentMedian = async function (validator) {
  const url = "https://testnet-dex-asiapacific.binance.org/api/v1/sol/currentMedianCollectedReward"
  const response = await fetch(url);
  const json = await response.json();
  const listValidators = json.validator_reward_rank_info_list
  const minimumDistance = listValidators[1].distance_to_median
  const valStanding = listValidators.filter(x => x.consensus_address.toLowerCase() == validator.toLowerCase())[0]
  console.log("Validator:", validator, "bscHeight:", json.bsc_height, "rank:", valStanding.rank, "needed:", (valStanding.median - valStanding.incoming) / 1e8)
  return { height: json.bsc_height, distance: valStanding.median - valStanding.incoming, rank: valStanding.rank, minimumDistance: minimumDistance }
}

exports.queryNonce = async function (address) {
  const nonce = await web3.eth.getTransactionCount(address)
  return nonce
}


exports.queryPunisher = async function (validator, bbSeconds) {
  const url = "https://testnet-dex-asiapacific.binance.org/api/v1/sol/currentMedianCollectedReward"
  const response = await fetch(url);
  const json = await response.json();
  const listValidators = json.validator_reward_rank_info_list
  const farDistance = listValidators.filter(x => x.rank == 25)[0]
  const valStanding = listValidators.filter(x => x.consensus_address.toLowerCase() == validator.toLowerCase())[0]
  const ladder = 0.66 + Math.floor(bbSeconds / 120)
  const punishAmount = ((farDistance.median + farDistance.distance_to_median - valStanding.incoming) * 5) / ladder
  console.log("PUNISH:", validator, "bscHeight:", json.bsc_height, "rank:", valStanding.rank, "punishment:", punishAmount / 1e8)
  return { height: json.bsc_height, punishAmount: punishAmount, rank: valStanding.rank }
}
