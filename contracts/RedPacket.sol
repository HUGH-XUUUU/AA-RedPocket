// SPDX-License-Identifier: GPLv3
pragma solidity =0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@account-abstraction/contracts/interfaces/UserOperation.sol";
import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "./interface/IRedPacket.sol";
import "./Verifier.sol";
import "hardhat/console.sol";

contract RedPacket is IPaymaster, IRedPacket, Verifier, Ownable {
    using SafeERC20 for IERC20;

    address public immutable ENTRYPOINT;

    constructor(address entryPoint) {
        ENTRYPOINT = entryPoint;
    }

    mapping(address => uint256[]) internal ownerToId;
    mapping(uint256 => RedPacketInfo) internal redPackets;
    mapping(bytes32 => bool) internal withdrawedMap;
    mapping(uint256 => bool) internal usedId;

    function withdrawERC20(
        address token,
        uint256 amount,
        address withdrawAddress
    ) external onlyOwner {
        IERC20(token).safeTransfer(withdrawAddress, amount);
    }

    function withdrawDepositNativeToken(
        address entryPoint,
        address payable withdrawAddress,
        uint256 amount
    ) public onlyOwner {
        IEntryPoint(entryPoint).withdrawTo(withdrawAddress, amount);
    }

    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32,
        uint256
    ) external returns (bytes memory, uint256) {
        require(msg.sender == ENTRYPOINT, "not called by entryPoint");
        require(userOp.callData.length == 0, "Calldata field is not empty");

        bytes memory context = openWithZKP(
            uint256(bytes32(userOp.paymasterAndData[20:52])),
            userOp.sender,
            [
                uint256(bytes32(userOp.paymasterAndData[52:84])),
                uint256(bytes32(userOp.paymasterAndData[84:116])),
                uint256(bytes32(userOp.paymasterAndData[116:148])),
                uint256(bytes32(userOp.paymasterAndData[148:180])),
                uint256(bytes32(userOp.paymasterAndData[180:212])),
                uint256(bytes32(userOp.paymasterAndData[212:244])),
                uint256(bytes32(userOp.paymasterAndData[244:276])),
                uint256(bytes32(userOp.paymasterAndData[276:308]))
            ]
        );

        return (context, 0);
    }

    function postOp(
        IPaymaster.PostOpMode,
        bytes calldata context,
        uint256
    ) external {
        require(msg.sender == ENTRYPOINT, "not called by entryPoint");
        uint256 id = uint256(bytes32(context[0:32]));
        address receiver = address(bytes20(context[32:52]));
        address token = address(bytes20(context[52:72]));
        uint256 bonus = uint256(bytes32(context[72:104]));
        uint256 amountLeft = uint256(bytes32(context[104:136]));
        uint32 totalLeft = uint32(bytes4(context[136:140]));
        emit Open(id, receiver, token, bonus, amountLeft, totalLeft);
    }

    function create(
        address token,
        uint256 gasAmount,
        uint256 amount,
        uint32 total,
        BonusType bonusType,
        uint256 proofRoot
    ) public {
        require(!usedId[proofRoot], "id has been used");
        require(token != address(0), "Invalid token address");
        require(total > 0, "Invalid total");
        require(amount >= total, "Invalid amount");
        require(
            (IERC20(token)).allowance(msg.sender, address(this)) >=
                amount + gasAmount,
            "not enough allowance"
        );

        usedId[proofRoot] = true;
        RedPacketInfo storage p = redPackets[proofRoot];
        p.proofRoot = proofRoot;
        p.amount = amount;
        p.amountLeft = amount;
        p.gasAmount = gasAmount;
        p.creator = msg.sender;
        p.token = token;
        p.total = total;
        p.totalLeft = total;
        p.bonusType = bonusType;
        p.timeLeft = block.timestamp + 86400;
        ownerToId[msg.sender].push(proofRoot);
        emit Create(
            proofRoot,
            msg.sender,
            token,
            amount,
            gasAmount,
            total,
            bonusType
        );
    }

    function openWithZKP(
        uint256 id,
        address receiver,
        uint256[8] memory proof
    ) internal returns (bytes memory) {
        RedPacketInfo storage p = redPackets[id];
        bytes32 withdrawedHash = keccak256(abi.encodePacked(id, receiver));
        require(!withdrawedMap[withdrawedHash], "Already opened");
        require(p.totalLeft > 0, "Red packet is empty");
        require(block.timestamp <= p.timeLeft, "Red packet time expired");
        require(proof.length == 8, "Invalid proof");
        require(
            verifyProof(
                [proof[0], proof[1]],
                [[proof[2], proof[3]], [proof[4], proof[5]]],
                [proof[6], proof[7]],
                [p.proofRoot, uint256(uint160(receiver))]
            ),
            "Failed verify proof"
        );

        uint256 bonus = getBonus(
            p.amount,
            p.amountLeft,
            p.total,
            p.totalLeft,
            p.bonusType
        );
        uint256 gas = p.gasAmount / p.total;

        (IERC20(p.token)).safeTransferFrom(p.creator, receiver, bonus);
        (IERC20(p.token)).safeTransferFrom(p.creator, address(this), gas);

        p.amountLeft = p.amountLeft - bonus;
        p.totalLeft = p.totalLeft - 1;
        withdrawedMap[withdrawedHash] = true;

        return (
            abi.encodePacked(
                id,
                receiver,
                p.token,
                bonus,
                p.amountLeft,
                p.totalLeft
            )
        );
    }

    function getOwnersRedPacket(
        address owner
    ) public view returns (RedPacketInfo[] memory) {
        uint256 length = ownerToId[owner].length;
        RedPacketInfo[] memory balances = new RedPacketInfo[](length);
        for (uint256 i = 0; i < length; i++) {
            balances[i] = getRedPacket(ownerToId[owner][i]);
        }
        return balances;
    }

    function getRedPacket(
        uint256 id
    ) public view returns (RedPacketInfo memory) {
        RedPacketInfo memory p = redPackets[id];
        require(p.token != address(0), "Not exist");
        p.timeLeft = p.timeLeft >= block.timestamp
            ? p.timeLeft - block.timestamp
            : 0;
        return p;
    }

    function isOpened(uint256 id, address addr) public view returns (bool) {
        bytes32 withdrawedHash = keccak256(abi.encodePacked(id, addr));
        return withdrawedMap[withdrawedHash];
    }

    function getBonus(
        uint256 amount,
        uint256 amountLeft,
        uint32 total,
        uint32 totalLeft,
        BonusType bonusType
    ) internal view returns (uint256) {
        if (totalLeft == 1) {
            return amountLeft; // last one picks all
        } else {
            if (bonusType == BonusType.AVERAGE) {
                return amount / total;
            } else {
                uint256 up = amountLeft - totalLeft + 1;
                uint256 rnd = uint256(
                    keccak256(
                        abi.encodePacked(
                            msg.sender,
                            amountLeft,
                            block.timestamp
                        )
                    )
                ) % ((amount << 1) / total);
                if (rnd < 1) {
                    return 1;
                }
                if (rnd > up) {
                    return up;
                }
                return rnd;
            }
        }
    }
}
