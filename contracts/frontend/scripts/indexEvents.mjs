import { createPublicClient, http, parseAbiItem } from 'viem'
import { sepolia } from 'viem/chains'
import { readFile, writeFile } from 'node:fs/promises'
import historicalEvents from './contracts/historicalEvents.json'

const rpcUrl = process.env.ALCHEMY_RPC

if (!rpcUrl) {
  console.error('Missing ALCHEMY_RPC environment variable')
  process.exit(1)
}

const client = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
})

const contractAddress =
  '0x0390044B74c9441DB4D1D802cE504E41F4baDa34'

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
  console.log('Fetching historical ProjectRegistry events...')

   const startBlock = BigInt(process.env.START_BLOCK ?? '12155500')
  const endBlock = BigInt(process.env.END_BLOCK ?? '12155568')
  const batchSize = 10n

  const allLogs = []

  for (
    let fromBlock = startBlock;
    fromBlock <= endBlock;
    fromBlock += batchSize
  ) {
    const toBlock =
      fromBlock + batchSize - 1n > endBlock
        ? endBlock
        : fromBlock + batchSize - 1n

    const logs = await client.getLogs({
      address: contractAddress,
      events,
      fromBlock,
      toBlock,
    })

    allLogs.push(...logs)

    console.log(
      `Checked blocks ${fromBlock}–${toBlock}: ${logs.length} event(s)`
    )
  }

  for (const log of allLogs) {
    console.log({
      event: log.eventName,
      projectId: log.args.id?.toString(),
      blockNumber: log.blockNumber.toString(),
      transactionHash: log.transactionHash,
    })
  }
  
  const filePath = 'src/contracts/historicalEvents.json'

  let existingActivities = []

  try {
    existingActivities = JSON.parse(
      await readFile(filePath, 'utf8')
    )
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }

  const newActivities = allLogs.map((log) => ({
    event: log.eventName,
    projectId: log.args.id?.toString() ?? '?',
    transactionHash: log.transactionHash,
    blockNumber: log.blockNumber.toString(),
    logIndex: log.logIndex,
  }))

  const uniqueActivities = new Map()

  for (const activity of [...existingActivities, ...newActivities]) {
    const key = `${activity.transactionHash}-${activity.logIndex}`
    uniqueActivities.set(key, activity)
  }

  const activities = [...uniqueActivities.values()].sort(
    (a, b) =>
      Number(BigInt(a.blockNumber) - BigInt(b.blockNumber)) ||
      a.logIndex - b.logIndex
  )

  await writeFile(
    filePath,
    JSON.stringify(activities, null, 2) + '\n'
  )
  console.log('Saved events to src/contracts/historicalEvents.json')

  console.log(`Found ${allLogs.length} event(s) total.`)
}


main().catch((error) => {
  console.error(error.shortMessage ?? error.message)
  process.exit(1)
})