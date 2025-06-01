#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, String, Symbol,
    Vec, contracterror,
};

// Contract data types
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DocumentRecord {
    pub document_hash: String,
    pub document_name: String,
    pub registered_by: Address,
    pub timestamp: u64,
    pub block_number: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DocumentInfo {
    pub exists: bool,
    pub record: Option<DocumentRecord>,
}

// Contract events
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DocumentRegisteredEvent {
    pub document_hash: String,
    pub document_name: String,
    pub registered_by: Address,
    pub timestamp: u64,
}

// Contract errors
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    InvalidHashLength = 1,
    InvalidDocumentName = 2,
    DocumentAlreadyExists = 3,
}

// Storage keys
const DOCUMENTS: Symbol = symbol_short!("DOCS");
const DOC_COUNT: Symbol = symbol_short!("COUNT");
const USER_DOCS: Symbol = symbol_short!("USERDOCS");

#[contract]
pub struct DocumentVerificationContract;

#[contractimpl]
impl DocumentVerificationContract {
    /// Initialize the contract
    pub fn initialize(env: Env) {
        // Set initial document count to 0
        env.storage().instance().set(&DOC_COUNT, &0u64);
    }

    /// Register a new document
    pub fn register_document(
        env: Env,
        caller: Address,
        document_hash: String,
        document_name: String,
    ) -> Result<u64, ContractError> {
        // Require caller authorization
        caller.require_auth();

        // Validate inputs
        if document_hash.len() != 64 {
            return Err(ContractError::InvalidHashLength);
        }

        if document_name.len() == 0 || document_name.len() > 64 {
            return Err(ContractError::InvalidDocumentName);
        }

        // Check if document already exists
        let documents: Map<String, DocumentRecord> = env
            .storage()
            .persistent()
            .get(&DOCUMENTS)
            .unwrap_or(Map::new(&env));

        if documents.contains_key(document_hash.clone()) {
            return Err(ContractError::DocumentAlreadyExists);
        }

        // Get current timestamp and block number
        let timestamp = env.ledger().timestamp();
        let block_number = env.ledger().sequence();

        // Create document record
        let record = DocumentRecord {
            document_hash: document_hash.clone(),
            document_name: document_name.clone(),
            registered_by: caller.clone(),
            timestamp,
            block_number,
        };

        // Store document
        let mut updated_documents = documents;
        updated_documents.set(document_hash.clone(), record.clone());
        env.storage()
            .persistent()
            .set(&DOCUMENTS, &updated_documents);

        // Update user's document list
        let user_docs_key = (USER_DOCS, caller.clone());
        let mut user_docs: Vec<String> = env
            .storage()
            .persistent()
            .get(&user_docs_key)
            .unwrap_or(Vec::new(&env));
        user_docs.push_back(document_hash.clone());
        env.storage().persistent().set(&user_docs_key, &user_docs);

        // Increment document count
        let count: u64 = env
            .storage()
            .instance()
            .get(&DOC_COUNT)
            .unwrap_or(0);
        env.storage().instance().set(&DOC_COUNT, &(count + 1));

        // Emit event
        env.events().publish(
            (symbol_short!("DOC_REG"),),
            DocumentRegisteredEvent {
                document_hash: document_hash.clone(),
                document_name,
                registered_by: caller,
                timestamp,
            },
        );

        Ok(count + 1)
    }

    /// Verify if a document exists
    pub fn verify_document(env: Env, document_hash: String) -> DocumentInfo {
        let documents: Map<String, DocumentRecord> = env
            .storage()
            .persistent()
            .get(&DOCUMENTS)
            .unwrap_or(Map::new(&env));

        match documents.get(document_hash) {
            Some(record) => DocumentInfo {
                exists: true,
                record: Some(record),
            },
            None => DocumentInfo {
                exists: false,
                record: None,
            },
        }
    }

    /// Get all documents registered by a user
    pub fn get_user_documents(env: Env, user: Address) -> Vec<DocumentRecord> {
        let user_docs_key = (USER_DOCS, user);
        let user_doc_hashes: Vec<String> = env
            .storage()
            .persistent()
            .get(&user_docs_key)
            .unwrap_or(Vec::new(&env));

        let documents: Map<String, DocumentRecord> = env
            .storage()
            .persistent()
            .get(&DOCUMENTS)
            .unwrap_or(Map::new(&env));

        let mut result = Vec::new(&env);
        for hash in user_doc_hashes.iter() {
            if let Some(record) = documents.get(hash) {
                result.push_back(record);
            }
        }

        result
    }

    /// Get total number of registered documents
    pub fn get_document_count(env: Env) -> u64 {
        env.storage().instance().get(&DOC_COUNT).unwrap_or(0)
    }

    /// Check if a document name is already used by a user
    pub fn is_document_name_used(env: Env, user: Address, document_name: String) -> bool {
        let user_docs = Self::get_user_documents(env, user);

        for doc in user_docs.iter() {
            if doc.document_name == document_name {
                return true;
            }
        }

        false
    }

    /// Get document by name for a specific user
    pub fn get_document_by_name(env: Env, user: Address, document_name: String) -> DocumentInfo {
        let user_docs = Self::get_user_documents(env, user);

        for doc in user_docs.iter() {
            if doc.document_name == document_name {
                return DocumentInfo {
                    exists: true,
                    record: Some(doc),
                };
            }
        }

        DocumentInfo {
            exists: false,
            record: None,
        }
    }
}
