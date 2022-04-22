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
    Proposal[] proposal;

    // 투표의 여러 단계(0, 1, 2, 3)를 나타내고, Init 단계로 초기화
    enum Phase
    {
        Init,
        Regs,
        Vote,
        Done
    }
    
    Phase public state = Phase.Init;

    // 컨트렉트 배포자로서 의장을 설정
    constructor (uint numProposals)
    {
        chairperson = msg.sender;
        voters[chairperson].weight = 2; // 테스트를 위해 가중치를 2로 설정

        // 제안 개수는 constructor의 파라미터
        for (uint prop = 0; prop < numProposals; prop++)
            proposal.push(Proposal(0));
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
}