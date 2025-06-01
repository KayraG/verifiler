import * as StellarSdk from "@stellar/stellar-sdk"
import { rpc as StellarRpc } from "@stellar/stellar-sdk"
import * as freighterApi from "@stellar/freighter-api"
import { sha256 } from "js-sha256"

// Contract configuration
export interface SorobanConfig {
    network: "testnet" | "mainnet"
    rpcUrl?: string
    networkPassphrase?: string
    contractAddress: string
}

// Types matching the Rust contract
export interface DocumentRecord {
    document_hash: string
    document_name: string
    registered_by: string
    timestamp: string
    block_number: number
}

export interface DocumentInfo {
    exists: boolean
    record?: DocumentRecord
}

export interface VerificationResult {
    isVerified: boolean
    registeredBy?: string
    registeredAt?: string
    documentName?: string
    blockNumber?: number
}

// Custom error classes
export class SorobanDocumentError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: any,
    ) {
        super(message)
        this.name = "SorobanDocumentError"
    }
}

export class ContractError extends SorobanDocumentError {
    constructor(message: string, details?: any) {
        super(message, "CONTRACT_ERROR", details)
    }
}

export class SorobanDocumentVerification {
    private server: StellarRpc.Server
    private networkPassphrase: string
    private contractAddress: string
    private config: SorobanConfig

    constructor(config: SorobanConfig) {
        this.config = config
        this.server = new StellarRpc.Server(this.getRpcUrl())
        this.networkPassphrase = this.getNetworkPassphrase()
        this.contractAddress = config.contractAddress
    }

    private getRpcUrl(): string {
        if (this.config.rpcUrl) return this.config.rpcUrl

        return this.config.network === "mainnet" ? "https://soroban-rpc.stellar.org" : "https://soroban-testnet.stellar.org"
    }

    private getNetworkPassphrase(): string {
        if (this.config.networkPassphrase) return this.config.networkPassphrase

        return this.config.network === "mainnet" ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET
    }

