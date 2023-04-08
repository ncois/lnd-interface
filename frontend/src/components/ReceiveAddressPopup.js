import React from "react";
import QRCode from "react-qr-code";
import { useState } from "react";
import "../styles/Global.css";
import "../styles/ReceiveAddressPopup.css";

function ReceiveAddressPopup({ receiveAddress, setReceiveAddress, onClose }) {

    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(receiveAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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

    const handleNewAddressClick = async () => {
        const address = await getNewAddr();
        setReceiveAddress(address);
    };

    return (
        <div className="receiveaddress-popup-container">
            <div className="receiveaddress-popup-content">
                <div><button className="receiveaddress-close-icon-popup" onClick={onClose}></button>  <button className="receiveaddress-refresh-icon-popup" onClick={handleNewAddressClick}></button></div>

                <span className="receiveaddress-address">
                    {receiveAddress === null || receiveAddress === "An error occurred." ? null :
                        <QRCode onClick={handleCopy} style={{cursor:"copy"}} value={receiveAddress} />
                    }
                    <small onClick={handleCopy} style={{cursor:"copy"}} className="receiveaddress-address-text">{receiveAddress ? receiveAddress : "Error: null receiveAddress"}</small>
                    {copied && <div>Copied to clipboard!</div>}
                </span>
            </div>
        </div>
    );
}

export default ReceiveAddressPopup;