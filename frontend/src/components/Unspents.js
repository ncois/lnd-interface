import React from "react";
import { useState, useEffect } from "react";
import ReceiveAddressPopup from "./ReceiveAddressPopup";
import SendFormPopup from "./SendFormPopup";
import Unspent from "./Unspent";
import "../styles/Global.css"
import "../styles/Unspents.css"

function Unspents({ updateStatus, activeComponent }) {
  const [infoUnspents, setInfoUnspents] = useState([]);

  const getInfo = () => {
    fetch("http://localhost:3001/unspents")
      .then((response) => response.json())
      .then((res) => setInfoUnspents(res))
      .catch((error) => {
        console.error(error);
        setInfoUnspents([]);
      });
  };

  const [showReceiveAddress, setShowReceiveAddress] = useState(false);
  const [receiveAddress, setReceiveAddress] = useState('');

  const getNewAddr = async () => {
    try {
      const response = await fetch('http://localhost:3001/newaddress');
      const data = await response.json();
      return data.address;
    } catch (error) {
      console.error(error);
      return "An error occurred.";
    }
  };

  const [showSendForm, setShowSendForm] = useState(false);

  useEffect(() => {
    getInfo();
  }, [updateStatus]);


  useEffect(() => {
    async function fetchData() {
      const address = await getNewAddr();
      setReceiveAddress(address);
    }
    fetchData();
  }, []);

  return (
    <div>
      <div className={`unspents fit`} style={{ display: activeComponent === "Unspents" ? '' : 'none' }}>

        <div>
          <button className="unspents-receive-button" onClick={() => { setShowReceiveAddress(true) }}>Receive</button> <button className="unspents-send-button" onClick={() => { setShowSendForm(true) }}>Send</button>
        </div>

        {infoUnspents.length === 0 ? (
          null
        ) : (
          infoUnspents.map((unspent) => (
            <Unspent key={unspent.outpoint} unspent={unspent} />
          ))
        )}

      </div>

      <div>
        {showReceiveAddress && (
          <div className="overlay">
            <ReceiveAddressPopup
              receiveAddress={receiveAddress}
              setReceiveAddress={setReceiveAddress}
              onClose={() => setShowReceiveAddress(false)}
            />
          </div>
        )}
      </div>

      <div>
        {showSendForm && (
          <div className="overlay">
            <SendFormPopup
              onClose={() => setShowSendForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Unspents;