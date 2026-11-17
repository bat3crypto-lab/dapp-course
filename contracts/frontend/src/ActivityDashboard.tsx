
import { useEffect, useState } from 'react'
import {
  createPublicClient,
  http,
  parseAbiItem,
} from 'viem'
import { sepolia } from 'viem/chains'

const contractAddress =
  '0x0390044B74c9441DB4D1D802cE504E41F4baDa34'

const client = createPublicClient({
  chain: sepolia,
  transport: http(
    'https://ethereum-sepolia-rpc.publicnode.com'
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

  useEffect(() => {
    let cancelled = false

    async function loadActivity() {
      try {
        const latestBlock = await client.getBlockNumber()

        const fromBlock =
          latestBlock > 10_000n
            ? latestBlock - 10_000n
            : 0n

        const logs = await client.getLogs({
          address: contractAddress,
          events,
          fromBlock,
          toBlock: latestBlock,
        })

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

        if (!cancelled) {
          setActivities(results)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load activity'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadActivity()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p>Loading blockchain activity...</p>
  }

  if (error) {
    return (
      <section>
        <h2>Project Activity</h2>
        <p role="alert">Error: {error}</p>
      </section>
    )
  }

  return (
    <section>
      <h2>Project Activity</h2>

      {activities.length === 0 ? (
        <p>No recent activity found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Project</th>
              <th>Transaction</th>
            </tr>
          </thead>

          <tbody>
            {activities.map((activity) => (
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
