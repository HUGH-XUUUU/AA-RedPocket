const { ethers } = require("hardhat");

let {
    generateZKProofRoot,
    generateZKProof,
    generateMerkleProofRoot,
    generateMerkleProof
} = require("../test/proof.js");

async function main() {
    let [owner] = await ethers.getSigners();
    const entrypoint = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789";
    const RedPacketFactory = await ethers.getContractFactory("RedPacket");
    const RedPacket = await RedPacketFactory.deploy(entrypoint, { gasLimit: 6000000 });
    await RedPacket.deployed();
    console.log("RedPacket deployed to:", RedPacket.address);

    console.log(await RedPacket.ENTRYPOINT());

    // // Attach to the existing RedPacket contract at the specified address
    // const redPacketAddress = "0xf293237ba4c1b329e719f73b24f256B5de2BB6C3";
    // const AttachedRedPacket = RedPacket.attach(redPacketAddress);

    // // Call the withdrawDepositNativeToken function
    // // Make sure you know the function signature and arguments if there are any
    // const withdrawTx = await AttachedRedPacket.withdrawDepositNativeToken(entrypoint, owner.address, ethers.utils.parseEther("2.5"));

    // // Wait for the transaction to be mined
    // await withdrawTx.wait();
    // console.log(`withdrawDepositNativeToken called on contract: ${redPacketAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });