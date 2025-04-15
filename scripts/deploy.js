const hre = require("hardhat");

async function main() {
    // Contract parameters
    const AAVE_POOL_ADDRESS_PROVIDER = "0x357D51124f59836DeD84c8a1730D72B749d8BC23";
    const INITIAL_FLASH_LOAN_AMOUNT = ethers.parseUnits("1", 8); // 1 WBTC
    const INITIAL_MIN_PROFIT = ethers.parseUnits("0.01", 8); // 0.01 WBTC
    const INITIAL_SLIPPAGE = 1000; // 1%

    console.log("Deploying FlashLoanArbitrage contract...");
    console.log("Network:", hre.network.name);
    console.log("Aave Pool Address Provider:", AAVE_POOL_ADDRESS_PROVIDER);

    // Deploy the contract
    const FlashLoanArbitrage = await hre.ethers.getContractFactory("FlashLoanArbitrage");
    const flashLoanArbitrage = await FlashLoanArbitrage.deploy(
        AAVE_POOL_ADDRESS_PROVIDER,
        INITIAL_FLASH_LOAN_AMOUNT,
        INITIAL_MIN_PROFIT,
        INITIAL_SLIPPAGE
    );

    await flashLoanArbitrage.deployed();

    console.log("FlashLoanArbitrage deployed to:", flashLoanArbitrage.address);
    console.log("Initial Flash Loan Amount:", ethers.utils.formatUnits(INITIAL_FLASH_LOAN_AMOUNT, 8), "WBTC");
    console.log("Initial Min Profit:", ethers.utils.formatUnits(INITIAL_MIN_PROFIT, 8), "WBTC");
    console.log("Initial Slippage Tolerance:", INITIAL_SLIPPAGE / 1000, "%");

    // Verify the contract on Polygonscan
    if (hre.network.name !== "hardhat") {
        console.log("Waiting for 5 block confirmations before verification...");
        await flashLoanArbitrage.deployTransaction.wait(5);

        console.log("Verifying contract...");
        await hre.run("verify:verify", {
            address: flashLoanArbitrage.address,
            constructorArguments: [
                AAVE_POOL_ADDRESS_PROVIDER,
                INITIAL_FLASH_LOAN_AMOUNT,
                INITIAL_MIN_PROFIT,
                INITIAL_SLIPPAGE
            ],
        });
        console.log("Contract verified on Polygonscan");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });