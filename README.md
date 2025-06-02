# 📦 Verifiler - Document Verification DApp

This project is a document verification dApp built using **Stellar and Soroban**. It offers a simple, modern and powerful solution for immutable document verification on the blockchain.

## 🚀 Features

- **Next.js** based modern frontend
- **Rust / Soroban** smart contracts
- 🔑 **Freighter wallet** integration
- ⚡ Document registration and verification
- 📄 Real-time document hash calculation
- 🔍 Smart contract-based verification history
- 🎨 Elegant and intuitive user interface (with Tailwind CSS)
- 🔒 Immutable blockchain storage
- 📊 Progress tracking for file processing


## 📂 Project Structure

```shellscript
/contracts/document-verification # Rust/Soroban smart contract

/verifiler-frontend:
/app # Next.js application
/components # React components
/lib # Utility functions and blockchain integration
/tailwind.config.ts # Tailwind configuration

/README.md # This document!
```

## 🛠️ Installation

1️⃣ **Clone the repo:**

```shellscript
git clone https://github.com/KayraG/verifiler.git
cd blockverify
```

2️⃣ **Install dependencies:**

```shellscript
cd verifiler-frontend
npm install
```

3️⃣ **Set up environment variables:**

```shellscript
cp .env.example .env.local
# Add your contract address to NEXT_PUBLIC_CONTRACT_ADDRESS
```

4️⃣ **Start the development server:**

```shellscript
npm run dev
```

5️⃣ **To build the smart contract:**

```shellscript
cd contracts/document-verification
cargo build --target wasm32-unknown-unknown --release
```

## 🔧 Smart Contract Deployment

1️⃣ **Install Stellar CLI:**

```shellscript
# Follow instructions at https://developers.stellar.org/docs/tools/developer-tools
```

2️⃣ **Deploy the contract:**

```shellscript
cd contracts/document-verification
stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/document_verification.wasm \
    --source-account YOUR_ACCOUNT \
    --network testnet
```

3️⃣ **Initialize the contract:**

```shellscript
stellar contract invoke \
    --id CONTRACT_ID \
    --source-account YOUR_ACCOUNT \
    --network testnet \
    -- initialize
```

## ⚙️ Usage

### Document Registration

- Connect your Freighter wallet on the main page
- Upload a document (PDF, DOC, DOCX, JPG, PNG up to 100MB)
- Enter a unique document name
- Click "Register Document" to store the hash on the blockchain


### Document Verification

- Upload the document you want to verify
- The system calculates the file hash and checks it against the blockchain
- Get instant verification results with registration details


### View History

- See all documents you've registered through the smart contract
- Search and sort your document history
- View detailed information including block numbers and timestamps


## 🔐 Security Features

- **Immutable Storage**: Documents hashes are stored in Soroban smart contracts
- **Cryptographic Hashing**: SHA-256 hashing ensures document integrity
- **Blockchain Verification**: Tamper-proof verification through Stellar blockchain
- **Wallet Authentication**: Secure wallet-based authentication with Freighter


## 🧪 Testing

Run the smart contract tests:

```shellscript
cd contracts/document-verification
cargo test
```

Run the frontend tests:

```shellscript
npm test
```

## 🌐 Environment Variables

```shellscript
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
```

## 📄 License

This project is licensed under the [MIT License](LICENSE).


---

🔗 **Links:**

- 🌐 [Stellar Developer Docs](https://developers.stellar.org/docs/)
- 🔧 [Soroban Documentation](https://soroban.stellar.org/docs)
- 💼 [Freighter Wallet](https://freighter.app/)
- 📚 [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)


---

## 🚨 Prerequisites

- Node.js 18+
- Rust and Cargo
- Stellar CLI
- Freighter Wallet browser extension


**Note:** Make sure to complete the Soroban smart contract compilation and deployment before running the project!

## 🎯 Roadmap

- Multi-file batch registration
- Document categories and tags
- Advanced search and filtering
- Document expiration dates
- Integration with IPFS for file storage
- Mobile app development
- Enterprise API endpoints


---

**Built with ❤️ using Stellar, Soroban, and Next.js**