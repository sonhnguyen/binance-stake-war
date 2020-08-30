require('dotenv').config()

const Web3 = require('web3')
var sleep = require('sleep');
const random = require('random')

const { send, queryStatus, queryCurrentMedian, queryNonce, querySecondsToBreath } = require('./utils');

const validator = process.env.AUTO_VALIDATOR_ADDRESS
const testnet = process.env.VALIDATOR_RPC || "https://data-seed-prebsc-2-s1.binance.org:8545"
const web3 = new Web3(new Web3.providers.HttpProvider(testnet))

const main = async () => {
    var amount = random.float(0.001, 0.01)
    var fromPriv = process.env.AUTO_FROM_PRIV
    const account = web3.eth.accounts.privateKeyToAccount(fromPriv);
    var toAddress = process.env.AUTO_TO_ADDRESS
    try {
        var { lastValidatedBlock, triggerBlockHeight, step } = await queryStatus(validator, account.address)
        console.log("Validator:", validator, "Last validated block is:", lastValidatedBlock, "triggering at block:", triggerBlockHeight, "step:", step)
    } catch (error) {
        console.log(error)
        sleep.sleep(random.int(60, 100))
        return
    }

    var rewardNeeded
    var lastHeight
    var secondsToBreath
    var nonce
    while (true) {
        try {
            secondsToBreath = await querySecondsToBreath()
            if (secondsToBreath > 120) {
                console.log("Validator:", validator, "secondsToBreath:", secondsToBreath, "sleeping until 120")
                sleep.sleep(Math.floor(secondsToBreath-120))
                continue
            }

            currentHeight = await web3.eth.getBlockNumber()
            if (currentHeight == lastHeight) {
                continue
            }
            lastHeight = currentHeight
            console.log("Validator:", validator, `secondsToBreath:, ${secondsToBreath}, currentHeight: ${currentHeight}, expecting: ${triggerBlockHeight}, ${triggerBlockHeight - currentHeight} left, ${validator}`)

            if (currentHeight == triggerBlockHeight - 1) {
                const { distance, rank, minimumDistance } = await queryCurrentMedian(validator)
                rewardNeeded = distance
                if (secondsToBreath < 120 && validator.toLowerCase() == process.env.AUTO_VALIDATOR_ADDRESS.toLowerCase()) {
                    const blocksLeft = secondsToBreath / 2.3
                    rewardNeeded = distance + blocksLeft * minimumDistance
                }
                if (process.env.CUSTOM_VALIDATOR != undefined && validator.toLowerCase() == process.env.CUSTOM_VALIDATOR.toLowerCase() && secondsToBreath < 150) {
                    rewardNeeded = 0
                }
                console.log("Validator:", validator, "PREPARING, distance:", distance / 1e8, "rewardNeeded:", rewardNeeded / 1e8, "BNB, current rank:", rank)
                continue
            }
            if (currentHeight == triggerBlockHeight) {
                if (rewardNeeded <= 0) {
                    console.log("Validator:", validator, "income > median or already top 1, skip")
                    continue
                }
                if (rewardNeeded / 1e8 > (Number(process.env.MAX_REWARD) || 20)) {
                    rewardNeeded = (Number(process.env.MAX_REWARD) || 20) * 1e8
                }
                const gasPrice = rewardNeeded * 10 / 21000
                nonce = await queryNonce(account.address)
                console.log("Validator:", validator, "SENDING AT BLOCK HEIGHT:", currentHeight, "rewardNeeded", rewardNeeded)
                await send(fromPriv, nonce, amount, toAddress, gasPrice, currentHeight, validator)
                console.log("Validator:", validator, "sleeping 40")
                if (secondsToBreath < 150) {
                    continue
                }
                sleep.sleep(40)
                var { lastValidatedBlock, triggerBlockHeight, step } = await queryStatus(validator, account.address)
                console.log("Validator:", validator, "Last validated block is:", lastValidatedBlock, "triggering at block:", triggerBlockHeight, "step:", step, "nonce:", nonce)
            } else if (currentHeight > triggerBlockHeight) {
                console.log("Validator:", validator, "reupdating status:")
                sleep.sleep(5)
                var { lastValidatedBlock, triggerBlockHeight, step } = await queryStatus(validator, account.address)
                continue
            } else {
                sleep.sleep(2)
            }
        } catch (error) {
            console.log("Validator:", validator, error)
            sleep.sleep(random.int(5, 10))
            var { lastValidatedBlock, triggerBlockHeight, step } = await queryStatus(validator, account.address)
            continue
        }
    }
}

main()
