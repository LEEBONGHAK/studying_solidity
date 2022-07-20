# DCC-Dapp
DIC Certification
----
The smart contract eco-system in **DCC-contract** in the `master` branch is set to connect to a smart contract hosted on Infura on the Ropsten test network. To test out the Dapp in a local environment checkout the branch `local-only`.

## Local Only Deployment

For a local deployment, for testing and experimenting, switch over to the branch `local-only` using `git checkout local-only`. This branch is configured to run a local blockchain network using Ganache.

## Deployment

 - Enter folder **DCC-contract** and run script `npm install` to install necessary packages.
 - After installation, run script `npm start`. This shall compile the smart contract and deploy it on the local Ganach blockchain. It executes the following commands:
   - It first compiles the code using `truffle compile`. This generates the **ABI** needed for the app to work.
   - It then migrates the smart contract to Ganache using `truffle migrate --reset`. The `--reset` option is necessary to overwrite an already deployed contract, which would cause the migrattion to fail otherwise.
   - The Account used for deployment shall be the first account in Ganache by default.
 - Switch to folder **DCC-app** and run script `npm install` to install necessary packages.
 - Deploy Node.js server using script `npm start`. You may now navigate to `localhost:3000` to interact with the app.

## Infura Deployment

Following changes need to be made for successful deployment and interaction of the smart contract.

### Contract Deployment

 - Run `npm install` in folder **DCC-contract** to install all dependencies.
 - In `truffle-config.js`, change the `ropsten` network config and add the new Infura project URL in `provider`.
 ```
 provider: () => new HDWalletProvider(mnemonic, `https://<ropsten url>`),
 ```
  - Add your metamask wallet mnemonic to a file `mnemonic.secret` in **DCC-contract** folder. This shall be used to identify the account used to deploy the smart contract (as seen in above provider snippet).
    - NOTE: This file and the mnemonic inside is to be kept a secret and should not be exposed to the world as anyone with this mnemonic can take over the accounts linked with it.
  - Run node script `npm run ropsten` from the **DCC-contract** folder to deploy smart contract to Infura. This internally runs 2 commands:
    - It first compiles the code using `truffle compile`. This generates the **ABI** needed for the app to work.
    - It then migrates the smart contract to the Infura project using `truffle migrate --network ropsten`.

The contract is now deployed. The migration script shall take more time than local deploy time. It shall print the address where it is deployed. Note this address of the smart contract. 

### App hosting

Add the SC address and the generated ABI to app.js in **DCC-app** folder. This shall enable access to the the Infura. Deploy app using `npm start`.