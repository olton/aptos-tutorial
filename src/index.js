import {Account} from "./components/account";
import {RestClient} from "./components/rest-client"
import {FaucetClient} from "./components/faucet-client"
import {FAUCET_URL, TESTNET_URL} from "./helpers/contsts"

async function main() {
    const restClient = new RestClient(TESTNET_URL);
    const faucetClient = new FaucetClient(FAUCET_URL, restClient);

    // Create two accounts, Alice and Bob, and fund Alice but not Bob
    const alice = new Account()
    const alice2 = new Account("fa2a1f23faa79711d6447cfece1484455d10d5cb7d0a7d00066a567d868a0a54")
    const bob = new Account()

    console.log("\n=== Addresses ===")
    console.log(`Alice: ${alice.address()}. Key Seed: ${alice.seed()}`)
    console.log(`Bob: ${bob.address()}. Key Seed: ${bob.seed()}`)

    await faucetClient.fundAccount(alice.authKey(), 5_000)
    await faucetClient.fundAccount(alice2.authKey(), 2_000)
    await faucetClient.fundAccount(bob.authKey(), 0)

    console.log("\n=== Initial Balances ===")
    console.log(`Alice: ${await restClient.accountBalance(alice.address())}`)
    console.log(`Alice2: ${await restClient.accountBalance(alice2.address())}`)
    console.log(`Bob: ${await restClient.accountBalance(bob.address())}`)

    console.log("\n=== Alice give Bob 1000 coins ===");
    const txHash = await restClient.transfer(alice, bob.address(), 1000)
    await restClient.waitForTransaction(txHash)

    console.log("\n=== Final Balances ===");
    console.log(`Alice: ${await restClient.accountBalance(alice.address())}`)
    console.log(`Alice2: ${await restClient.accountBalance(alice2.address())}`)
    console.log(`Bob: ${await restClient.accountBalance(bob.address())}`)
}

await main()