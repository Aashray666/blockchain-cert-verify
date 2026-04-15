# 🔗 Secure Digital Certificate Verification Using Blockchain

A decentralized application (DApp) that leverages Ethereum smart contracts to issue and verify digital certificates. Certificates are hashed and stored on-chain, making them tamper-proof and independently verifiable without relying on a central authority.

---

## 📌 Problem Statement

Traditional certificate verification relies on centralized databases that are vulnerable to tampering, forgery, and single points of failure. There is no easy way for a third party (employer, university, etc.) to independently verify the authenticity of a certificate without contacting the issuing institution.

## 💡 Solution

This project stores a **SHA-256 hash** of each certificate PDF on the Ethereum blockchain. Since blockchain records are immutable, any modification to the original certificate will produce a different hash — instantly exposing forgery. Anyone with the original PDF can verify its authenticity on-chain without needing permission from the issuer.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React)               │
│                                                   │
│  ┌──────────────┐       ┌──────────────────────┐ │
│  │  Issue Form   │       │  Blockchain Explorer  │ │
│  │  Verify Form  │       │  (Live Block Feed)    │ │
│  └──────┬───────┘       └──────────┬───────────┘ │
│         │                          │               │
│         └──────────┬───────────────┘               │
│                    │ ethers.js                      │
└────────────────────┼───────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         Ethereum Blockchain (Hardhat Local)       │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │         Certificate.sol (Smart Contract)     │ │
│  │                                               │ │
│  │  issueCertificate(hash, name, course, date)  │ │
│  │  verifyCertificate(hash) → details           │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**No backend server. No database.** The frontend communicates directly with the smart contract on the blockchain.

---

## 🔧 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Blockchain | Ethereum (Hardhat local network) | Immutable certificate storage |
| Smart Contract | Solidity ^0.8.19 | On-chain logic for issuing & verifying |
| Frontend | React 18 (Vite) | User interface |
| Web3 Library | ethers.js v6 | Blockchain interaction from browser |
| Dev Tooling | Hardhat | Compilation, deployment, local chain |

---

## 📂 Project Structure

```
├── contract/
│   └── Certificate.sol        # Solidity smart contract
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Entire UI (single file)
│   │   └── main.jsx           # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── deploy.js                  # Contract deployment script
├── hardhat.config.js          # Hardhat configuration
├── package.json
└── README.md
```

---

## ⚙️ How It Works

### Issuing a Certificate

1. Admin uploads a certificate PDF through the web interface
2. The browser computes a **SHA-256 hash** of the file
3. The hash along with metadata (recipient name, course, date) is sent to the smart contract
4. The smart contract stores the hash → metadata mapping on the blockchain
5. A transaction is mined and the certificate is permanently recorded

### Verifying a Certificate

1. Anyone uploads a certificate PDF through the web interface
2. The browser computes the SHA-256 hash of the uploaded file
3. The hash is looked up on the smart contract
4. If found → certificate is **valid** (displays stored metadata)
5. If not found → certificate is **invalid** or was never issued

### Why This Is Secure

- **Immutability**: Once stored on the blockchain, records cannot be altered or deleted
- **Tamper Detection**: Even a 1-byte change in the PDF produces a completely different hash
- **Decentralized Verification**: No need to contact the issuer — anyone can verify independently
- **Transparency**: All transactions are visible on the blockchain explorer

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/blockchain-cert-verify.git
   cd blockchain-cert-verify
   ```

2. **Install root dependencies** (Hardhat & Solidity tooling)
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running the Project

You need **three terminal windows**:

**Terminal 1 — Start the local blockchain**
```bash
npx hardhat node
```
This starts a local Ethereum network at `http://127.0.0.1:8545` with pre-funded test accounts.

**Terminal 2 — Deploy the smart contract**
```bash
npx hardhat run deploy.js --network localhost
```
Note the deployed contract address printed in the console. If it differs from the one in `frontend/src/App.jsx`, update the `CONTRACT_ADDRESS` variable.

**Terminal 3 — Start the frontend**
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🖥️ Features

- **Issue Certificate** — Upload a PDF and record its hash on the blockchain with recipient details
- **Verify Certificate** — Upload any PDF to check if it was issued and is authentic
- **Live Blockchain Explorer** — Side panel showing real-time network info, recent blocks, transaction hashes, and gas usage
- **Transaction Log** — Detailed log of every blockchain interaction (hashes, block numbers, gas used)

---

## 📸 Screenshots

<img width="2504" height="1333" alt="image" src="https://github.com/user-attachments/assets/d489d782-1957-4fc1-b471-3f2eb154f080" />

<img width="2501" height="1329" alt="image" src="https://github.com/user-attachments/assets/83ed8ac4-ab35-4fe0-82ed-1a5f054b1b1a" />

---

## 📜 Smart Contract

The entire on-chain logic lives in a single contract (`Certificate.sol`):

```solidity
function issueCertificate(bytes32 _hash, string _recipientName, string _course, string _date)
```
- Only the contract owner (deployer) can issue certificates
- Prevents duplicate entries for the same hash

```solidity
function verifyCertificate(bytes32 _hash) returns (bool exists, string recipientName, string course, string date)
```
- Public function — anyone can call it
- Returns certificate metadata if the hash exists on-chain

---

## ⚠️ Limitations

This is a **college project** built for demonstration purposes:

- Runs on a local Hardhat network (not deployed to a public testnet/mainnet)
- Uses a hardcoded private key (Hardhat's default test account)
- No user authentication or role-based access control
- No IPFS integration for storing actual certificate files
- Not optimized for gas efficiency or scalability

---

## 🛠️ Built With

- [Hardhat](https://hardhat.org/) — Ethereum development environment
- [Solidity](https://soliditylang.org/) — Smart contract language
- [ethers.js](https://docs.ethers.org/v6/) — Ethereum library for JavaScript
- [React](https://react.dev/) — Frontend UI library
- [Vite](https://vitejs.dev/) — Frontend build tool

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
