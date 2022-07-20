pragma solidity ^0.5.8;

contract BlindAuction {
    struct Bid {
        bytes32 blindedBid;
        uint deposit;
    }

    // Phases will be set only by external agents and not by time "now"
    // Enum-uint mapping:
    // Init - 0; Bidding - 1; Reveal - 2; Done - 3
    enum Phase {Init, Bidding, Reveal, Done}
     // Owner
    address payable public beneficiary;
       // Keep track of the highest bid,bidder
    address public highestBidder;
    uint public highestBid =0;
    // Only one bid allowed per address
    mapping(address => Bid) public bids;
    mapping(address => uint) pendingReturns;

    Phase public currentPhase = Phase.Init;
    event AuctionEnded(address winner, uint highestBid);
    event BiddingStarted();
    event RevealStarted ();
    event AuctionInit();
    // Modifiers
    modifier validPhase(Phase phase) {require(currentPhase == phase,'phaseError');
    _;}
    modifier onlyBeneficiary() {
	    require(msg.sender == beneficiary,'onlyBeneficiary'); _;
	}
    constructor() public {
        beneficiary = msg.sender;
    }

    function advancePhase() public onlyBeneficiary {
        uint nextPhase = uint(currentPhase) + 1;
        currentPhase = Phase(nextPhase);
        if (currentPhase == Phase.Reveal) emit RevealStarted();
        if (currentPhase == Phase.Bidding) emit BiddingStarted();
        if (currentPhase == Phase.Init) emit AuctionInit();
    }

    function bid(bytes32 blindBid) public payable validPhase(Phase.Bidding) {
        require(msg.sender != beneficiary,'beneficiaryBid');
        bids[msg.sender] = Bid({
            blindedBid: blindBid,
            deposit: msg.value
        });
    }

    function reveal(uint value, bytes32 secret) public validPhase(Phase.Reveal) {
        require(msg.sender != beneficiary,'beneficiaryReveal');
        uint refund = 0;
        Bid storage bidToCheck = bids[msg.sender];
        if (bidToCheck.blindedBid == keccak256(abi.encodePacked(value, secret))) {
            refund += bidToCheck.deposit;
            if (bidToCheck.deposit >= value*1000000000000000000) {
                if (placeBid(msg.sender, value*1000000000000000000))
                    refund -= value*1000000000000000000;
                }
        }
        msg.sender.transfer(refund);
    }

    // This is an "internal" function which means that it
    // can only be called from the contract itself (or from
    // derived contracts).
    function placeBid(address bidder, uint value) internal returns (bool success) {
        if (value <= highestBid) {
            return false;
        }
        if (highestBidder != address(0)) {
            pendingReturns[highestBidder] += highestBid;
        }
        highestBid = value;
        highestBidder = bidder;

        return true;
    }

    // Withdraw a non-winning bid
    function withdraw() public {
        uint amount = pendingReturns[msg.sender];
        if (amount > 0) {
            pendingReturns[msg.sender] = 0;
            msg.sender.transfer(amount);
        }
    }
    function auctionEnd() public validPhase(Phase.Done){
         if(address(this).balance >= highestBid){
         beneficiary.transfer(highestBid);
         }
        emit AuctionEnded(highestBidder, highestBid);
    }
    function closeAuction() public{
        selfdestruct(beneficiary);
    }
}