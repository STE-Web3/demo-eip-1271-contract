import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const GOERLI_PRIVATE_KEY =
  "28e5f0183df7dfc427afc14e32e2c24fe09de293eb3d1ee82443e850c0fb8a12";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/YIktMLXAFY3ZsoxjfkUppo-iyPqEuuNb`,
      accounts: [GOERLI_PRIVATE_KEY],
    },
  },
};

export default config;
