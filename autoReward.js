require('dotenv').config()

const Web3 = require('web3')
var sleep = require('sleep');
const random = require('random')

const { send, queryStatus, queryNonce, querySecondsToBreath } = require('./utils');

const validator = process.env.REWARD_VALIDATOR_ADDRESS
const testnet = process.env.VALIDATOR_RPC || "https://data-seed-prebsc-2-s1.binance.org:8545"
const web3 = new Web3(new Web3.providers.HttpProvider(testnet))

const main = async () => {
  var amount = random.float(0.001, 0.01)
  const fromPriv = process.env.PUMP_FROM_PRIV
  const pumpAmount = process.env.PUMP_AMOUNT
  const account = web3.eth.accounts.privateKeyToAccount(fromPriv);
  const toAddress = account.address

  try {
      var { lastValidatedBlock, triggerBlockHeight, step } = await queryStatus(validator, account.address)
      console.log("Last validated block is:", lastValidatedBlock, "triggering at block:", triggerBlockHeight, "step:", step)
  } catch (error) {
      console.log(error)
      sleep.sleep(random.int(60, 100))
      return
  }

  var lastHeight
  while (true) {
      try {

          currentHeight = await web3.eth.getBlockNumber()
          if (currentHeight == lastHeight) {
              continue
          }

          lastHeight = currentHeight
          console.log(`currentHeight: ${currentHeight}, expecting: ${triggerBlockHeight}, ${triggerBlockHeight - currentHeight} left`)
          if (currentHeight == triggerBlockHeight) {
              const gasPrice = pumpAmount * 1e8 * 10 / 21000
              console.log("SENDING AT BLOCK HEIGHT:", currentHeight, "pumpAmount", pumpAmount)
              nonce = await queryNonce(account.address)
              await send(fromPriv, nonce, amount, toAddress, gasPrice, currentHeight, validator)
              console.log("sleeping 100s")
              secondsToBreath = await querySecondsToBreath()
              console.log("secondsToBreath:", secondsToBreath)
              sleep.sleep(100)
              const status = await queryStatus(validator, account.address)
              lastValidatedBlock = status.lastValidatedBlock
              triggerBlockHeight = status.triggerBlockHeight
              step = status.step
              console.log("Last validated block is:", lastValidatedBlock, "triggering at block:", triggerBlockHeight, "step:", step, "nonce:", nonce)
          } else if (currentHeight > triggerBlockHeight) {
              console.log("reupdating status:")
              sleep.sleep(5)
              const status = await queryStatus(validator, account.address)
              lastValidatedBlock = status.lastValidatedBlock
              triggerBlockHeight = status.triggerBlockHeight
              step = status.step || step
              continue
          } else {
              sleep.sleep(2)
          }
      } catch (error) {
          console.log(error)
          sleep.sleep(random.int(20, 60))
          const status = await queryStatus(validator, account.address)
          lastValidatedBlock = status.lastValidatedBlock
          triggerBlockHeight = status.triggerBlockHeight
          step = status.step || step
          continue
      }
  }
}

main()
