// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract Auction {
    address payable public beneficiary;
    uint public auctionEndTime;
    address public highestBidder;
    uint public highestBid;
    mapping (address => uint) pendingReturns;
    bool public ended;
    
    // 时间加权出价奖励机制、拍卖终局延长起始时间
    uint public weightStart;

    // 储存竞拍冷却时间
    mapping (address => uint) bidCoolTime;
    // 每次出价必须高于当前最高出价加上一个增量
    uint public bidIncrement;
    // 当出价达到预设的目标价格时，拍卖提前结束
    uint public targetPrice;
    // 延长拍卖的总时间有一个最大限制，防止无限延长
    uint public maxEndTime;
    // 管理员可以暂停或恢复拍卖
    bool public isEmergencyStop;
    address public admin;

    event HighestBidIncreased(address bidder, uint amount);
    event AuctionEnded(address winner, uint amount);
    event AuctionStopped();

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor(
        uint _biddingTime,
        address payable _beneficiary,
        uint _bidIncrement,
        uint _targetPrice,
        uint _maxEndTime
    ) {
        admin = msg.sender;
        beneficiary = _beneficiary;
        auctionEndTime = block.timestamp + _biddingTime;
        bidIncrement = _bidIncrement;
        targetPrice = _targetPrice;
        maxEndTime = block.timestamp + _maxEndTime;
        weightStart = auctionEndTime - 300;
    }

    function bid() public payable  {
        require(!isEmergencyStop, "Auction is paused");
        require(block.timestamp <= auctionEndTime, "Auction ended");
        require(msg.value >= highestBid + bidIncrement, "Bid not high enough");
        require(block.timestamp > bidCoolTime[msg.sender], "Bidding cooling down");

        // 如果有当前最高出价者，退还其出价
        if (highestBid > 0) {
            pendingReturns[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;

        // 时间加权出价奖励、拍卖终局延长机制
        if (block.timestamp > weightStart && auctionEndTime < maxEndTime) {
            highestBid = (msg.value * 105) / 100;
            auctionEndTime += 300;
            weightStart += 300;
        } else {
            highestBid = msg.value;
        }

        // 如果出价达到了目标价格，拍卖提前结束
        if (highestBid >= targetPrice) {
            endAuction();
            return;
        }

        // 记录竞拍冷却时间
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
        require(block.timestamp >= auctionEndTime, "Auction not over");
        require(!ended, "Auction already ended");

        ended = true;
        emit AuctionEnded(highestBidder, highestBid);
        
        (bool success, ) = beneficiary.call{value: highestBid}("");
        require(success, "Transfer failed");
    }

    // 紧急停止拍卖
    function emergencyStop() public onlyAdmin {
        isEmergencyStop = true;
        emit AuctionStopped();
    }

    // 恢复拍卖
    function resumeAuction() public onlyAdmin {
        isEmergencyStop = false;
    }

    // 返回用户的待提取余额
    function badeValue() public view returns (uint) {
        return pendingReturns[msg.sender];
    }

    // 查询出价冷却时间
    function getBidCoolTime(address adr) public view returns (uint) {
        return bidCoolTime[adr];
    }
}