let { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
let { expect } = require("chai");
let {
    generateZKProofRoot,
    generateZKProof,
    generateMerkleProofRoot,
    generateMerkleProof
} = require("./proof.js");


describe("RedPacket", function () {
    async function deploy() {
        let [owner, Alice, Bob] = await ethers.getSigners();

        let RedPacketFactory = await ethers.getContractFactory(
            "RedPacket"
        );

        const RedPacket = await RedPacketFactory.deploy(owner.address);

        let MockTokenFactory = await ethers.getContractFactory(
            "MockToken"
        );

        let MockToken = await MockTokenFactory.deploy(
        );

        await MockToken.mint(owner.address, ethers.utils.parseEther("1.0"));

        await MockToken.connect(owner).approve(RedPacket.address, ethers.utils.parseEther("1.0"));

        let BonusType = {
            AVERAGE: 0,
            RANDOM: 1
        };

        let ProofType = {
            ZK: 0,
            MERKLE: 1
        }

        return {
            owner,
            Alice,
            Bob,
            RedPacket,
            MockToken,
            BonusType,
            ProofType
        };
    }

    it("zk", async function () {
        let { owner, Alice, RedPacket, MockToken, BonusType, ProofType } = await loadFixture(deploy);

        const idOne = await generateZKProofRoot("12345678");

        await RedPacket.connect(owner).create(
            MockToken.address, // This is the token address for ETH
            ethers.utils.parseEther("0.5"), // This is the amount of token
            ethers.utils.parseEther("0.5"), // This is the amount of token
            10, // This is the total number of addresses that can withdraw
            BonusType.AVERAGE, // This is the bonus type, set to RANDOM
            idOne);



        await RedPacket.connect(owner).create(
            MockToken.address, // This is the token address for ETH
            ethers.utils.parseEther("0.5"), // This is the amount of token
            ethers.utils.parseEther("0.5"), // This is the amount of token
            10, // This is the total number of addresses that can withdraw
            BonusType.AVERAGE, // This is the bonus type, set to RANDOM
            await generateZKProofRoot("1234567222222222228"));


        let proof = await generateZKProof(RedPacket, "12345678", Alice.address)

        let data = ethers.utils.solidityPack(
            ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
            [
                RedPacket.address,
                idOne,
                proof[0],
                proof[1],
                proof[2],
                proof[3],
                proof[4],
                proof[5],
                proof[6],
                proof[7]
            ]
        );
        console.log(idOne, data)
        const UserOperation = {
            sender: Alice.address,
            nonce: 0,
            initCode: "0x",
            callData: "0x",
            callGasLimit: 0,
            verificationGasLimit: 0,
            preVerificationGas: 0,
            maxFeePerGas: 0,
            maxPriorityFeePerGas: 0,
            paymasterAndData: data,
            signature: "0x",
        }


        console.log(await RedPacket.getRedPacket(idOne))
        await RedPacket.connect(owner).validatePaymasterUserOp(UserOperation, ethers.constants.HashZero, 0)
        console.log(await RedPacket.getRedPacket(idOne))

        console.log(await RedPacket.getOwnersRedPacket(owner.address))


        let context = ethers.utils.solidityPack(
            ["uint256", "address", "address", "uint256", "uint256", "uint32"],
            [

                idOne,
                RedPacket.address,
                RedPacket.address,
                1, 1, 1
            ]
        );



        await RedPacket.postOp2(context)

    });

    // it("merkle", async function () {
    //     let { owner, Alice, Bob, RedPacket, MockToken, BonusType, ProofType } = await loadFixture(deploy);

    //     let addresses = [
    //         owner.address,
    //         Alice.address
    //     ];

    //     await RedPacket.connect(owner).create(
    //         "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // This is the token address for ETH
    //         ethers.utils.parseEther("1.0"), // This is the amount of token
    //         10, // This is the total number of addresses that can withdraw
    //         BonusType.AVERAGE, // This is the bonus type, set to RANDOM
    //         await generateMerkleProofRoot(RedPacket, owner.address, addresses), // This is the passcode hash
    //         ProofType.MERKLE
    //         , { value: ethers.utils.parseEther("1.0") });

    //     await RedPacket.connect(owner).create(
    //         MockToken.address, // This is the token address for ETH
    //         ethers.utils.parseEther("1.0"), // This is the amount of token
    //         10, // This is the total number of addresses that can withdraw
    //         BonusType.AVERAGE, // This is the bonus type, set to RANDOM
    //         await generateMerkleProofRoot(RedPacket, owner.address, addresses), // This is the passcode hash
    //         ProofType.MERKLE
    //         , { value: ethers.utils.parseEther("1.0") });


    //     proof = await generateMerkleProof(RedPacket, 1, Alice.address, addresses);

    //     await RedPacket.connect(Alice).openWithMerkleProof(1, proof)
    //     console.log(await RedPacket.getRedPacket(1))
    //     proof = await generateMerkleProof(RedPacket, 2, Alice.address, addresses);

    //     await RedPacket.connect(Alice).openWithMerkleProof(2, proof)
    //     console.log(await RedPacket.getRedPacket(2))
    // });
});
