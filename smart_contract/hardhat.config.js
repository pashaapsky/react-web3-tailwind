// https://eth-ropsten.alchemyapi.io/v2/5uBp3nNJDx_O2Zwe198Jjim4Ao8t6-5W

//smart contracts plugin
require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    ropsten: {
      url: "https://eth-ropsten.alchemyapi.io/v2/5uBp3nNJDx_O2Zwe198Jjim4Ao8t6-5W",
      accounts: ['a85bfc709232d11984e174dbf7d42b60ecde8430bac829f049e21cb7de16058b']
    }
  }
}