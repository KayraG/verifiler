import * as StellarSdk from "@stellar/stellar-sdk";
import freighterApi from "@stellar/freighter-api";
import { sha256 } from "js-sha256";

// Types and Interfaces
export interface StellarConfig {
    network: 'testnet' | 'mainnet';
    horizonUrl?: string;
    networkPassphrase?: string;
    baseFee?: string;
}

export interface DocumentRecord {
    id: string;
    documentName: string;
    documentHash: string;
    timestamp: string;
    registeredBy: string;
    txHash: string;
    ledger: number;
}

export interface VerificationResult {
    isVerified: boolean;
    registeredBy?: string;
    registeredAt?: string;
    documentName?: string;
    txHash?: string;
    ledger?: number;
}

export interface PaginatedHistory {
    records: DocumentRecord[];
    hasMore: boolean;
    nextCursor?: string;
}

export interface WalletConnectionStatus {
    isAvailable: boolean;
    isConnected: boolean;
    publicKey?: string;
}

// Custom Error Classes
export class StellarDocumentError extends Error {
    constructor(message: string, public code: string, public details?: any) {
        super(message);
        this.name = 'StellarDocumentError';
    }
}

export class WalletError extends StellarDocumentError {
    constructor(message: string, details?: any) {
        super(message, 'WALLET_ERROR', details);
    }
}

export class NetworkError extends StellarDocumentError {
    constructor(message: string, details?: any) {
        super(message, 'NETWORK_ERROR', details);
    }
}

export class ValidationError extends StellarDocumentError {
    constructor(message: string, details?: any) {
        super(message, 'VALIDATION_ERROR', details);
    }
}

// Main Class
export class StellarDocumentVerification {
    private server: StellarSdk.Horizon.Server;
    private networkPassphrase: string;
    private baseFee: string;
    private config: StellarConfig;

    // Cache for frequently accessed data
    private accountCache = new Map<string, { account: StellarSdk.Account; timestamp: number }>();
    private readonly CACHE_TTL = 30000; // 30 seconds

    constructor(config: StellarConfig = { network: 'testnet' }) {
        this.config = this.validateAndNormalizeConfig(config);
        // Use Horizon Server for testnet/mainnet, not RPC
        this.server = new StellarSdk.Horizon.Server(this.getHorizonUrl());
        this.networkPassphrase = this.getNetworkPassphrase();
        this.baseFee = this.config.baseFee || StellarSdk.BASE_FEE;
    }

    // Configuration Management
    private validateAndNormalizeConfig(config: StellarConfig): StellarConfig {
        const normalized: StellarConfig = {
            network: config.network || 'testnet',
            horizonUrl: config.horizonUrl,
            networkPassphrase: config.networkPassphrase,
            baseFee: config.baseFee || StellarSdk.BASE_FEE,
        };

        if (!['testnet', 'mainnet'].includes(normalized.network)) {
            throw new ValidationError('Network must be either "testnet" or "mainnet"');
        }

        return normalized;
    }

    private getHorizonUrl(): string {
        if (this.config.horizonUrl) return this.config.horizonUrl;

        return this.config.network === 'mainnet'
            ? "https://horizon.stellar.org"
            : "https://horizon-testnet.stellar.org";
    }

    private getNetworkPassphrase(): string {
        if (this.config.networkPassphrase) return this.config.networkPassphrase;

        return this.config.network === 'mainnet'
            ? StellarSdk.Networks.PUBLIC
            : StellarSdk.Networks.TESTNET;
    }

    // Utility Methods
    private validatePublicKey(publicKey: string): void {
        if (!publicKey || typeof publicKey !== 'string') {
            throw new ValidationError('Public key is required and must be a string');
        }

        try {
            StellarSdk.Keypair.fromPublicKey(publicKey);
        } catch (error) {
            throw new ValidationError('Invalid Stellar public key format');
        }
    }

