

import { createPublicClient, http, parseAbiItem } from 'viem'
import { sepolia } from 'viem/chains'

const contractAddress =
  '0x0390044B74c9441DB4D1D802cE504E41F4baDa34'

const client = createPublicClient({
  chain: sepolia,
  transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
})

const events = [
  parseAbiItem(
    'event ProjectRegistered(uint256 indexed id, address indexed owner)'
  ),
  parseAbiItem(
    'event ProjectUpdated(uint256 indexed id, address indexed owner)'
  ),
  parseAbiItem(
    'event OwnershipTransferred(uint256 indexed id, address indexed previousOwner, address indexed newOwner)'
  ),
]

async function main() {
  console.log('Reading Project Registry activity from Sepolia...')

  const latestBlock = await client.getBlockNumber()
  const fromBlock =
    latestBlock > 10_000n ? latestBlock - 10_000n : 0n

  const logs = await client.getLogs({
    address: contractAddress,
    events,
    fromBlock,
    toBlock: latestBlock,
  })

  const activity = logs
    .map((log) => ({
      event: log.eventName,
      projectId: log.args.id?.toString(),
      owner: log.args.owner,
      previousOwner: log.args.previousOwner,
      newOwner: log.args.newOwner,
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
    }))
    .sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) {
        return a.blockNumber < b.blockNumber ? -1 : 1
      }
      return a.logIndex - b.logIndex
    })

  console.log(`Found ${activity.length} events.`)

  for (const item of activity) {
    console.log({
      ...item,
      blockNumber: item.blockNumber.toString(),
    })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
