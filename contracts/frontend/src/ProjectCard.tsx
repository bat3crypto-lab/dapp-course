
import { useEffect, useState } from 'react'
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { sepolia } from 'wagmi/chains'
import {
  projectRegistryAbi,
  projectRegistryAddress,
} from './contracts/projectRegistry'
import { isAddress } from 'viem'

export type ProjectDetails = readonly [
  bigint,
  string,
  string,
  `0x${string}`,
]

type ProjectCardProps = {
  project: ProjectDetails
  onUpdated: () => void
}

export default function ProjectCard({
  project,
  onUpdated,
}: ProjectCardProps) {
  const [id, currentName, currentDescription, owner] = project

  const { address, chainId } = useAccount()
  const isOwner =
    address?.toLowerCase() === owner.toLowerCase()
  const canEdit = isOwner && chainId === sepolia.id

  const [editing, setEditing] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [newOwner, setNewOwner] = useState('')
  const [name, setName] = useState(currentName)
  const [description, setDescription] =
    useState(currentDescription)

  const {
    writeContract,
    data: hash,
    isPending: isAwaitingWallet,
    error: writeError,
    reset,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    chainId: sepolia.id,
  })


  // Ownership transfer transaction
  const {
    writeContract: transferOwnership,
    data: transferHash,
    isPending: isAwaitingTransferWallet,
    error: transferWriteError,
    reset: resetTransfer,
  } = useWriteContract()

  const {
    isLoading: isConfirmingTransfer,
    isSuccess: isTransferConfirmed,
    error: transferReceiptError,
  } = useWaitForTransactionReceipt({
    hash: transferHash,
    chainId: sepolia.id,
  })

  const isTransferring =
    isAwaitingTransferWallet || isConfirmingTransfer

  const validNewOwner =
    isAddress(newOwner) &&
    newOwner.toLowerCase() !== owner.toLowerCase()


  useEffect(() => {
    if (isConfirmed) {
      setEditing(false)
      onUpdated()
    }
  }, [isConfirmed, onUpdated])

  useEffect(() => {
    if (isTransferConfirmed) {
      setTransferring(false)
      setNewOwner('')
      onUpdated()
    }
  }, [isTransferConfirmed, onUpdated])

  const isBusy = isAwaitingWallet || isConfirming

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canEdit || isBusy || !name.trim()) return

    reset()

    writeContract({
      address: projectRegistryAddress,
      abi: projectRegistryAbi,
      functionName: 'updateProject',
      args: [id, name.trim(), description.trim()],
      chainId: sepolia.id,
    })
  }


  function handleTransfer(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!canEdit || isTransferring || !validNewOwner) {
      return
    }

    resetTransfer()

    transferOwnership({
      address: projectRegistryAddress,
      abi: projectRegistryAbi,
      functionName: 'transferProjectOwnership',
      args: [id, newOwner],
      chainId: sepolia.id,
    })
  }


  return (
    <article className="project-card">
      <h3>{currentName}</h3>

      <p>
        <strong>Project ID:</strong> {id.toString()}
      </p>

      <p>
        <strong>Description:</strong>{' '}
        {currentDescription || 'No description provided'}
      </p>

      <p>
        <strong>Owner:</strong>{' '}
        <a
          href={`https://sepolia.etherscan.io/address/${owner}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {owner}
        </a>
      </p>

      {isOwner && <p className="muted">You own this project.</p>}

      {canEdit && !editing && (
        <button
          type="button"
          onClick={() => {
            setName(currentName)
            setDescription(currentDescription)
            setEditing(true)
          }}
        >
          Edit Project
        </button>
      )}

      {editing && (
        <form onSubmit={handleSave}>
          <label htmlFor={`edit-name-${id}`}>
            Project Name
          </label>
          <input
            id={`edit-name-${id}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isBusy}
            required
          />

          <label htmlFor={`edit-description-${id}`}>
            Description
          </label>
          <textarea
            id={`edit-description-${id}`}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            disabled={isBusy}
          />

          <button
            type="submit"
            disabled={!canEdit || isBusy || !name.trim()}
          >
            {isAwaitingWallet
              ? 'Confirm in MetaMask...'
              : isConfirming
                ? 'Confirming...'
                : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={isBusy}
          >
            Cancel
          </button>
        </form>
      )}


{canEdit && !transferring && (
        <button
          type="button"
          onClick={() => {
            setEditing(false)
            setTransferring(true)
          }}
        >
          Transfer Ownership
        </button>
      )}

      {transferring && (
        <form onSubmit={handleTransfer}>
          <h4>Transfer Project Ownership</h4>

          <p className="muted">
            After transferring this project, you will
            no longer be able to edit it from this wallet.
          </p>

          <label htmlFor={`new-owner-${id}`}>
            New Owner Address
          </label>

          <input
            id={`new-owner-${id}`}
            value={newOwner}
            onChange={(event) =>
              setNewOwner(event.target.value.trim())
            }
            placeholder="0x..."
            disabled={isTransferring}
            required
          />

          {newOwner && !isAddress(newOwner) && (
            <p role="alert">
              Enter a valid Ethereum wallet address.
            </p>
          )}

          {newOwner &&
            isAddress(newOwner) &&
            newOwner.toLowerCase() === owner.toLowerCase() && (
              <p role="alert">
                The new owner must be a different address.
              </p>
            )}

          <button
            type="submit"
            disabled={
              !canEdit ||
              !validNewOwner ||
              isTransferring
            }
          >
            {isAwaitingTransferWallet
              ? 'Confirm in MetaMask...'
              : isConfirmingTransfer
                ? 'Confirming transfer...'
                : 'Confirm Transfer'}
          </button>

          <button
            type="button"
            onClick={() => {
              setTransferring(false)
              setNewOwner('')
            }}
            disabled={isTransferring}
          >
            Cancel
          </button>
        </form>
      )}

{isAwaitingTransferWallet && (
  <p role="status">
    Please confirm the ownership transfer in MetaMask.
  </p>
)}

{isConfirmingTransfer && (
  <p role="status">
    Ownership transfer submitted. Waiting for Sepolia confirmation...
  </p>
)}

      {transferHash && (
        <p>
          <a
            href={`https://sepolia.etherscan.io/tx/${transferHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View ownership transfer transaction
          </a>
        </p>
      )}

      {isTransferConfirmed && (
        <p role="status">
          Ownership transferred successfully!
        </p>
      )}

      {transferWriteError && (
        <p role="alert">
          Transfer error: {transferWriteError.message}
        </p>
      )}

      {transferReceiptError && (
        <p role="alert">
          Confirmation error: {transferReceiptError.message}
        </p>
      )}


{isAwaitingWallet && (
  <p role="status">
    Please confirm the project update in MetaMask.
  </p>
)}

{isConfirming && (
  <p role="status">
    Transaction submitted. Waiting for Sepolia confirmation...
  </p>
)}

      {hash && (
        <p>
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View update transaction
          </a>
        </p>
      )}

      {isConfirmed && (
        <p role="status">Project updated successfully!</p>
      )}

      {writeError && (
        <p role="alert">
          Update error: {writeError.message}
        </p>
      )}

      {receiptError && (
        <p role="alert">
          Confirmation error: {receiptError.message}
        </p>
      )}
    </article>
  )
}
