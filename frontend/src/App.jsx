import React, { useState, useEffect } from "react";
import Web3 from "web3";
import AuctionABI from "../abi/auction.json"; // 导入合约 ABI
import CountDown from "./CountDown";

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
    const [isEmergencyStop, setIsEmergencyStop] = useState(false)

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
            
            const auctionContractAddress = "0xA3Cc687f4100990D1bc074FA43B81640148Df934";
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

            const targetPrice = await auction.methods.targetPrice().call();
            setTargetPrice(Number(targetPrice))

            const isEmergencyStop = await auction.methods.isEmergencyStop().call();
            setIsEmergencyStop(isEmergencyStop);

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

    const handleEmergencyStop = async () => {
        try {
            await contract.methods.emergencyStop().send({ from: account});
            loadBlockchainData();
        } catch (error) {
            console.log("Emergency Stop failed", error);
        }
    }

    const handleResumeAuction = async () => {
        try {
            await contract.methods.resumeAuction().send({ from: account});
            loadBlockchainData();
        } catch (error) {
            console.log("Resume Auction failed", error);
        }
    }

    return (
        <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            width: "100vw",
        }}>

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
                    <p><strong>My Account:</strong> <br /> {account}</p>
                    <p><strong>Cooldown Time:</strong> <br /> 
                    {cooldownTime > Date.now() / 1000 ? 
                        (<CountDown initialCooldownTime={Math.round((cooldownTime - Date.now() / 1000))} />) : 
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
                    {
                        isEmergencyStop ? (
                            <span style={{ color: "orange" }}>Stopped</span>
                        ) : ( 
                            (Date.now() / 1000) > auctionEndTime ? 
                                (<span style={{ color: "red" }}>Ended</span>) : 
                                (<span style={{ color: "#53f273" }}>Continuous</span>)
                        )
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
                    style={{ height: "35px", borderRadius: "10px", borderColor: "white" }}
                />
                <button 
                onClick={handleBid}
                style={{
                    borderColor: "white",
                    cursor: "pointer",
                    transition: "background-color 0.3s, border-color 0.3s", 
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#888888"}
                onMouseOut={(e) => e.target.style.backgroundColor = ""}
                >
                    Bid
                </button>
            </div>

            <div style={{ marginBottom: "10px", display: "flex", justifyContent: "center" }}>
                <button 
                onClick={handleWithdraw} 
                style={{
                    borderColor: "white",
                    cursor: "pointer",
                    transition: "background-color 0.3s, border-color 0.3s", 
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#888888"}
                onMouseOut={(e) => e.target.style.backgroundColor = ""}
                >

                    Withdraw Returns
                </button>
            </div>

            {isAuctionEnded ? (
                <p>The income has been settled.</p>
            ) : (
                <>
                    <div>
                        <button 
                            onClick={handleEndAuction}
                            style={{
                                marginBottom: "10px", 
                                borderColor: "white",
                                cursor: "pointer",
                                transition: "background-color 0.3s, border-color 0.3s",
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "#888888"}
                            onMouseOut={(e) => e.target.style.backgroundColor = ""}
                        >
                            Settle 
                        </button>
                    </div>
                </>
            )}

            {
                (Date.now() / 1000) > auctionEndTime ? (
                    <></>
                ) : (
                    <div>
                        <button 
                            onClick={handleEmergencyStop}
                            style={{
                                marginRight: "5px",
                                borderColor: "white",
                                cursor: "pointer",
                                transition: "background-color 0.3s, border-color 0.3s",
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "#888888"} 
                            onMouseOut={(e) => e.target.style.backgroundColor = ""}
                        >
                            Emergency Stop
                        </button>
                        <button 
                            onClick={handleResumeAuction}
                            style={{
                                borderColor: "white",
                                cursor: "pointer",
                                transition: "background-color 0.3s, border-color 0.3s",
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "#888888"} 
                            onMouseOut={(e) => e.target.style.backgroundColor = ""}
                        >
                            Resume Auction
                        </button>
                    </div>
                )
            }


            
        </div>
    );
};

export default App;
