const { BncClient, crypto, utils, Transaction, Transfer, types } = require("@binance-chain/javascript-sdk")

var fs = require('fs');
require('dotenv').config()
const fetch = require('node-fetch');

const client = new BncClient("https://testnet-dex.binance.org/")
client.chooseNetwork("testnet")
client.chainId = "Binance-Chain-Ganges"

async function main() {
    await ranks()
    const block = ['0x71082a6A3ade04C53507b5F514aa313D8DD21b11', '0xBc93f0661A49822b66B07E0727848Ed3598551E0', '0x4eA76dd723D5f218F877768d6841079D1f1C319F', '0x9b51D5C0DC20B732fe6Ae831F9b5c1574c545364']
    await exportVictims(0, 15, block)
    await parseHistoryMedianCollectedReward()
    await parsehistoryDelegatorRewards()
}

async function ranks(validator1, validator2) {
    const topValidators = await queryTopMedian()
    const results1 = topValidators.map((x, index) => {
        return {
            address: x.validator_addr,
            rank: index + 1
        }
    }).filter(x => x.address == validator)
    const topRewards = await queryTopReward()
    const results2 = topRewards.map((x, index) => {
        return {
            address: x.ConsensusAddress,
            rank: index + 1
        }
    }).filter(x => x.address == validator2)
    console.log(results1)
    console.log(results2)
}

async function exportVictims(from, to, blockList) {
    const list = await queryTopMedian()
    const results = list.slice(from, to, blockList).map(x => x.validator_addr).filter(x => x != "").filter(x => block.indexOf(x) === -1)
    fs.unlinkSync('police.sh')
    results.forEach(victim => {
        fs.appendFileSync('police.sh', `CUSTOM_VALIDATOR="${victim}" pm2 start badGuysSender.js -f\n`);
    });
    console.log(results)
    console.log(results.length)
}

async function parseHistoryMedianCollectedReward() {
    const url = "https://testnet-dex-asiapacific.binance.org/api/v1/sol/historyMedianCollectedReward";
    const response = await fetch(url);
    const json = await response.json()
    const parsed = json.map(j => {
        return {
            ...j,
            staking_amount: j.staking_amount / 1e8,
            commission: Number(j.commission) / 1e8,
            incoming: j.incoming / 1e8,
            median: j.median / 1e8,
            distance_to_median: j.distance_to_median / 1e8,
        }
    })
    const result = parsed.sort((a, b) => b.breathe_block_idx - a.breathe_block_idx)
    latestBreathBlock = result.slice(0, 35).sort((a, b) => b.rank - a.rank);
    topValidators = await queryTopMedian()
    var validatorByRank = topValidators.reduce(function (map, obj, index) {
        map[obj.validator_addr] = index;
        return map;
    }, {});
    latestBreathBlock = latestBreathBlock.map(x => {
        return {
            ...x,
            leaderboardRank: validatorByRank[x.validator]
        }
    })
    sorted = latestBreathBlock.sort((a, b) => b.leaderboardRank - a.leaderboardRank)
    console.log(sorted)
}

async function queryTopMedian() {
    const url = "https://testnet-dex-asiapacific.binance.org/api/v1/sol/topValidators?";
    const response = await fetch(url);
    const json = await response.json()
    return json
}

async function queryTopReward() {
    const url = "https://testnet-dex-asiapacific.binance.org/api/v1/sol/topDelegatorRewardRate?";
    const response = await fetch(url);
    const json = await response.json()
    return json
}

function uniqArr(arr) {
    var uSet = new Set(arr);
    return ([...uSet]); // Back to array
}

function calculateMedian(numbers) {
    numbers.sort(function (a, b) {
        return a - b;
    });
    let lowMiddle = Math.floor((numbers.length - 1) / 2);
    let highMiddle = Math.ceil((numbers.length - 1) / 2);
    let median = (numbers[lowMiddle] + numbers[highMiddle]) / 2;
    return median
}

async function parsehistoryDelegatorRewards() {
    const url = "https://testnet-dex-asiapacific.binance.org/api/v1/sol/historyDelegatorRewards";
    const response = await fetch(url);
    const json = await response.json()
    const parsed = json.map(d => {
        return {
            ConsensusAddress: d.ConsensusAddress,
            Reward: d.Reward / 1e8,
            VotingPower: d.VotingPower / 1e8,
            CommissionRate: d.CommissionRate / 1e6,
            BbcHeight: d.BbcHeight,
            BscHeight: d.BscHeight,
            TxCount: d.TxCount,
            UniqueAddressCount: d.UniqueAddressCount,
            Rate: Number(d.Rate) * 100,
        }
    });
    const result = parsed.sort((a, b) => b.BscHeight - a.BscHeight)
    latestBreathBlock = result.slice(0, 35);

    latestBreathBLockResult = latestBreathBlock.sort((a, b) => a.Rate - b.Rate);
    console.log(latestBreathBLockResult)
}

main()
