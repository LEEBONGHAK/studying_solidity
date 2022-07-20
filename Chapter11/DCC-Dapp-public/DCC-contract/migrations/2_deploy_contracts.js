var certificationContract = artifacts.require("./DICCertification.sol");

module.exports = function(deployer) {
      deployer.deploy(certificationContract);
}