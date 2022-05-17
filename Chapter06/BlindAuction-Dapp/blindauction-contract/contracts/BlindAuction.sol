// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract BlindAuction {
    // 입찰 정보 구조체
    struct Bid {
        bytes32 blindedBid; // 입찰 물품
        uint256 deposit; // 예치금
    }

    // 상태는 수헤자에 의해 설정된다.
    enum Phase {
        Init,
        Bidding,
        Reveal,
        Done
    }

    Phase public currentPhase = Phase.Init;
    address payable beneficiary; // owner - 컨트랙트 배포자가 수혜자
    mapping(address => Bid) bids; // 주소 당 오직 1회만 입찰

    // 최고가 입찰자의 정보
    address public highestBidder;
    uint256 public highestBid = 0;

    // 낙찰 탈락자의 예치금 반환
    mapping(address => uint256) depositReturns;

    // 이벤트 정의
    event AuctionEnded(address winner, uint256 highestBid);
    event BiddingStarted();
    event RevealStarted();

    // 경매 단계를 위한 수정자
    modifier validPhase(Phase phase) {
        require(currentPhase == phase);
        _;
    }

    // 수혜자를 확인하는 수정자
    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary);
        _;
    }

    // constructor가 수혜자로 결정됨
    constructor() {
        beneficiary = payable(msg.sender);
    }

    // currentPhase 변경 함수
    function advancePhase() public onlyBeneficiary {
        // 이미 Done 단계이면 Init 단계로 초기화
        if (currentPhase == Phase.Done) {
            currentPhase = Phase.Init;
        } else {
            // 그렇지 않다면 단계를 증가
            // enum이 내부적으로 uints를 사용하기 때문에 uint로 변환
            uint256 nextPhase = uint256(currentPhase) + 1;
            currentPhase = Phase(nextPhase);
        }

        // 해당 이벤트 발생
        if (currentPhase == Phase.Reveal) emit RevealStarted();
        if (currentPhase == Phase.Bidding) emit BiddingStarted();
    }

    // 블라인드 경매 함수
    function bid(bytes32 blindBid) public payable validPhase(Phase.Bidding) {
        bids[msg.sender] = Bid({blindedBid: blindBid, deposit: msg.value});
    }

    // 블라인드 입찰 확인
    function reveal(uint256 value, bytes32 secret)
        public
        validPhase(Phase.Reveal)
    {
        uint256 refund = 0;
        Bid storage bidToCheck = bids[msg.sender];

        if (
            bidToCheck.blindedBid == keccak256(abi.encodePacked(value, secret))
        ) {
            refund += bidToCheck.deposit;
            if (bidToCheck.deposit >= value && placeBid(msg.sender, value)) {
                refund -= value;
            }
        }
    }

    // 최고가액과 최고가를 제시한 제시자를 바꾸는 함수 - 내부함수(internal)
    function placeBid(address bidder, uint256 value)
        internal
        returns (bool success)
    {
        if (value <= highestBid) {
            return false;
        }

        if (highestBidder != address(0)) {
            // 이전 최고가 입찰자에게 환물
            depositReturns[highestBidder] += highestBid;
        }

        highestBidder = bidder;
        highestBid = value;
        return true;
    }

    // 낙찰 탈락 입찰 출금 - 낙찰 탈락자에 의해 호출됨
    function withdraw() public {
        uint256 amount = depositReturns[msg.sender];
        require(amount > 0);
        depositReturns[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    // 경매를 종료하고 수혜자에게 최고가 입찰액을 전송 - Done 단계에서 호출됨
    function auctionEnd() public validPhase(Phase.Done) {
        beneficiary.transfer(highestBid);
    }
}
