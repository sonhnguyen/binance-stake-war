# binance-stake-war
Codes I used to win Binance Stake War.
Info:
https://community.binance.org/topic/3037/stake-wars-announcement

Binance Stake War is a competition that organized by Binance to promote and testing the uses of their dual chain Binance Smart Chain and Binance Chain. The competition is competed by validators and there are multiple scoring to decides who wins. These are the codes that I used to automate the processes and mainly targeting in winning `Top Validator prize - For the best active validator and being closest to the median rewards at breath blocks.`

There are a few hints for winning this category, as also discussed by other members of the competition such as:
https://community.binance.org/topic/3108/hints-to-win-staking-war/3
https://community.binance.org/topic/3132/my-experience-with-the-stake-wars
https://community.binance.org/topic/3134/my-experience-with-bsc-stakewars-2020-08-17-to-2020-08-27

In sort, to be able to control your fate with the reward fees, you should modify your validators for not accepting attackers (they will increase your reward fee in that breathblock and mess up with your scoring) and for not broadcasting your own transaction (so you can control the fee that you want to have when it is your validator's turn to mine). The codes for modify your BSC validator can be found here:

https://github.com/sonhnguyen/bsc/commit/a466b9993a45282e1aa48689f4b358a36176e5c9

That is the preparing step, now your validator is ready for the race. In general, since you are not receiving attacks from others (which mean your fee will be low all the time), your scoring is about whether you are the closest one who mine the block near breathblock timing to tail with me distance to median. But near the end of the race, when all the nodes and equipped with the same modification, this getting more complicated and requires me to modify some scoring algorithm.

In the first few days, most validators are not equipped with enough defense (they are open for attacking) or/ and offense (they broadcast their txs to other nodes so they are not 100% to be the one who mine their own tx). The competition is simply the node who is most equipped both defense and offense and having the script to match the median in their last mined block which is closest to the breathblock.

In the last few days, the game involved. Basically everyone running the same defense + offense setup with snipers/ attacking strategy (some create smart contract that will pump the gas fee for the targetted miner, meanwhile my `punisher.js` just spam the transaction based on predicting their time to mine, which still accurate of some sort). With this in mind, they all try to be the last one to match the median in the last 120seconds and the median can pump quickly to 0 to 20-30 bnb real quick. So, I try to modify the numbers based on what I'm feeling really. In the last 120 seconds to the breathblock, which is roughly the last time that my node will mine, I try to over compensate the median because other nodes will pump the median in the last minutes. It is still depends on luck but I managed to stay top 5 most of the time in the last few days to be able to keep up with the competition.

You can find in this repository:
- `autoMedian.js`: The main script I used to stay in median.
- `punisher.js`: The script I used to attack vulnerable nodes (they are either not modified or hosted on Ankr)
- `autoReward.js`: A simple version of `autoMedian.js` to reward my node with big fee to compete in `Most reward Validator`.
- `cleanFunds.js`, `stats.js`, `createAccounts.js`: Ultility scripts to interact with BSC and BC, managing accounts and transfering funds, ...

Overall it was a fun competition week, I min maxing the script to stay competitive with others nodes who is running their script in the same manner. In the end, it still depends on luck of some sort. Shout out to `gato`, `tigdar`, `zzz` and others who have really good scriptings and consistently getting high scoring. Thanks Binance for hosting a well-thought competition. It will be better if the faucet and airdrop system is not being heavily abused by some but I guess it is inevitable in an online setting. Forgive the code for being messy, it was my hackathon attitude :D
