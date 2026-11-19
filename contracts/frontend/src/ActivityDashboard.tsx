
import { useCallback, useEffect, useState } from 'react'
import {
  createPublicClient,
  http,
  parseAbiItem,
} from 'viem'
import { sepolia } from 'viem/chains'
import historicalEvents from './contracts/historicalEvents.json'

const contractAddress =
  '0x0390044B74c9441DB4D1D802cE504E41F4baDa34'

const client = createPublicClient({
  chain: sepolia,
  transport: http(
    'https://ethereum-sepolia.publicnode.com'
  ),
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

type ActivityItem = {
  event: string
  projectId: string
  transactionHash: string
  blockNumber: bigint
  logIndex: number
}

export default function ActivityDashboard() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  const loadActivity = useCallback(async () => {
    setLoading(true)
    setError(null)

    const savedActivities: ActivityItem[] = historicalEvents.map(
      (activity) => ({
        ...activity,
        blockNumber: BigInt(activity.blockNumber),
      })
    )

    setActivities(savedActivities)

    try {
      const currentBlock = await client.getBlockNumber()
// Stay 20 blocks behind the reported head to avoid
// requests reaching an RPC node that is slightly behind.
const latestBlock =
  currentBlock > 20n ? currentBlock - 20n : 0n

      
      
           const batchSize = 1_000n

      // Temporarily query only recent blocks.
                const earliestBlock =
        latestBlock >= 5_000n - 1n
          ? latestBlock - 5_000n + 1n
          : 0n

      const logs = []

      let toBlock = latestBlock

      while (toBlock >= earliestBlock) {
        const fromBlock =
          toBlock >= batchSize - 1n
            ? toBlock - batchSize + 1n
            : 0n

        const batchLogs = await client.getLogs({
          address: contractAddress,
          events,
          fromBlock:
            fromBlock < earliestBlock
              ? earliestBlock
              : fromBlock,
          toBlock,
        })

        logs.push(...batchLogs)

        if (fromBlock <= earliestBlock) {
          break
        }

        toBlock = fromBlock - 1n
      }


      const results = logs
        .map((log) => ({
          event: log.eventName,
          projectId: log.args.id?.toString() ?? '?',
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          logIndex: log.logIndex,
        }))
        .sort((a, b) => {
          if (a.blockNumber !== b.blockNumber) {
            return a.blockNumber > b.blockNumber ? -1 : 1
          }

          return b.logIndex - a.logIndex
        })

    

      const uniqueActivities = new Map()

      for (const activity of [...savedActivities, ...results]) {
        const key = `${activity.transactionHash}-${activity.logIndex}`
        uniqueActivities.set(key, activity)
      }

      const combinedActivities = [...uniqueActivities.values()].sort(
        (a, b) =>
          a.blockNumber !== b.blockNumber
            ? a.blockNumber > b.blockNumber ? -1 : 1
            : b.logIndex - a.logIndex
      )

      setActivities(combinedActivities)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load activity'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadActivity()
  }, [loadActivity])

  const filteredActivities = activities.filter(
    (activity) =>
      filter === 'all' || activity.event === filter
  )

  return (
    <section>
      <h2>Project Activity</h2>

      <div>
        <label htmlFor="activity-filter">
          Filter activity:{' '}
        </label>

        <select
          id="activity-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All activity</option>
          <option value="ProjectRegistered">
            Registrations
          </option>
          <option value="ProjectUpdated">
            Updates
          </option>
          <option value="OwnershipTransferred">
            Ownership transfers
          </option>
        </select>

        <button
          type="button"
          onClick={() => void loadActivity()}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Activity'}
        </button>
      </div>

      {error && (
        <p role="alert">Error: {error}</p>
      )}

      {loading && (
        <p role="status">Loading blockchain activity...</p>
      )}

      {!loading && !error && filteredActivities.length === 0 && (
        <p>No matching recent activity found.</p>
      )}

      {!loading && !error && filteredActivities.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Project</th>
              <th>Transaction</th>
            </tr>
          </thead>

          <tbody>
            {filteredActivities.map((activity) => (
              <tr
                key={`${activity.transactionHash}-${activity.logIndex}`}
              >
                <td>{activity.event}</td>
                <td>#{activity.projectId}</td>
                <td>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${activity.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Etherscan
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

