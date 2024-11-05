import React, { useState, useEffect } from "react";
import Web3 from "web3";
import AuctionABI from "../abi/auction.json"; // 导入合约 ABI

const App = () => {
    const [account, setAccount] = useState("");
    const [highestBid, setHighestBid] = useState(0);
    const [highestBidder, setHighestBidder] = useState("");
    const [auctionEndTime, setAuctionEndTime] = useState(0);
    const [cooldownTime, setCooldownTime] = useState(0);
    const [bidAmount, setBidAmount] = useState("");
    const [targetPrice, setTargetPrice] = useState(0);
    const [pendingReturns, setPendingReturns] = useState(0);
    const [isAuctionEnded, setIsAuctionEnded] = useState(false);
    const [contract, setContract] = useState(null);

    useEffect(() => {
        loadWeb3();
        loadBlockchainData();
    }, []);

    const loadWeb3 = async () => {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
        }
    };

    const loadBlockchainData = async () => {

      try {
        const web3 = window.web3;
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);
        
        const auctionContractAddress = "0x1d060E3a7E0Ab360c9ae43c4a32322625bd76D40";
        const auction = new web3.eth.Contract(AuctionABI, auctionContractAddress);
        setContract(auction);
    
        const highestBid = await auction.methods.highestBid().call();
        setHighestBid(Number(highestBid)); // 转换为 number 类型
    
        const highestBidder = await auction.methods.highestBidder().call();
        setHighestBidder(highestBidder);
  
        const cooldownTime = await auction.methods.getBidCoolTime(accounts[0]).call();
        setCooldownTime(Number(cooldownTime));
  
        const auctionEndTime = await auction.methods.auctionEndTime().call();
        setAuctionEndTime(Number(auctionEndTime)); // 转换为 number 类型
    
        const pending = await auction.methods.badeValue().call({ from: accounts[0] });
        setPendingReturns(Number(pending)); // 转换为 number 类型
    
        const ended = await auction.methods.ended().call();
        setIsAuctionEnded(Boolean(ended)); // 确保更新为布尔值

        const targetPrice = await auction.methods.targetPrice;
        setTargetPrice(Number(targetPrice))

      } catch (error) {
        console.log(error);
      }

  };
  
  const handleBid = async () => {
      try {
          await contract.methods.bid().send({ from: account, value: Web3.utils.toWei(bidAmount, "ether") });
          loadBlockchainData();
      } catch (error) {
          console.error("Bid failed:", error);
      }
  };

  const handleWithdraw = async () => {
      try {
          await contract.methods.withdraw().send({ from: account });
          loadBlockchainData();
      } catch (error) {
          console.error("Withdraw failed:", error);
      }
  };

  const handleEndAuction = async () => {
      try {
          await contract.methods.endAuction().send({ from: account });
          loadBlockchainData();
      } catch (error) {
          console.error("End Auction failed:", error);
      }
  };

  return (
    <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        width: "100vw",
    }}>
        <div>
            <h1>Auction Demo</h1>
        </div>

        <div style={{ 
            display: "flex", 
            gap: "20px", 
            justifyContent: "center", 
            marginBottom: "10px", 
            flexWrap: "wrap" 
        }}>
            <div style={{ 
                border: "1px solid grey", 
                borderRadius: "20px", 
                padding: "10px", 
                width: "400px" 
            }}>
                <p><strong>Account:</strong> <br /> {account}</p>
                <p><strong>Cooldown Time:</strong> <br /> 
                {cooldownTime > Date.now() / 1000 ? 
                    (<AuctionComponent initialCooldownTime={Math.round((cooldownTime - Date.now() / 1000))} />) : 
                    (<span style={{ color: "#53f273" }}>Available</span>)
                }
                </p>
                <p><strong>Pending Returns:</strong> <br /> {Web3.utils.fromWei(pendingReturns, "ether")} ETH</p>
            </div>

            <div style={{ 
                border: "1px solid grey", 
                borderRadius: "20px", 
                padding: "10px", 
                width: "400px" 
            }}>
                <p><strong>Highest Bid:</strong> <br /> {Web3.utils.fromWei(highestBid, "ether")} ETH</p>
                <p><strong>Target Bid:</strong> <br /> {Web3.utils.fromWei(targetPrice, "ether")} ETH</p>
                <p><strong>Highest Bidder:</strong> <br /> {highestBidder}</p>
                <p><strong>Auction End Time:</strong> <br /> {new Date(auctionEndTime * 1000).toLocaleString()}</p>
                <p><strong>Auction Status:</strong> <br /> 
                    {isAuctionEnded ? 
                        (<span style={{ color: "red" }}>Ended</span>) : 
                        (<span style={{ color: "#53f273" }}>Continuous</span>)
                    }
                </p>
            </div>
        </div>

        <div style={{ marginBottom: "10px", display: "flex", justifyContent: "center", gap: "10px" }}>
            <input
                type="text"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder=" Enter bid amount in ETH"
                style={{ height: "35px", borderRadius: "10px" }}
            />
            <button onClick={handleBid}>Bid</button>
        </div>

        <div style={{ marginBottom: "10px", display: "flex", justifyContent: "center" }}>
            <button onClick={handleWithdraw}>Withdraw Returns</button>
        </div>

        {isAuctionEnded ? (
            <p>The auction has ended.</p>
        ) : (
            <div>
                <button onClick={handleEndAuction}>End Auction</button>
            </div>
        )}
    </div>
  );
};

export default App;
