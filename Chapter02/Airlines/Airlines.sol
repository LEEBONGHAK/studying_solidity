// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract Airlines
{
    address chairperson;    // 의장(chairperson)의 아이덴티티를 나타냄
    struct details  // 항공사 데이터 구조(에스크로 또는 예치금을 포함한 항공사의 데이터를 집합적으로 정의)
    {
        uint escrow;    // 지불 정산을 위한 예치
        uint status;
        uint hashOfDetails;
    }

    // 항공사 어카운트 페이먼트와 회원 매핑
    // 회원의 어카운트 주소(아이덴티티)를 그들의 상세 정보에 매핑(해시 테이블과 유사)
    mapping (address => details) public balaceDetails;
    mapping (address => uint) membership;

    // 수정자 또는 규칙들
    modifier onlyChairperson    // onlyChairperson 규칙을 위한 수정자
    {
        require(msg.sender == chairperson);
        _;
    }

    modifier onlyMember
    {
        require(membership[msg.sender] == 1);
        _;
    }

    // 생성자 함수
    constructor() payable
    {
        chairperson = msg.sender;   // payable 함수를 위한 msg.sender 사용
        membership[msg.sender] = 1; // 자동으로 등록
        balaceDetails[msg.sender].escrow = msg.value;   // payable 함수를 위한 msg.sender, msg.value 사용
    }

    // 컨트랙트의 함수들
    function register() public payable
    {
        address AirlineA = msg.sender;  // payable 함수를 위한 msg.sender 사용
        membership[AirlineA] = 1;
        balaceDetails[AirlineA].escrow = msg.value; // payable 함수를 위한 msg.sender, msg.value 사용
    }

    function unregister(address payable AirlineZ) onlyChairperson public
    {
        membership[AirlineZ] = 0;
        // 출발 항공사에게 에스크로를 반환: 다른 조건들 확인
        AirlineZ.transfer(balaceDetails[AirlineZ].escrow);
        balaceDetails[AirlineZ].escrow = 0;
    }

    function request(address toAirline, uint hashOfDetails) onlyMember public
    {
        if (membership[toAirline] != 1)
        {
            revert();
        }

        balaceDetails[msg.sender].status = 0;
        balaceDetails[msg.sender].hashOfDetails = hashOfDetails;
    }

    function response(address fromAirline, uint hashOfDetails, uint done) onlyMember public
    {
        if (membership[fromAirline] != 1)
        {
            revert();
        }

        balaceDetails[msg.sender].status = done;
        balaceDetails[msg.sender].hashOfDetails = hashOfDetails;
    }

    function settlePayment(address payable toAirline) onlyMember payable public
    {
        address fromAirline = msg.sender;
        uint amt = msg.value;

        balaceDetails[toAirline].escrow = balaceDetails[toAirline].escrow + amt;
        balaceDetails[fromAirline].escrow = balaceDetails[fromAirline].escrow - amt;

        // msg.sender로부터 amt를 차감해 toAirline에게 보냄
        toAirline.transfer(amt);    // 외부 어카운트로 금액을 전송하는 스마트 컨트랙트 어카운트
    }
}
