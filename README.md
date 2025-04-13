# Blip – Decentralized Social Media App

Blip is a decentralized social media application that empowers users with enhanced data ownership, security, and transparency. Built with React Native and Expo for the frontend, and Ethereum smart contracts written in Solidity for the backend, Blip ensures that users have full control over their content. Media files are stored using IPFS, providing a censorship-resistant and tamper-proof experience.

## Features

- **Decentralized Identity**: Users authenticate via Ethereum wallets, ensuring secure and private access.
- **Smart Contract Integration**: Core functionalities like posting and user interactions are managed through Ethereum smart contracts.
- **IPFS Media Storage**: All media content is stored on IPFS, ensuring decentralized and reliable access.
- **Cross-Platform Compatibility**: Developed with React Native and Expo, Blip runs seamlessly on both Android and iOS devices.

## Tech Stack

- **Frontend**: React Native, Expo
- **Blockchain**: Ethereum, Solidity
- **Storage**: IPFS
- **Development Tools**: Hardhat, Ethers.js

## Installation

### Prerequisites

- Node.js and npm
- Expo CLI (`npm install -g expo-cli`)
- Ethereum wallet (e.g., MetaMask)
- IPFS node or access to an IPFS gateway

### Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/abhinavpareek655/blip-expo.git
   cd blip-expo
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Expo Server**:
   ```bash
   npx expo start
   ```
   This will launch the development server and provide options to run the app on an emulator or physical device.

## Usage

- **Authentication**: Users connect their Ethereum wallets to authenticate.
- **Posting Content**: Users can create posts, which are stored on IPFS and referenced on the Ethereum blockchain.
- **Viewing Content**: The app fetches and displays content from IPFS, ensuring decentralized access.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your enhancements.

---

For more details, visit the [Blip GitHub Repository](https://github.com/abhinavpareek655/blip-expo.git).
