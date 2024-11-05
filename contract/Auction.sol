// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract Auction {
    address payable public beneficiary;
    uint public auctionEndTime;
    address public highestBidder;
    uint public highestBid;
    mapping (address => uint) pendingReturns;
    bool ended;
    //时间加权出价奖励机制、拍卖终局延长起始时间
    uint public weightStart;
    //储存竞拍冷却时间
    mapping (address => uint) bidCoolTime;

    event HighestBidIncreased(address bidder, uint amount);
    event AuctionEnded(address winner, uint amount);

    constructor(uint _biddingTime, address payable _beneficiary) {
        beneficiary = _beneficiary;
        auctionEndTime = block.timestamp + _biddingTime;
        weightStart = auctionEndTime - 300;
    }

    function bid() public payable  {
        require(block.timestamp <= auctionEndTime, "Auction ended!");
        require(msg.value > highestBid, "Need a higher bid");
        require(block.timestamp > bidCoolTime[msg.sender], "Bidding cooling down");

        if (highestBid >= 0) {
            pendingReturns[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;

        //时间加权出价奖励、拍卖终局延长机制
        if (block.timestamp > weightStart) {
            highestBid = (msg.value * 105) / 100;
            auctionEndTime += 300;
            weightStart += 300;
        } else {
            highestBid = msg.value;
        }
        //记录竞拍冷却时间
        bidCoolTime[msg.sender] = block.timestamp + 30;

        emit HighestBidIncreased(msg.sender, msg.value);
    }

    function withdraw() public returns (bool) {
        uint amount = pendingReturns[msg.sender];
        if (amount > 0) {
            pendingReturns[msg.sender] = 0;
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "Transfer failed");
        }
        return true;
    }

    function endAuction() public  {
        require(block.timestamp >= auctionEndTime, "The auction is not over yet");
        require(!ended, "Already received payment");

        ended = true;
        emit AuctionEnded(highestBidder, highestBid);
        (bool success, ) = beneficiary.call{value: highestBid}("");
        require(success, "Transfer failed");
    }

    function badeValue() public view returns (uint) {
        return pendingReturns[msg.sender];
    }

}