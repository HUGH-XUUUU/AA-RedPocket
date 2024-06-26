// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("MyToken", "MTK") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
