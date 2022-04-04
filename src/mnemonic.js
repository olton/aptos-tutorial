import bip39 from "bip39"

const mnemonic = bip39.generateMnemonic()
const mnemonic2 = bip39.entropyToMnemonic("3493f167dd94b86a2c79994bfacd6dbc1b67e06864c31cae58ae68e83d9cf51c")
console.log(mnemonic)
console.log(mnemonic2)
console.log(bip39.mnemonicToEntropy(mnemonic2))