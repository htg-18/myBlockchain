// Import the Node.js 'crypto' module for cryptographic operations
import * as crypto from 'crypto';

// *** Transaction Class ***
// Represents a transaction on the blockchain
class Transaction {
  // Constructor to create a transaction
  constructor(
    public amount: number, // Transaction amount
    public payer: string,  // Payer's public key
    public payee: string   // Payee's public key
  ) {}

  // Serialize the transaction as a string for hashing and verification
  toString() {
    return JSON.stringify(this);
  }
}

// *** Block Class ***
// Represents a block in the blockchain
class Block {
  // A random number used as a "nonce" for mining
  public numOnlyUsedOnce = Math.round(Math.random() * 999999999);

  // Constructor to create a block
  constructor(
    public prevHash: string,   // Hash of the previous block
    public transaction: Transaction, // Transaction included in the block
    public ts = Date.now()     // Timestamp of block creation
  ) {}

  // Getter method to calculate and return the hash of this block
  get hash() {
    const str = JSON.stringify(this); // Serialize the block data
    const hash = crypto.createHash('SHA256'); // Create a SHA256 hash object
    hash.update(str).end(); // Update the hash with the block data
    return hash.digest('hex'); // Get the hexadecimal hash value
  }
}

// *** Chain Class ***
// Represents the blockchain itself
class Chain {
  // Singleton instance to ensure only one chain exists
  public static instance = new Chain();

  // Array to store the blocks in the chain
  chain: Block[];

  // Constructor to create the initial chain with a genesis block
  constructor() {
    this.chain = [new Block('', new Transaction(100, 'genesis', 'godwin'))];
  }

  // Getter method to return the last block in the chain
  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Mine a block to confirm it on the blockchain
  mine(numOnlyUsedOnce: number) {
    let solution = 1;
    console.log(' Mining transaction...');

    // Loop until a valid solution is found (based on hash difficulty)
    while (true) {
      const hash = crypto.createHash('MD5'); // Create an MD5 hash object
      hash.update((numOnlyUsedOnce + solution).toString()).end(); // Update with nonce + solution

      const attempt = hash.digest('hex'); // Get the hexadecimal hash value

      // Check if the hash meets the difficulty requirement (4 leading zeros)
      if (attempt.substr(0, 4) === '0000') {
        console.log(`---> Solved transaction with solution: ${solution}. Block is confirmed!\n`);
        return solution;
      }

      solution += 1; // Increment the solution attempt
    }
  }

  // Add a block to the blockchain after verification
  addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
    console.log(" Sending TurtleCoin...");

    // Verify the transaction's authenticity using the sender's public key and signature
    const verifier = crypto.createVerify('SHA256'); // Create a SHA256 verification object
    verifier.update(transaction.toString()); // Update with transaction data

    const isValid = verifier.verify(senderPublicKey, signature); // Verify signature

    // If the transaction is valid, create a new block, mine it, and add it to the chain
    if (isValid) {
      console.log(" Transaction is valid!");
      const newBlock = new Block(this.lastBlock.hash, transaction); // Create the new block
      this.mine(newBlock.numOnlyUsedOnce); // Mine the block
      this.chain.push(newBlock); // Add the block to the chain
    }
  }
}

// *** Wallet Class ***
// Represents a user's wallet for storing and managing keys
class Wallet {
  public publicKey: string;
  public privateKey: string;

  // Constructor to create a new wallet and generate an RSA key pair
  constructor() {
    const keypair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048, // Key length
      publicKeyEncoding: { type: 'spki', format: 'pem' }, // Public key encoding
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, // Private key encoding
    });

    this.privateKey = keypair.privateKey; // Store the private key
    this.publicKey = keypair.publicKey; // Store the public key
  }

  // Send money from the user's wallet to another wallet
  sendMoney(amount: number, payeePublicKey: string) {
    const transaction = new Transaction(amount, this.publicKey, payeePublicKey); // Create a transaction

    // Sign the transaction using the user's private key
    const sign = crypto.createSign('SHA256'); // Create a SHA256 signing object
    sign.update(transaction.toString()).end(); // Update with transaction data
    const signature = sign.sign(this.privateKey); // Generate the signature

    Chain.instance.addBlock(transaction, this.publicKey, signature); // Add the block to the blockchain
  }
}

// Create three wallets for demonstration
const agp = new Wallet();
const jz = new Wallet();
const jb = new Wallet();

// Simulate transactions between the wallets
agp.sendMoney(50, jz.publicKey);
jz.sendMoney(23, jb.publicKey);
jb.sendMoney(5, jz.publicKey);

// Print the blockchain instance to view the transactions and blocks
console.log(Chain.instance);
