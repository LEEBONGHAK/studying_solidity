// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract Airlines {
    address chairperson;

    // 요청 파라미터를 위한 데이터 타입
    struct reqStruc {
        uint256 reqID;
        uint256 fID;
        uint256 numSeats;
        uint256 passengerID;
        address toAirline;
    }

    // 응답 파라미터를 위한 데이터 타입
    struct respStruc {
        uint256 reqID;
        bool status;
        address fromAirline;
    }

    // 어카운트 주소를 온체인 데이터에 매핑
    mapping(address => uint256) public escrow;
    mapping(address => uint256) membership;
    mapping(address => reqStruc) reqs;
    mapping(address => respStruc) reps;
    mapping(address => uint256) settledReqID;

    // 수정자
    modifier onlyChairperson() {
        require(msg.sender == chairperson);
        _;
    }

    modifier onlyMember() {
        require(membership[msg.sender] == 1);
        _;
    }

    constructor() payable {
        chairperson = msg.sender;
        membership[chairperson] = 1; // 자동으로 등록
        escrow[msg.sender] = msg.value;
    }

    function register() public payable {
        address newAirline = msg.sender;
        membership[newAirline] = 1;
        escrow[newAirline] = msg.value;
    }

    function unregister(address payable delAirline) public onlyChairperson {
        membership[delAirline] = 0;
        // 등록 해지한 항공사에게 에스크로 환불
        delAirline.transfer(escrow[delAirline]);
        escrow[delAirline] = 0;
    }

    function ASKrequest(
        uint256 reqID,
        uint256 flightID,
        uint256 numSeats,
        uint256 custID,
        address toAirline
    ) public onlyMember {
        require(membership[toAirline] == 1);
        // ASKRequest()의 파라미터를 온체인 데이터로 기록
        reqs[msg.sender] = reqStruc(
            reqID,
            flightID,
            numSeats,
            custID,
            toAirline
        );
    }

    function ASKresponse(
        uint256 reqID,
        bool success,
        address fromAirline
    ) public onlyMember {
        require(membership[fromAirline] == 1);
        reps[msg.sender].reqID = reqID;
        reps[msg.sender].status = success;
        reps[msg.sender].fromAirline = fromAirline;
    }

    function settlePayment(
        uint256 reqID,
        address payable toAirline,
        uint256 numSeats
    ) public payable onlyMember {
        // 이것을 호출하기 전에 ASK 뷰 테이블을 업데이트
        address fromAirline = msg.sender;

        // 이것은 실행하고자 하는 컨소시엄 어카운트 전송이다.
        // 각 좌석의 코스트는 1ETH라고 가정한다.
        // wei 단위로 계산
        escrow[toAirline] += numSeats * 1000000000000000000;
        escrow[fromAirline] -= numSeats * 1000000000000000000;
        settledReqID[fromAirline] = reqID; // request ID는 지급 증거로 온체인 스테이트 트리에 저장됨
    }

    function replenishEscrow() public payable {
        escrow[msg.sender] += msg.value;
    }
}
