const { ethers } = require("hardhat");
const snarkjs = require("snarkjs");

function hashString(str) {
    let arr = new TextEncoder().encode(str);
    return ethers.utils.keccak256(arr);
}

async function prove(addrBN, secretBN) {
    return await snarkjs.groth16.fullProve(
        {
            addr: addrBN.toString(),
            secret: secretBN.toString()
        },
        "circuits/passcode.wasm", "circuits/passcode_0001.zkey"
    );
}

async function generateZKProofRoot(password) {
    let
        passcode = hashString(password);
    passcodeBN = ethers.BigNumber.from(passcode);

    let { proof, publicSignals } = await prove(ethers.BigNumber.from(0), passcodeBN);

    // get out from public signals:
    let passcodeHashBN = ethers.BigNumber.from(publicSignals[0]);
    return passcodeHashBN;
}

async function generateZKProof(Verifier, password, receiver) {

    let
        passcode = hashString(password);
    passcodeBN = ethers.BigNumber.from(passcode);

    let
        accountBN = ethers.BigNumber.from(receiver),
        secretBN = passcodeBN.sub(accountBN); // passcode = address + secret

    // generate proof:
    let { proof, publicSignals } = await prove(accountBN, secretBN);
    let passcodeHashBN = ethers.BigNumber.from(publicSignals[0]);


    let proofs = [
        proof.pi_a[0], proof.pi_a[1],
        // NOTE: the order of proof.pi_b is differ to pi_a and pi_c:
        proof.pi_b[0][1], proof.pi_b[0][0], proof.pi_b[1][1], proof.pi_b[1][0],
        proof.pi_c[0], proof.pi_c[1]
    ];
    // convert '12345678' to '0xbc614e':
    for (let i = 0; i < proofs.length; i++) {
        // string -> hex string:
        proofs[i] = ethers.BigNumber.from(proofs[i]).toHexString();
    }

    // Optional: call verifyProof() to validate the proof:
    let r = await Verifier.verifyProof(
        [proofs[0], proofs[1]], // a[2]
        [[proofs[2], proofs[3]], [proofs[4], proofs[5]]], // b[2][2]
        [proofs[6], proofs[7]], // c[2]
        [passcodeHashBN.toHexString(), accountBN.toHexString()] // i[2]
    );

    if (!r) {
        console.log('bad proof');
        return;
    }

    return proofs
}


const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");
async function generateMerkleProofRoot(Verifier, creator, addresses) {

    const merkleNonce = await Verifier.merkleNonce(creator);


    const values = addresses.map(address => [address, merkleNonce]);

    const tree = StandardMerkleTree.of(values, ["address", "uint256"]);

    const rootHashUint256 = ethers.BigNumber.from(tree.root);
    return rootHashUint256;
}

async function generateMerkleProof(Verifier, redPacketId, addressToProve, addresses) {


    const redPocketInfor = await Verifier.getRedPacket(redPacketId);

    const nonce = redPocketInfor["merkleNonce"]

    const values = addresses.map(address => [address, nonce]);

    const tree = StandardMerkleTree.of(values, ["address", "uint256"]);

    for (const [i, v] of tree.entries()) {
        if (v[0] === addressToProve) {
            return tree.getProof(i);
        }
    }
}







module.exports = {
    generateZKProofRoot,
    generateZKProof,
    generateMerkleProofRoot,
    generateMerkleProof
};