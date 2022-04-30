// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Ballot {
    struct Voter {
        uint256 weight;
        bool voted;
        uint256 vote;
    }

    struct Proposal {
        uint256 voteCount;
    }

    address chairperson;
    mapping(address => Voter) voters;
    Proposal[] proposals;

    modifier onlyChair() {
        require(msg.sender == chairperson);
        _;
    }

    modifier validVoter() {
        require(voters[msg.sender].weight > 0, "Not a Registered Voter");
        _;
    }

    constructor(uint256 numProposals) {
        chairperson = msg.sender;
        voters[chairperson].weight = 2;
        for (uint256 prop = 0; prop < numProposals; prop++)
            proposals.push(Proposal(0));
    }

    function register(address voter) public onlyChair {
        require(!voters[voter].voted);
        voters[voter].weight = 1;
        voters[voter].voted = false;
    }

    function vote(uint256 toProposal) public validVoter {
        Voter memory sender = voters[msg.sender];

        require(!sender.voted);
        require(toProposal < proposals.length);

        sender.voted = true;
        proposals[toProposal].voteCount += sender.weight;
    }

    function reqWinner() public view returns (uint256 winningProposal) {
        uint256 winningVoteCount = 0;
        for (uint256 prop = 0; prop < proposals.length; prop++) {
            if (proposals[prop].voteCount > winningVoteCount) {
                winningVoteCount = proposals[prop].voteCount;
                winningProposal = prop;
            }
        }
        assert(winningVoteCount >= 3);
    }
}
