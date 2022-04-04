import fetch from "node-fetch"
import assert from "assert"
import Nacl from "tweetnacl"

const {sign} = Nacl

export class RestClient {
    url = ""

    constructor(url = "") {
        this.url = url
    }

    async account(accountAddress = ""){
        const response = await fetch(`${this.url}/accounts/${accountAddress}`, {method: "GET"})
        if (response.status !== 200) {
            assert(response.status === 200, await response.text())
        }
        return await response.json()
    }

    async accountResources(accountAddress = ""){
        const response = await fetch(`${this.url}/accounts/${accountAddress}/resources`, {method: "GET"})
        if (response.status !== 200) {
            assert(response.status === 200, await response.text())
        }
        return await response.json()
    }

    async generateTransaction(sender = "", payload = {}){
        const account = await this.account(sender)
        const seqNum = parseInt(account["sequence_number"])
        return {
            "sender": `0x${sender}`,
            "sequence_number": seqNum.toString(),
            "max_gas_amount": "1000",
            "gas_unit_price": "1",
            "gas_currency_code": "XUS",
            // Unix timestamp, in seconds + 10 minutes ???
            "expiration_timestamp_secs": (Math.floor(Date.now() / 1000) + 600).toString(),
            "payload": payload,
        }
    }

    async signTransaction(accountFrom, txnRequest = {}){
        const response = await fetch(`${this.url}/transactions/signing_message`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(txnRequest)
        })
        if (response.status !== 200) {
            assert(response.status === 200, (await response.text()) + " - " + JSON.stringify(txnRequest))
        }
        const result = await response.json()
        const toSign = Buffer.from(result["message"].substring(2), "hex")
        const signature = sign(toSign, accountFrom.signingKey.secretKey)
        const signatureHex = Buffer.from(signature).toString("hex").slice(0, 128)
        txnRequest["signature"] = {
            "type": "ed25519_signature",
            "public_key": `0x${accountFrom.pubKey()}`,
            "signature": `0x${signatureHex}`,
        }
        return txnRequest
    }


    async submitTransaction(account, txnRequest = {}){
        const response = await fetch(`${this.url}/transactions`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(txnRequest)
        })
        if (response.status !== 202) {
            assert(response.status === 202, (await response.text()) + " - " + JSON.stringify(txnRequest))
        }
        return await response.json()
    }

    async transactionPending(txnHash){
        const response = await fetch(`${this.url}/transactions/${txnHash}`, {method: "GET"})
        if (response.status === 404) {
            return true
        }
        if (response.status !== 200) {
            assert(response.status === 200, await response.text())
        }
        return (await response.json())["type"] === "pending_transaction"
    }

    async waitForTransaction(txnHash) {
        let count = 0
        while (await this.transactionPending(txnHash)) {
            assert(count < 10)
            await new Promise(resolve => setTimeout(resolve, 1000))
            count += 1
            if (count >= 10) {
                throw new Error(`Waiting for transaction ${txnHash} timed out!`)
            }
        }
    }

    async accountBalance(accountAddress) {
        const resources = await this.accountResources(accountAddress)
        for (const key in resources) {
            const resource = resources[key]
            if (resource["type"] === "0x1::TestCoin::Balance") {
                return parseInt(resource["data"]["coin"]["value"])
            }
        }
        return null
    }

    async transfer(accountFrom = "", recipient = "", amount = 0){
        const payload = {
            type: "script_function_payload",
            function: "0x1::TestCoin::transfer",
            type_arguments: [],
            arguments: [
                `0x${recipient}`,
                amount.toString(),
            ]
        };
        const txnRequest = await this.generateTransaction(accountFrom.address(), payload)
        const signedTxn = await this.signTransaction(accountFrom, txnRequest)
        const res = await this.submitTransaction(accountFrom, signedTxn)
        return res["hash"].toString()
    }
}