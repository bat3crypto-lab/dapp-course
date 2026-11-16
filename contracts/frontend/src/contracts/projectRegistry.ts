
import abiJson from './ProjectRegistryABI.json'
import type { Abi } from 'viem'
import { getAddress } from 'viem'

const configuredAddress = import.meta.env.VITE_PROJECT_REGISTRY_ADDRESS

if (!configuredAddress) {
  throw new Error(
    'Missing VITE_PROJECT_REGISTRY_ADDRESS environment variable'
  )
}

export const projectRegistryAddress = getAddress(configuredAddress)

const abiData: unknown = abiJson

export const projectRegistryAbi = (
  Array.isArray(abiData)
    ? abiData
    : (abiData as { abi: Abi }).abi
) as Abi