    private validateDocumentHash(hash: string): void {
        if (!hash || typeof hash !== 'string') {
            throw new ValidationError('Document hash is required and must be a string');
        }

        if (hash.length !== 64) {
            throw new ValidationError('Document hash must be a 64-character SHA-256 hash');
        }

        if (!/^[a-fA-F0-9]+$/.test(hash)) {
            throw new ValidationError('Document hash must be a valid hex string');
        }
    }

    private validateDocumentName(name: string): void {
        if (!name || typeof name !== 'string') {
            throw new ValidationError('Document name is required and must be a string');
        }

        // Stellar data entry name has limits
        const dataKeyName = `doc:${name}`;
        if (dataKeyName.length > 64) {
            throw new ValidationError('Document name too long (max 59 characters after "doc:" prefix)');
        }

        // Validate characters (basic validation)
        if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
            throw new ValidationError('Document name contains invalid characters (use only alphanumeric, dots, underscores, and hyphens)');
        }
    }

    // Account Management with Caching
    private async getAccount(publicKey: string): Promise<StellarSdk.Account> {
        const cacheKey = publicKey;
        const cached = this.accountCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.account;
        }

        try {
            const account = await this.server.loadAccount(publicKey);
            this.accountCache.set(cacheKey, { account, timestamp: Date.now() });
            return account;
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new NetworkError(`Account ${publicKey} not found. Make sure the account is funded.`);
            }
            throw new NetworkError(`Failed to load account: ${error.message}`, error);
        }
    }

    // File Hash Calculation with Progress
    async calculateFileHash(
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        if (!file || !(file instanceof File)) {
            throw new ValidationError('Invalid file provided');
        }

        if (file.size === 0) {
            throw new ValidationError('File is empty');
        }

        const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit
        if (file.size > MAX_FILE_SIZE) {
            throw new ValidationError('File too large (max 100MB)');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const chunkSize = 1024 * 1024; // 1MB chunks for progress tracking
            let offset = 0;
            const hasher = sha256.create();

            const readNextChunk = () => {
                if (offset >= file.size) {
                    const hash = hasher.hex();
                    resolve(hash);
                    return;
                }

                const chunk = file.slice(offset, offset + chunkSize);
                const chunkReader = new FileReader();

                chunkReader.onload = (event) => {
                    try {
                        if (!event.target?.result) {
                            throw new Error("Failed to read file chunk");
                        }

                        const buffer = event.target.result as ArrayBuffer;
                        hasher.update(new Uint8Array(buffer));
                        offset += chunkSize;

                        if (onProgress) {
                            const progress = Math.min((offset / file.size) * 100, 100);
                            onProgress(progress);
                        }

                        // Use setTimeout to prevent blocking the UI
                        setTimeout(readNextChunk, 0);
                    } catch (error) {
                        reject(new ValidationError(`Failed to process file: ${error}`));
                    }
                };

                chunkReader.onerror = () => {
                    reject(new ValidationError('Failed to read file chunk'));
                };

                chunkReader.readAsArrayBuffer(chunk);
            };

            readNextChunk();
        });
    }

    // Document Registration with Retry Logic
    async registerDocument(
        documentHash: string,
        documentName: string,
        publicKey?: string,
        retries: number = 2
    ): Promise<string> {
        this.validateDocumentHash(documentHash);
        this.validateDocumentName(documentName);

        let userPublicKey = publicKey;
        if (!userPublicKey) {
            userPublicKey = await connectWallet();
        }
        this.validatePublicKey(userPublicKey);

        let lastError: Error;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await this.performRegistration(userPublicKey, documentHash, documentName);
            } catch (error: any) {
                lastError = error;

                // Don't retry on validation or wallet errors
                if (error instanceof ValidationError || error instanceof WalletError) {
                    throw error;
                }

                // Don't retry on user rejection
                if (error.message?.includes('User declined') || error.message?.includes('rejected')) {
                    throw new WalletError('Transaction rejected by user');
                }

                if (attempt < retries) {
                    // Wait before retry with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));

                    // Clear account cache for retry
                    this.accountCache.delete(userPublicKey);
                }
            }
        }

        // @ts-ignore
        throw new NetworkError(`Failed to register document after ${retries + 1} attempts: ${lastError.message}`, lastError);
    }

    private async performRegistration(
        publicKey: string,
        documentHash: string,
        documentName: string
    ): Promise<string> {
        try {
            const account = await this.getAccount(publicKey);

            // Check if document already exists
            const existingDoc = await this.findDocumentByHash(documentHash, publicKey);
            if (existingDoc.isVerified) {
                throw new ValidationError(`Document "${documentName}" is already registered`);
            }

            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: this.baseFee,
                networkPassphrase: this.networkPassphrase,
            })
                .addOperation(
                    StellarSdk.Operation.manageData({
                        name: `doc:${documentName}`,
                        value: documentHash,
                    })
                )
                .setTimeout(60) // Increased timeout
                .build();


            const signedTransactionXDR = await freighterApi.signTransaction(
                transaction.toXDR(),
                { networkPassphrase: this.networkPassphrase }
            );

            const transactionEnvelope = StellarSdk.xdr.TransactionEnvelope.fromXDR(
                signedTransactionXDR.signedTxXdr,
                'base64'
            );

            const transactionResult = await this.server.submitTransaction(
                StellarSdk.TransactionBuilder.fromXDR(transactionEnvelope, this.networkPassphrase)
            );

            // Clear account cache after successful transaction
            this.accountCache.delete(publicKey);

            return transactionResult.hash;
        } catch (error: any) {
            if (error.response?.data?.extras?.result_codes?.operations?.includes('op_already_exists')) {
                throw new ValidationError('A document with this name already exists for this account');
            }
            throw error;
        }
    }

    // Optimized Document Verification
    async verifyDocument(documentHash: string): Promise<VerificationResult> {
        this.validateDocumentHash(documentHash);
        return await this.findDocumentByHash(documentHash);
    }

    private async findDocumentByHash(
        documentHash: string,
        specificAccount?: string
    ): Promise<VerificationResult> {
        try {
            if (specificAccount) {
                // More efficient: search within specific account
                return await this.searchInAccount(specificAccount, documentHash);
            }

            // Fallback: broader search (less efficient)
            return await this.broadSearch(documentHash);
        } catch (error: any) {
            throw new NetworkError(`Verification failed: ${error.message}`, error);
        }
    }

    private async searchInAccount(
        publicKey: string,
        documentHash: string
    ): Promise<VerificationResult> {
        try {
            const account = await this.getAccount(publicKey);

            // Check account data entries directly
            console.log(account)
            for (const [key, value] of Object.entries(account.data_attr || {})) {
                if (key.startsWith('doc:') && Buffer.from(value, 'base64').toString() === documentHash) {
                    // Get transaction details for this data entry
                    const history = await this.getVerificationHistory(publicKey, 100);
                    const documentName = key.replace('doc:', '');
                    const matchingRecord = history.records.find(record =>
                        record.documentHash === documentHash && record.documentName === documentName
                    );

                    if (matchingRecord) {
                        return {
                            isVerified: true,
                            registeredBy: matchingRecord.registeredBy,
                            registeredAt: matchingRecord.timestamp,
                            documentName: matchingRecord.documentName,
                            txHash: matchingRecord.txHash,
                            ledger: matchingRecord.ledger,
                        };
                    }

                    // Fallback if history search doesn't find it
                    return {
                        isVerified: true,
                        registeredBy: publicKey,
                        documentName: documentName,
                    };
                }
            }

            return { isVerified: false };
        } catch (error) {
            return { isVerified: false };
        }
    }

    private async broadSearch(documentHash: string): Promise<VerificationResult> {
        // This is less efficient and should be used sparingly
        // In production, consider maintaining an off-chain index
        try {
            const transactions = await this.server
                .transactions()
                .limit(200)
                .order("desc")
                .call();

            for (const tx of transactions.records) {
                try {
                    const operations = await tx.operations();

                    for (const op of operations.records) {
                        if (
                            op.type === "manage_data" &&
                            op.value.toString() === documentHash &&
                            op.name?.startsWith("doc:")
                        ) {
                            return {
                                isVerified: true,
                                registeredBy: tx.source_account,
                                registeredAt: tx.created_at,
                                documentName: op.name.replace("doc:", ""),
                                txHash: tx.hash,
                                ledger: tx.ledger_attr,
                            };
                        }
                    }
                } catch (opError) {
                    // Skip transactions that can't be processed
                    continue;
                }
            }

            return { isVerified: false };
        } catch (error: any) {
            throw new NetworkError(`Broad search failed: ${error.message}`, error);
        }
    }

    // Optimized History Retrieval with Pagination
    async getVerificationHistory(
        publicKey: string,
        limit: number = 20,
        cursor?: string
    ): Promise<PaginatedHistory> {
        this.validatePublicKey(publicKey);

        if (limit < 1 || limit > 200) {
            throw new ValidationError('Limit must be between 1 and 200');
        }

        try {
            let txQuery = this.server
                .transactions()
                .forAccount(publicKey)
                .limit(limit)
                .order("desc");

            if (cursor) {
                txQuery = txQuery.cursor(cursor);
            }

            const transactions = await txQuery.call();
            const records: DocumentRecord[] = [];

            for (const tx of transactions.records) {
                try {
                    const operations = await tx.operations();

                    for (const op of operations.records) {
                        if (op.type === "manage_data" && op.name?.startsWith("doc:")) {
                            records.push({
                                id: `${tx.hash}-${op.id}`,
                                documentName: op.name.replace("doc:", ""),
                                documentHash: op.value.toString() || '',
                                timestamp: tx.created_at,
                                registeredBy: tx.source_account,
                                txHash: tx.hash,
                                ledger: tx.ledger_attr,
                            });
                        }
                    }
                } catch (opError) {
                    // Skip transactions that can't be processed
                    continue;
                }
            }

            return {
                records,
                hasMore: transactions.records.length === limit,
                nextCursor: transactions.records.length > 0
                    ? transactions.records[transactions.records.length - 1].paging_token
                    : undefined,
            };
        } catch (error: any) {
            throw new NetworkError(`Failed to get verification history: ${error.message}`, error);
        }
    }
}

