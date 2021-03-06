// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

// 전 세계가 공유할 수 있는 큰 정수 카운터
contract Counter
{
    uint value;

    function initialize (uint x) public
    {
        value = x;
    }

    function get() view public returns (uint)
    {
        return value;
    }

    function increment (uint n) public
    {
        value = value + n;
        // return (optional)
    }

    function decrement (uint n) public
    {
        value = value - n;
    }
}
