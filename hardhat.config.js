require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
module.exports = {
  solidity: "0.8.17",

  networks: {
    OKCTestnet: {
      url: "https://exchaintestrpc.okex.org",
      accounts: [process.env.PRIVATE_KEY]
    },
    PolygonMainnet: {
      url: "https://polygon-pokt.nodies.app",
      accounts: [process.env.PRIVATE_KEY],
    },
    // Sepolia: {
    //   url: "https://1rpc.io/sepolia",
    //   accounts: [process.env.PRIVATE_KEY]
    // },
  },
};
