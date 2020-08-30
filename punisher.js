require('dotenv').config()

const Web3 = require('web3')
var sleep = require('sleep');
const random = require('random')

const { send, queryStatus, queryPunisher, queryNonce, querySecondsToBreath } = require('./utils');

const testnet = `https://data-seed-prebsc-2-s1.binance.org:8545`

const web3 = new Web3(new Web3.providers.HttpProvider(testnet))

const main = async () => {
    var amount = random.float(0.001, 0.01)
    const fromPriv = process.env.POLICE_PRIV
    const validator = process.env.CUSTOM_VALIDATOR
    if (validator == "" || validator == undefined) {
        console.log("PUNISH:", validator, "not found victim")
        return
    }

    const account = web3.eth.accounts.privateKeyToAccount(fromPriv);
    const toAddress = account.address

    try {
        var { lastValidatedBlock, triggerBlockHeight, step } = await queryStatus(validator, account.address)
        console.log("PUNISH:", validator, "Last validated block is:", lastValidatedBlock, "triggering at block:", triggerBlockHeight, "step:", step)
    } catch (error) {
        console.log("PUNISH:", validator, error)
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
            if (secondsToBreath > 360) {
                console.log("secondsToBreath:", secondsToBreath, "sleeping", 50)
                sleep.sleep(50)
                continue
            }

            currentHeight = await web3.eth.getBlockNumber()
            if (currentHeight == lastHeight) {
                continue
            }
            lastHeight = currentHeight
            console.log("PUNISH:", validator, `secondsToBreath:, ${secondsToBreath}, currentHeight: ${currentHeight}, expecting: ${triggerBlockHeight}, ${triggerBlockHeight - currentHeight} left`)
            if (currentHeight == triggerBlockHeight - 1) {
                const { rank, punishAmount } = await queryPunisher(validator, secondsToBreath)
                rewardNeeded = punishAmount
                console.log("PUNISH:", validator, "PREPARING, punishAmount:", rewardNeeded / 1e8, "BNB, current rank:", rank)
                continue
            }
            if (currentHeight == triggerBlockHeight) {
                if (rewardNeeded <= 0) {
                    console.log("PUNISH:", validator, "income > median or already top 1, skip")
                    continue
                }
                if (rewardNeeded / 1e8 > (Number(process.env.MAX_PUNISH) || 18)) {
                    rewardNeeded = (Number(process.env.MAX_PUNISH) || 18) * 1e8
                } else if (rewardNeeded / 1e8 < 2) {
                    rewardNeeded = 2 * 1e8
                }
                const gasPrice = rewardNeeded * 10 / 21000
                nonce = await queryNonce(account.address)
                console.log("PUNISH:", validator, "SENDING AT BLOCK HEIGHT:", currentHeight, "rewardNeeded", rewardNeeded)
                await send(fromPriv, nonce, amount, toAddress, gasPrice, currentHeight, validator)
                console.log("PUNISH:", validator, "sleeping 100")
                sleep.sleep(40)
                const status = await queryStatus(validator, account.address)
                lastValidatedBlock = status.lastValidatedBlock
                triggerBlockHeight = status.triggerBlockHeight
                step = status.step
                console.log("PUNISH:", validator, "Last validated block is:", lastValidatedBlock, "triggering at block:", triggerBlockHeight, "step:", step, "nonce:", nonce)
            } else if (currentHeight > triggerBlockHeight) {
                console.log("PUNISH:", validator, "reupdating status:")
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
            console.log("PUNISH:", validator, error)
            sleep.sleep(random.int(5, 10))
            const status = await queryStatus(validator, account.address)
            lastValidatedBlock = status.lastValidatedBlock
            triggerBlockHeight = status.triggerBlockHeight
            step = status.step || step
            continue
        }
    }
}
main();
