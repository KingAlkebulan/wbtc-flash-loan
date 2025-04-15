require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
    solidity: {
        version: "0.8.28",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        amoy: {
            url: "https://rpc-amoy.polygon.technology",
            accounts: [process.env.PRIVATE_KEY],
            chainId: 80002,
            gasPrice: "auto"
        }
    },
    etherscan: {
        apiKey: {
            polygonAmoy: process.env.POLYGONSCAN_API_KEY
        }
    }
};