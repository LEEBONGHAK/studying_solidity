// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract BallotV2
{
    // 투표자 상세 정보 구조체00
    struct Voter
    {
        uint weight;
        bool voted;
        uint vote;
    }

    // 제안의 상세 정보 구조체
    struct Proposal
    {
        uint voteCount;
    }

    address chairperson;    // 의장
    mapping(address => Voter) voters;   // 투표자 주소를 투표자 상세 정보로 매핑
    Proposal[] proposals;

    // 투표의 여러 단계(0, 1, 2, 3)를 나타내고, Init 단계로 초기화
    enum Phase
    {
        Init,
        Regs,
        Vote,
        Done
    }
    
    Phase public state = Phase.Init;

    // 수정자
    modifier validPhase(Phase reqPhase)
    {
        require(state == reqPhase);
        _;
    }

    // 컨트렉트 배포자로서 의장을 설정
    constructor (uint numProposals)
    {
        chairperson = msg.sender;
        voters[chairperson].weight = 2; // 테스트를 위해 가중치를 2로 설정

        // 제안 개수는 constructor의 파라미터
        for (uint prop = 0; prop < numProposals; prop++)
            proposals.push(Proposal(0));
    }

    // 단계를 변화시키는 함수(상태 변화 함수): 오직 의장만이 실행 가능
    function changState(Phase x) public
    {
        // 의만만이 상태를 바꿀 수 있고, 의장이 아닌 경우 되돌린다.
        if (msg.sender != chairperson)
            revert();
        // state는 0, 1, 2, 3 순서대로 진행하며, 그렇지 않을 경우 되돌린다.
        if (x < state)
            revert();
        
        state = x;
    }

    // 의장만이 실행 가능
    function register(address voter) public validPhase(Phase.Regs)
    {
        if (msg.sender != chairperson || voters[voter].voted)
            revert();
        
        voters[voter].weight = 1;
        voters[voter].voted = false;
    }

    // 투표 단계(Phase.Vote)에서만 실행 가능
    function vote(uint toProposal) public validPhase(Phase.Vote)
    {
        // struct 데이터 구조는 default로 storage 변수
        // memory: 일시적으로 블록에 저장되지 않음을 명시적으로 표시
        Voter memory sender = voters[msg.sender];
        if (sender.voted || toProposal >= proposals.length)
            revert();

        sender.voted = true;
        sender.vote = toProposal;
        proposals[toProposal].voteCount += sender.weight;
    }

    // 투표를 집계하고 투표수로 어느 제안이 승리했는지 식별하는 함수
    // 읽기용 함수(view), 체인에 Tx를 기록하지 않는다.
    function reqWinner() public validPhase(Phase.Done) view returns (uint winningProposal)
    {
        uint winningVoteCount = 0;
        for (uint prop = 0; prop < proposals.length; prop++)
        {
            if (proposals[prop].voteCount > winningVoteCount)
            {
                winningVoteCount = proposals[prop].voteCount;
                winningProposal = prop;
            }
        }
    }
}