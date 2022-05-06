pragma solidity ^0.8.13;

// import "hardhat/console.sol";

contract Ballot {

    struct Voter {                     
        uint weight;
        bool voted;
        uint vote;
    }
    struct Proposal {                  
        uint voteCount;
    }

    bool public test;

    address chairperson;
    mapping(address => Voter) voters;
    Proposal[] proposals;

    //modifiers
    modifier onlyChair() 
    {
        require(msg.sender == chairperson, "You are not chairperson");
        _;
    }
    
    modifier validVoter()
    {
        require(voters[msg.sender].weight > 0, "Not a Registered Voter");
        _;
    }

    constructor (uint numProposals) {
        chairperson = msg.sender;
        voters[chairperson].weight = 2; // weight 2 for testing purposes
        //proposals.length = numProposals; -- before 0.6.0
        for (uint prop = 0; prop < numProposals; prop ++)
            proposals.push(Proposal(0));
        
    }
    
    function register(address voter) public onlyChair{
        voters[voter].weight = 1;
        voters[voter].voted = false;
    }

    function vote(uint toProposal) public validVoter{
        Voter memory sender = voters[msg.sender];
        require(sender.voted == false, "You already voted");
        require (toProposal < proposals.length, "Undefined Proposal");
        voters[msg.sender].voted = true;
        voters[msg.sender].vote = toProposal;
        proposals[toProposal].voteCount += sender.weight;
    }

    function reqWinner() public view returns (uint winningProposal) {
        uint winningVoteCount = 0;
        for (uint prop = 0; prop < proposals.length; prop++) 
            if (proposals[prop].voteCount > winningVoteCount) {
                winningVoteCount = proposals[prop].voteCount;
                winningProposal = prop;
            }
        assert(winningVoteCount>=3);
    }
}