    // File hash calculation (same as before)
    async calculateFileHash(file: File, onProgress?: (progress: number) => void): Promise<string> {
        if (!file || !(file instanceof File)) {
            throw new Error("Invalid file provided")
        }

        if (file.size === 0) {
            throw new Error("File is empty")
        }

        const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB limit
        if (file.size > MAX_FILE_SIZE) {
            throw new Error("File too large (max 100MB)")
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            const chunkSize = 1024 * 1024 // 1MB chunks
            let offset = 0
            const hasher = sha256.create()

            const readNextChunk = () => {
                if (offset >= file.size) {
                    const hash = hasher.hex()
                    resolve(hash)
                    return
                }

                const chunk = file.slice(offset, offset + chunkSize)
                const chunkReader = new FileReader()

                chunkReader.onload = (event) => {
                    try {
                        if (!event.target?.result) {
                            throw new Error("Failed to read file chunk")
                        }

                        const buffer = event.target.result as ArrayBuffer
                        hasher.update(new Uint8Array(buffer))
                        offset += chunkSize

                        if (onProgress) {
                            const progress = Math.min((offset / file.size) * 100, 100)
                            onProgress(progress)
                        }

                        setTimeout(readNextChunk, 0)
                    } catch (error) {
                        reject(error)
                    }
                }

                chunkReader.onerror = () => reject(new Error("Failed to read file chunk"))
                chunkReader.readAsArrayBuffer(chunk)
            }

            readNextChunk()
        })
    }

    // Register document using smart contract
    async registerDocument(documentHash: string, documentName: string, publicKey?: string): Promise<string> {
        try {
            let userPublicKey = publicKey
            if (!userPublicKey) {
                const result = await freighterApi.getAddress()
                userPublicKey = result.address
            }

            // Load account
            const account = await this.server.getAccount(userPublicKey)

            // Create contract instance
            const contract = new StellarSdk.Contract(this.contractAddress)

            // Build transaction
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: this.networkPassphrase,
            })
                .addOperation(
                    contract.call(
                        "register_document",
                        StellarSdk.Address.fromString(userPublicKey),
                        StellarSdk.nativeToScVal(documentHash, { type: "string" }),
                        StellarSdk.nativeToScVal(documentName, { type: "string" }),
                    ),
                )
                .setTimeout(30)
                .build()

            // Simulate transaction first
            const simulated = await this.server.simulateTransaction(transaction)
            if (StellarSdk.SorobanRpc.Api.isSimulationError(simulated)) {
                throw new ContractError(`Simulation failed: ${simulated.error}`)
            }

            // Prepare transaction
            const prepared = StellarSdk.SorobanRpc.assembleTransaction(transaction, simulated)

            // Sign transaction
            const signedTransaction = await freighterApi.signTransaction(prepared.toXDR(), {
                networkPassphrase: this.networkPassphrase,
            })

            // Submit transaction
            const result = await this.server.sendTransaction(
                StellarSdk.TransactionBuilder.fromXDR(signedTransaction, this.networkPassphrase),
            )

            if (result.status === "ERROR") {
                throw new ContractError(`Transaction failed: ${result.errorResult}`)
            }

            return result.hash
        } catch (error: any) {
            if (error.message?.includes("Error(Contract, #3)")) {
                throw new ContractError("Document already exists")
            }
            if (error.message?.includes("Error(Contract, #1)")) {
                throw new ContractError("Invalid document hash format")
            }
            if (error.message?.includes("Error(Contract, #2)")) {
                throw new ContractError("Invalid document name")
            }
            throw error
        }
    }

    // Verify document using smart contract
    async verifyDocument(documentHash: string): Promise<VerificationResult> {
        try {
            // Create contract instance
            const contract = new StellarSdk.Contract(this.contractAddress)

            // Get any account for simulation (we don't need auth for read operations)
            const keypair = StellarSdk.Keypair.random()
            const account = new StellarSdk.Account(keypair.publicKey(), "0")

            // Build transaction for simulation
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: this.networkPassphrase,
            })
                .addOperation(contract.call("verify_document", StellarSdk.nativeToScVal(documentHash, { type: "string" })))
                .setTimeout(30)
                .build()

            // Simulate transaction
            const simulated = await this.server.simulateTransaction(transaction)
            if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
                throw new ContractError(`Verification failed: ${simulated.error}`)
            }

            // Parse result
            const result = simulated.result?.retval
            if (!result) {
                return { isVerified: false }
            }

            const documentInfo = StellarSdk.scValToNative(result) as DocumentInfo

            if (!documentInfo.exists || !documentInfo.record) {
                return { isVerified: false }
            }

            return {
                isVerified: true,
                registeredBy: documentInfo.record.registered_by,
                registeredAt: new Date(Number.parseInt(documentInfo.record.timestamp) * 1000).toISOString(),
                documentName: documentInfo.record.document_name,
                blockNumber: documentInfo.record.block_number,
            }
        } catch (error: any) {
            throw new ContractError(`Verification failed: ${error.message}`)
        }
    }

    // Get user's document history
    async getUserDocuments(publicKey: string): Promise<DocumentRecord[]> {
        try {
            // Create contract instance
            const contract = new StellarSdk.Contract(this.contractAddress)

            // Get any account for simulation
            const keypair = StellarSdk.Keypair.random()
            const account = new StellarSdk.Account(keypair.publicKey(), "0")

            // Build transaction for simulation
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: this.networkPassphrase,
            })
                .addOperation(contract.call("get_user_documents", StellarSdk.Address.fromString(publicKey)))
                .setTimeout(30)
                .build()

            // Simulate transaction
            const simulated = await this.server.simulateTransaction(transaction)
            if (StellarSdk.SorobanRpc.Api.isSimulationError(simulated)) {
                throw new ContractError(`Failed to get user documents: ${simulated.error}`)
            }

            // Parse result
            const result = simulated.result?.retval
            if (!result) {
                return []
            }

            const documents = StellarSdk.scValToNative(result) as DocumentRecord[]
            return documents.map((doc) => ({
                ...doc,
                timestamp: new Date(Number.parseInt(doc.timestamp) * 1000).toISOString(),
            }))
        } catch (error: any) {
            throw new ContractError(`Failed to get user documents: ${error.message}`)
        }
    }

}

// Convenience functions
export async function calculateFileHash(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const config: SorobanConfig = {
        network: "testnet",
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
    }
    const verifier = new SorobanDocumentVerification(config)
    return await verifier.calculateFileHash(file, onProgress)
}

export async function registerDocumentOnBlockchain(
    publicKey: string,
    documentHash: string,
    documentName: string,
): Promise<string> {
    const config: SorobanConfig = {
        network: "testnet",
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
    }
    const verifier = new SorobanDocumentVerification(config)
    return await verifier.registerDocument(documentHash, documentName, publicKey)
}

export async function verifyDocumentOnBlockchain(documentHash: string): Promise<VerificationResult> {
    const config: SorobanConfig = {
        network: "testnet",
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
    }
    const verifier = new SorobanDocumentVerification(config)
    return await verifier.verifyDocument(documentHash)
}

export async function getVerificationHistory(publicKey: string): Promise<DocumentRecord[]> {
    const config: SorobanConfig = {
        network: "testnet",
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
    }
    const verifier = new SorobanDocumentVerification(config)
    return await verifier.getUserDocuments(publicKey)
}

export default SorobanDocumentVerification
