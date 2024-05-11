// SPDX-License-Identifier: GPLv3
pragma solidity =0.8.17;

interface IRedPacket {
    enum BonusType {
        AVERAGE,
        RANDOM
    }

    enum ProofType {
        ZK,
        MERKLE
    }

    struct RedPacketInfo {
        uint256 proofRoot; // passcode hash of red packet
        uint256 amount; // amount of token
        uint256 amountLeft; // mutable: balance of token
        uint256 gasAmount; // amount of token
        address creator; // creator address
        address token; // token address
        uint32 total; // total number of address
        uint32 totalLeft; // mutable: current number of address that can withdraw
        uint256 timeLeft;
        BonusType bonusType;
    }

    event Create(
        uint256 redPacketId,
        address indexed creator,
        address indexed token,
        uint256 amount,
        uint256 gasAmount,
        uint32 total,
        BonusType bonusType
    );

    event Open(
        uint256 redPacketId,
        address indexed to,
        address indexed token,
        uint256 bonus,
        uint256 bonusLeft,
        uint32 totalLeft
    );
}
