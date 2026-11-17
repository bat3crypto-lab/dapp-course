# Project Registry dApp

A full-stack decentralized application for registering, managing, and transferring ownership of projects on the Ethereum Sepolia testnet.

Built using **Solidity, Foundry, React, TypeScript, Wagmi, Viem, and MetaMask**.

## Live Demo

- **Live dApp:** https://dapp-course.vercel.app/
- **GitHub:** https://github.com/bat3crypto-lab/dapp-course
- **Smart Contract:** https://sepolia.etherscan.io/address/0x0390044B74c9441DB4D1D802cE504E41F4baDa34

## Features

- Connect an Ethereum wallet using MetaMask.
- Register projects with a name and description.
- View registered projects and their owners.
- Edit project details if you own the project.
- Transfer project ownership to another wallet.
- Enforce ownership permissions through the smart contract.
- View project data stored on the Sepolia blockchain.

## Technology Stack

| Layer | Technologies |
|---|---|
| Smart contracts | Solidity |
| Contract development and testing | Foundry |
| Blockchain network | Ethereum Sepolia |
| Frontend | React, TypeScript, Vite |
| Blockchain integration | Wagmi, Viem |
| Wallet | MetaMask |
| Hosting | Vercel |
| Source control | Git, GitHub |

## Repository Structure

```text
dapp-course/
├── contracts/
│   ├── src/
│   ├── test/
│   ├── script/
│   ├── foundry.toml
│   └── frontend/
│       ├── src/
│       └── package.json
├── PROJECT_SPEC.md
└── README.md
```

## Run Locally

### Prerequisites

Install Node.js, npm, Foundry, and a browser wallet such as MetaMask.

### 1. Clone the repository

```bash
git clone https://github.com/bat3crypto-lab/dapp-course.git
cd dapp-course
```

### 2. Install the Foundry dependency

```bash
cd contracts
forge install foundry-rs/forge-std --no-git
```

### 3. Run the smart contract tests

```bash
forge test
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

### 5. Configure the contract address

Create a `.env.local` file inside `contracts/frontend`:

```env
VITE_PROJECT_REGISTRY_ADDRESS=0x0390044B74c9441DB4D1D802cE504E41F4baDa34
```

This is a public smart contract address, not a private key.

### 6. Start the frontend

```bash
npm run dev
```

Open the local URL displayed by Vite and connect MetaMask to the Sepolia testnet.

## Testing

The smart contract includes automated Foundry tests covering project registration, updates, ownership transfers, validation, and access control.

The deployed frontend has also been manually tested on Sepolia for all four core operations.

## Security Notes

- Only the project owner can edit project details or transfer ownership.
- Ownership restrictions are enforced by the smart contract.
- Private keys, seed phrases, and wallet credentials should never be committed to this repository.
- This project is an educational demonstration and has not undergone a professional security audit.

## Project Status

**Deployed and tested on Ethereum Sepolia.**

Built as a hands-on full-stack Web3 development project.