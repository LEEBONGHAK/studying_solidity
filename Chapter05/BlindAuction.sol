// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract BlindAuction {

    // 입찰 정보 구조체
    struct Bid {
        bytes32 blindedBid;   // 입찰 물품
        uint deposit;       // 예치금
    }

    // 상태는 수혜자에 의해 설정된다.
    enum Phase {
        Init,
        Bidding,
        Reveal,
        Done
    }
    Phase public state = Phase.Init;

    address payable beneficiary;    // owner - 컨트랙트 배포자가 수혜자다
    mapping(address => Bid) bids;   // 주소 당 오직 1회만 입찰

    // 최고가 입찰자의 정보
    address public highestBidder;
    uint public highestBid = 0;

    // 낙찰 탈락자의 예치금 반환
    mapping(address => uint) depositReturns;

    // 수정자
    modifier validPhase(Phase reqPhase) {   // 경매 단계를 위한 수정자
        require(state == reqPhase);
        _;
    }
    modifier onlyBeneficiary() {    // 수혜자를 확인하는 수정자
        require(msg.sender == beneficiary);
        _;
    }

    // constructor가 수혜자를 결정
    constructor() {
        beneficiary = payable(msg.sender);
        state = Phase.Bidding;
    }

    // state 변경 함수
    function changeState(Phase x) public onlyBeneficiary {
        require(x >= state);
        state = x;
    }

    // 블라인트 경매 함수
    function bid(bytes32 blindBid) public payable validPhase(Phase.Bidding) {
        bids[msg.sender] = Bid({
            blindedBid: blindBid,
            deposit: msg.value
        });
    }

    // reveal()이 블라인트 입찰을 확인
    function reveal(uint value, bytes32 secret) public validPhase(Phase.Reveal) {
        uint refund = 0;
        Bid storage bidToCheck = bids[msg.sender];
        if (bidToCheck.blindedBid == keccak256(abi.encodePacked(value, secret))) {
            refund += bidToCheck.deposit;
            if (bidToCheck.deposit >= value && placeBid(msg.sender, value)) {
                refund -= value;
            }
        }
    }

    // 최고가액과 최고가를 제시한 제시자를 바꾸는 함수 - 내부함수(internal)
    function placeBid(address bidder, uint value) internal returns (bool success) {
        if (value <= highestBid) {
            return false;
        }
        if (highestBidder != address(0)) {
            // 이전 최고가 입찰자에게 환불
            depositReturns[highestBidder] += highestBid;
        }
        highestBidder = bidder;
        highestBid = value;
        return true;
    }

    // 낙찰 탈락 입찰 출금
    function withdraw() public {    // 낙찰 탈락자에 의해 호출된다.
        uint amount = depositReturns[msg.sender];
        require(amount > 0);
        depositReturns[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    // 경매를 종료하고 수혜자에게 최고가 입찰액을 전송
    function auctionEnd() public validPhase(Phase.Done) {   // auctionEnd() 함수는 Done 단계에서 호출된다.
        beneficiary.transfer(highestBid);
    }
}
