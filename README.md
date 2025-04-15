# WBTC Flash Loan Arbitrage Smart Contract

## Overview
This smart contract implements an automated arbitrage system using flash loans to exploit WBTC price differences between 1inch and ParaSwap DEX aggregators on the Polygon network. The contract leverages Aave V3's flash loan functionality, Chainlink price feeds, and implements multiple security features to ensure safe and profitable arbitrage execution.

## Features

### Core Functionality
- **Flash Loan Integration**: Utilizes Aave V3's flash loan protocol for capital-efficient arbitrage
- **Multi-DEX Arbitrage**: Executes trades across 1inch and ParaSwap for optimal pricing
- **Price Oracle**: Integrates Chainlink price feeds for reliable WBTC/USD price data
- **Configurable Parameters**: Adjustable flash loan amount, profit threshold, and slippage tolerance

### Security Features
- **Access Control**: Implements OpenZeppelin's `Ownable` for secure management
- **Reentrancy Protection**: Uses OpenZeppelin's `ReentrancyGuard`
- **Emergency Withdrawal**: Includes emergency fund recovery function
- **Minimum Profit Threshold**: Ensures trades only execute when profitable
- **Slippage Protection**: Configurable slippage tolerance to prevent excessive losses

### Events
- `ArbitrageExecuted`: Logs flash loan amount, profit, and timestamp
- `PriceUpdate`: Tracks WBTC price updates
- `ConfigUpdated`: Records changes to contract parameters

## Key Components

### Constants (Polygon Network)
- WBTC Token: `0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6`
- Chainlink WBTC/USD Price Feed
- 1inch Router
- ParaSwap Router

### Configurable Parameters
- `flashLoanAmount`: Size of the flash loan for arbitrage
- `minProfitThreshold`: Minimum profit required to execute trades
- `slippageTolerance`: Maximum acceptable slippage percentage

## Core Functions

### `executeArbitrage`
- Initiates the arbitrage operation
- Handles flash loan request and parameter encoding
- Restricted to contract owner
- Implements reentrancy protection

### `executeOperation`
- Handles the flash loan callback
- Executes arbitrage trades across DEX aggregators
- Verifies profit threshold
- Manages loan repayment

### `executeOneInchSwap` & `executeParaswapSwap`
- Internal functions for executing trades on respective DEX aggregators
- Implements slippage checks
- Handles token approvals and swap execution

### Management Functions

### `updateConfig`
- Updates contract parameters
- Restricted to owner
- Emits configuration change events

### `getWBTCPrice`
- Fetches current WBTC price from Chainlink oracle
- Includes price validation

### `emergencyWithdraw`
- Allows owner to recover tokens in emergency situations
- Includes balance verification

## Security Considerations
- Implements multiple security checks and validations
- Restricts critical functions to contract owner
- Includes slippage protection and minimum profit requirements
- Protects against reentrancy attacks
- Validates oracle price data

## Dependencies
- OpenZeppelin Contracts
- Aave V3 Flash Loan Contracts
- Chainlink Price Feeds
- 1inch and ParaSwap Integration

## Network Support
Currently deployed and operational on the Polygon network, utilizing its established DeFi infrastructure and liquidity pools.

## License
MIT License
