var Ballot = artifacts.require("Ballot");   // 배포해야 할 스마트 컨트랙트 명시

module.exports = function(deployer) {
    deployer.deploy(Ballot, 4);     // Ballot constructor는 제안 수를 의미하는 4를 파라미터로 받아 보낸다.
}