// Convenience functions for backward compatibility and ease of use
export async function calculateFileHash(
    file: File,
    onProgress?: (progress: number) => void
): Promise<string> {
    const verifier = new StellarDocumentVerification();
    return await verifier.calculateFileHash(file, onProgress);
}

export async function registerDocumentOnBlockchain(
    publicKey: string,
    documentHash: string,
    documentName: string,
    config?: StellarConfig
): Promise<string> {
    const verifier = new StellarDocumentVerification(config);
    return await verifier.registerDocument(documentHash, documentName, publicKey);
}

export async function verifyDocumentOnBlockchain(
    documentHash: string,
    config?: StellarConfig
): Promise<VerificationResult> {
    const verifier = new StellarDocumentVerification(config);
    return await verifier.verifyDocument(documentHash);
}

export async function getVerificationHistory(
    publicKey: string,
    limit?: number,
    cursor?: string,
    config?: StellarConfig
): Promise<PaginatedHistory> {
    const verifier = new StellarDocumentVerification(config);
    return await verifier.getVerificationHistory(publicKey, limit, cursor);
}

export async function connectWallet(): Promise<string> {
    const isAllowed = await freighterApi.isAllowed();

    if (!isAllowed) {
        throw new WalletError('Freighter wallet is not available. Please install Freighter extension.');
    }

    const publicKey = await freighterApi.getAddress();
    if (!publicKey) {
        throw new WalletError('Failed to get public key from wallet. Please connect your wallet first.');
    }

    return publicKey.address;
}

// Default export
export default StellarDocumentVerification;