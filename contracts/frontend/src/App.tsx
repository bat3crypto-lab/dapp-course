
import { useEffect, useState } from 'react'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { sepolia } from 'wagmi/chains'

import {
  projectRegistryAddress,
  projectRegistryAbi,
} from './contracts/projectRegistry'

import './App.css'

import ProjectCard from './ProjectCard'
import type { ProjectDetails } from './ProjectCard'

function App() {
  // 1. Wallet connection
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending: isConnecting, error: connectError } =
    useConnect()
  const { disconnect } = useDisconnect()

  const onSepolia = chainId === sepolia.id
  const walletConnector = connectors[0]

  // 2. Registration form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // 3. Read project count
  const {
    data: projectCount,
    isLoading: isLoadingCount,
    isError: isCountError,
    error: countError,
    refetch: refetchCount,
  } = useReadContract({
    address: projectRegistryAddress,
    abi: projectRegistryAbi,
    functionName: 'projectCount',
    chainId: sepolia.id,
  })

  // Read the details of all registered projects.
  const count = projectCount === undefined
    ? 0
    : Number(projectCount)

  const projectIds = Array.from(
    { length: Number.isSafeInteger(count) && count > 0 ? Math.min(count, 100) : 0 },
    (_, index) => BigInt(index + 1)
  )

  const {
    data: projectResults,
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjects,
  } = useReadContracts({
    contracts: projectIds.map((id) => ({
      address: projectRegistryAddress,
      abi: projectRegistryAbi,
      functionName: 'projects',
      args: [id],
      chainId: sepolia.id,
    })),
    query: {
      enabled: projectIds.length > 0,
    },
  })


  const registeredProjects = (projectResults ?? [])
    .filter((result) => result.status === 'success')
    .map((result) => result.result as ProjectDetails)


  // 4. Submit a transaction through MetaMask
  const {
    writeContract,
    data: transactionHash,
    isPending: isAwaitingWallet,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  // 5. Wait for the transaction to be mined
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
    chainId: sepolia.id,
  })

  // 6. Update the UI after confirmation
  useEffect(() => {
    if (isConfirmed) {
      void refetchCount()
      void refetchProjects()
      setName('')
      setDescription('')
    }
  }, [isConfirmed, refetchCount, refetchProjects])

  const isSubmitting = isAwaitingWallet || isConfirming

  const canRegister =
    isConnected &&
    onSepolia &&
    name.trim().length > 0 &&
    !isSubmitting

  function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canRegister) return

    // Clear the previous transaction state.
    resetWrite()

    writeContract({
      address: projectRegistryAddress,
      abi: projectRegistryAbi,
      functionName: 'registerProject',
      args: [name.trim(), description.trim()],
      chainId: sepolia.id,
    })
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Ethereum Sepolia</p>
          <h1>Project Registry</h1>
          <p className="subtitle">
            Register and manage projects on the blockchain.
          </p>
        </div>

        <div>
          {isConnected ? (
            <div>
              <p>
                Connected: {address?.slice(0, 6)}...
                {address?.slice(-4)}
              </p>

              <button
                type="button"
                onClick={() => disconnect()}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!walletConnector || isConnecting}
              onClick={() => {
                if (walletConnector) {
                  connect({ connector: walletConnector })
                }
              }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </header>

      {connectError && (
        <p role="alert">
          Wallet error: {connectError.message}
        </p>
      )}

      {isConnected && !onSepolia && (
        <section className="card">
          <p role="alert">
            Wrong network. Switch MetaMask to Ethereum Sepolia.
          </p>
        </section>
      )}

      <section className="card">
        <h2>Register a Project</h2>

        <p className="muted">
          {!isConnected
            ? 'Connect MetaMask to register a project.'
            : !onSepolia
              ? 'Switch to Sepolia to continue.'
              : 'Enter your project details below.'}
        </p>

        <form onSubmit={handleRegister}>
          <label htmlFor="name">Project Name</label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="My First dApp"
            disabled={isSubmitting}
            required
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="My first project registered on Sepolia"
            disabled={isSubmitting}
          />

          <button type="submit" disabled={!canRegister}>
            {isAwaitingWallet
              ? 'Confirm in MetaMask...'
              : isConfirming
                ? 'Confirming transaction...'
                : 'Register Project'}
          </button>
        </form>

        {isAwaitingWallet && (
          <p role="status">
            Check MetaMask and review the transaction.
          </p>
        )}

        {transactionHash && (
          <p>
            Transaction:{' '}
            <a
              href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Sepolia Etherscan
            </a>
          </p>
        )}

        {isConfirming && (
          <p role="status">
            Transaction submitted. Waiting for confirmation...
          </p>
        )}

        {isConfirmed && (
          <p role="status">
            Project registered successfully!
          </p>
        )}

{writeError && (
  <p role="alert">
    Transaction error: {writeError.message}
  </p>
)}

        {isReceiptError && (
          <p role="alert">
            Confirmation error:{' '}
            {receiptError?.message}
          </p>
        )}
      </section>

      
      <section className="card">
        <h2>Registered Projects</h2>

        {isLoadingCount ? (
          <p className="muted">Loading project count...</p>
        ) : isCountError ? (
          <p role="alert">
            Error: {countError?.shortMessage ?? countError?.message}
          </p>
        ) : (
          <p>
            Total registered projects:{' '}
            <strong>{projectCount?.toString() ?? '0'}</strong>
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            void refetchCount()
            void refetchProjects()
          }}
        >
          Refresh Projects
        </button>

        {isLoadingProjects && (
          <p className="muted">Loading project details...</p>
        )}

        {projectsError && (
          <p role="alert">
            Failed to load projects: {projectsError.message}
          </p>
        )}

        {projectIds.length === 0 && !isLoadingCount && (
          <p className="muted">No projects registered yet.</p>
        )}

        {registeredProjects.map((project) => (
          <ProjectCard
            key={project[0].toString()}
            project={project}
            onUpdated={() => {
              void refetchProjects()
            }}
          />
        ))}

      {registeredProjects.map((project) => (
          <ProjectCard
            key={project[0].toString()}
            project={project}
            onUpdated={() => {
              void refetchProjects()
            }}
          />
        ))}
      </section>

      <footer>
        Built with React, TypeScript, Wagmi, and Ethereum.
      </footer>
    </main>
  )
}

export default App