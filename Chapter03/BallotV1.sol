// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract BallotV1
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
}