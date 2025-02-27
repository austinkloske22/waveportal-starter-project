import React, { useEffect, useState, useRef } from "react";
import InputField from './inputfield';

import { ethers } from "ethers";
import "./App.css";
import * as WavePortal from "./utils/WavePortal.json";
import logo from './images/buildspace-icon.png';

const divStyle = {
  display: 'flex',
  alignItems: 'center'
};

const App = () => {

  const waveForm = useRef(null);
  const [currentAccount, setCurrentAccount] = useState("");
  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const [ allWaves, setAllWaves] = useState([]);
  const contractAddress = "0x350d4393832B0864aF6be5C0c05258628A81082f";
  const contractABI = WavePortal.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const form = waveForm.current
        const message = `${form['message'].value}`;

        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  };

  /*
  const watchNewWaves = async () => {
    try {
        //emit NewWave(msg.sender, block.timestamp, _message);

        const { ethereum } = window;
        const provider = new ethers.providers.Web3Provider(ethereum);

        const filter = {
          address: contractAddress,
          topics: [
              // the name of the event, parnetheses containing the data type of each event, no spaces
              utils.id("NewWave(address,address,uint256)")
          ]
        }

        provider.on(filter, () => {
          // do whatever you want here
          // I'm pretty sure this returns a promise, so don't forget to resolve it
        })


      } catch (error) {
        console.log(error);
      }
  };
  */

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    
    checkIfWalletIsConnected();
    getAllWaves();

    let wavePortalContract;
    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };

  }, []);

  return (
    <div className="mainContainer">

      <div className="dataContainer">

        <nav>
            <img src={logo} alt="buildspace-icon" className="nav--icon" />
            <h3 className="nav--logo_text">Buildspace</h3>
            <h4 className="nav--title">Ethereum Smart Contracts </h4>
        </nav>


        <br></br>

        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: "white"
          }} 
          className="description">
          Tell me something zanie!
        </div>

        <div className="newWave" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>

          <form ref={waveForm}>
            <InputField name={'message'}/>
          </form>
          <button className="waveButton" onClick={wave}>
            Send
          </button>
        </div>
        
        {/*
        * If there is no currentAccount render this button
        */}
        
        
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>

  );
}

export default App