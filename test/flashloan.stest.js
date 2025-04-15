const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlashLoanArbitrage", function () {
    let flashLoanArbitrage;
    let owner;
    let addr1;
    let addr2;
    let wbtc;
    
    // Constants for Amoy testnet
    const AAVE_POOL_ADDRESS_PROVIDER = "0x357D51124f59836DeD84c8a1730D72B749d8BC23";
    const WBTC_ADDRESS = "0x97e8dE167322a3bCA28E8A49BC46F6Ce6a8a37b3";
    const INITIAL_FLASH_LOAN_AMOUNT = ethers.parseUnits("1", 8); // 1 WBTC
    const INITIAL_MIN_PROFIT = ethers.parseUnits("0.01", 8); // 0.01 WBTC
    const INITIAL_SLIPPAGE = 1000; // 1%

    beforeEach(async function () {
        // Get signers
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy the contract
        const FlashLoanArbitrage = await ethers.getContractFactory("FlashLoanArbitrage");
        flashLoanArbitrage = await FlashLoanArbitrage.deploy(
            AAVE_POOL_ADDRESS_PROVIDER,
            INITIAL_FLASH_LOAN_AMOUNT,
            INITIAL_MIN_PROFIT,
            INITIAL_SLIPPAGE
        );
        await flashLoanArbitrage.deployed();

        // Get WBTC contract instance
        wbtc = await ethers.getContractAt("IERC20", WBTC_ADDRESS);
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await flashLoanArbitrage.owner()).to.equal(owner.address);
        });

        it("Should set initial parameters correctly", async function () {
            expect(await flashLoanArbitrage.flashLoanAmount()).to.equal(INITIAL_FLASH_LOAN_AMOUNT);
            expect(await flashLoanArbitrage.minProfitThreshold()).to.equal(INITIAL_MIN_PROFIT);
            expect(await flashLoanArbitrage.slippageTolerance()).to.equal(INITIAL_SLIPPAGE);
        });
    });

    describe("Configuration", function () {
        it("Should allow owner to update config", async function () {
            const newFlashLoanAmount = ethers.parseUnits("2", 8);
            const newMinProfit = ethers.parseUnits("0.02", 8);
            const newSlippage = 2000;

            await flashLoanArbitrage.updateConfig(
                newFlashLoanAmount,
                newMinProfit,
                newSlippage
            );

            expect(await flashLoanArbitrage.flashLoanAmount()).to.equal(newFlashLoanAmount);
            expect(await flashLoanArbitrage.minProfitThreshold()).to.equal(newMinProfit);
            expect(await flashLoanArbitrage.slippageTolerance()).to.equal(newSlippage);
        });

        it("Should not allow non-owner to update config", async function () {
            await expect(
                flashLoanArbitrage.connect(addr1).updateConfig(
                    INITIAL_FLASH_LOAN_AMOUNT,
                    INITIAL_MIN_PROFIT,
                    INITIAL_SLIPPAGE
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Price Feed", function () {
        it("Should get WBTC price", async function () {
            const price = await flashLoanArbitrage.getWBTCPrice();
            expect(price).to.be.gt(0);
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow owner to withdraw tokens", async function () {
            // First, we need to send some tokens to the contract
            // This test will need actual WBTC on Amoy testnet
            if ((await wbtc.balanceOf(owner.address)).gt(0)) {
                const amount = ethers.parseUnits("0.1", 8);
                await wbtc.transfer(flashLoanArbitrage.address, amount);
                await flashLoanArbitrage.emergencyWithdraw(WBTC_ADDRESS);
                expect(await wbtc.balanceOf(flashLoanArbitrage.address)).to.equal(0);
            }
        });

        it("Should not allow non-owner to withdraw tokens", async function () {
            await expect(
                flashLoanArbitrage.connect(addr1).emergencyWithdraw(WBTC_ADDRESS)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Arbitrage Execution", function () {
        it("Should only allow owner to execute arbitrage", async function () {
            const mockSwapData = ethers.utils.defaultAbiCoder.encode(
                ["uint256", "uint256", "bytes", "bytes"],
                [0, 0, "0x", "0x"]
            );

            await expect(
                flashLoanArbitrage.connect(addr1).executeArbitrage(0, 0, "0x", "0x")
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});