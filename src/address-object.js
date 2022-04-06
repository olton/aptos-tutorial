import {Account} from "./components/account";
import {RestClient} from "./components/rest-client"
import {TESTNET_URL} from "./helpers/contsts"

async function main() {
    const restClient = new RestClient(TESTNET_URL);

    const alice = new Account("fa2a1f23faa79711d6447cfece1484455d10d5cb7d0a7d00066a567d868a0a54")
    const address = await restClient.accountResources(alice.address())

    console.log(JSON.stringify(address, null, 4))
}

await main()