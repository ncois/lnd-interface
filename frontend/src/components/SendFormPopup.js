import React from "react";
import { useState } from "react";
import QrScanner from "./QrScanner";
import "../styles/Global.css";
import "../styles/SendFormPopup.css";

function SendFormPopup({ onClose }) {

    const [addr, setAddr] = useState("");
    const [amount, setAmount] = useState("");
    const [sweepall, setSweepAll] = useState(false);
    const [satPerByte, setSatPerByte] = useState("");
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        let requestLink
        if (sweepall) {
            requestLink = `http://localhost:3001/onchainsend?addr=${addr}&sweepall=${sweepall}&sat_per_byte=${satPerByte}`
        } else {
            requestLink = `http://localhost:3001/onchainsend?addr=${addr}&amount=${amount}&sat_per_byte=${satPerByte}`
        }

        fetch(requestLink)
            .then((response) => response.json())
            .then((data) => {
                setResponse(data) // this is the response from the server : can success or not
            })
            .catch((error) => {
                setError(error); // this is the error while fetching the data
            });
        // onClose();

    };

    return (
        <div className="send-popup-container">
            <div className="send-popup-content">
                <div><button className="send-close-icon-popup" onClick={onClose}></button></div>
                {(!response && !error) &&
                    <form onSubmit={handleSubmit} className="send-coin-form">
                        <input type="text" id="addr" placeholder="Address" value={addr} onChange={(e) => setAddr(e.target.value)} required className="send-coin-input" />
                        <QrScanner setData={setAddr} />
                        <input type="number" id="amount" placeholder="Amount (sats)" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={sweepall} className="send-coin-input" />
                        <input type="number" id="satPerByte" placeholder="Sats per vbyte" value={satPerByte} onChange={(e) => setSatPerByte(e.target.value)} required className="send-coin-input" />
                        <br />
                        <div> Sweep all:
                            <input type="checkbox" id="sweepall" checked={sweepall} onChange={(e) => {
                                setSweepAll(e.target.checked);
                                setAmount("");
                            }}/>
                        </div>
                        <br />
                        {amount && sweepall && <p className="send-error">Amount and sweepall switch cannot be used together</p>}
                        <button type="submit" disabled={!addr || (!amount && !sweepall) || !satPerByte || (amount && sweepall)} className="send-coin-button">Send onchain</button>
                    </form>
                }

                {response && response.error && (
                    <p className="send-error">{response.error}: {response.message}</p>
                )}

                {response && response.txid && (
                    <a rel="noreferrer" target="_blank" href={`https://mempool.space/fr/tx/${response.txid}`}>Check transaction</a>
                )}

                {error && (
                    <p className="send-error">{error.error}</p>
                )}


            </div>
        </div>
    );
}

export default SendFormPopup;