const { ethers } = require('hardhat');

// The provided data
const data = "0xcf30680be271b8ae26737543d225660512f066721d0f4b07d371dfc7769208e57f741e33581d1c03a9a29f1522a167642a2f3295006d05222b9f756189019cd6f7834b750489e1a6ce51a7985a21a1eac03fadb60825479bafaa47f98d434bd7606318e86b0f80148241c88b1203569399bcfaa224ed418411e9d3aa848b4aaac5a68a86ed4a009207cad4c0d163c67741905405140c58e8252b3a3304693fca1cdd524ccf6521c5e5c069b0ba85fc2db8e187830be06be6d1e467fdaed877f9759a49c39e869565c571c96c504d47691c81c67800a8a50bdeb1da25f80e234faaa79c450dc3e19f572439182e48d9dd2f14befc10f2ca627a8a8d41299634c537ae2b8ce81362f885577ff642312525a04b537e1df1b9b60aa76b2ce66cae3827a2375dcc4be59466434a2ace7520ad17ece014";

// Remove the '0x' prefix
const strippedData = data.substring(2);

// Define the positions of each type
const addressLength = 40; // 20 bytes, but each byte is 2 hex characters
const uint256Length = 64; // 32 bytes, each byte is 2 hex characters

// Define the starting positions for each type
let position = 0;
const address1 = '0x' + strippedData.slice(position, position + addressLength);
position += addressLength;

const uints = [];
for (let i = 0; i < 9; i++) {
    const uint = ethers.BigNumber.from('0x' + strippedData.slice(position, position + uint256Length)).toString();
    uints.push(uint);
    position += uint256Length;
}

// Log the results
console.log('Address 1:', address1);

console.log('uint256 values:', uints);