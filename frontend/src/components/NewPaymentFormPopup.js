import React from "react";
import { useState, useEffect } from "react";
import QrScanner from "./QrScanner";
import "../styles/Global.css";
import "../styles/NewPaymentFormPopup.css";

/*
   --pay_req value              a zpay32 encoded payment request to fulfill
   --fee_limit value            maximum fee allowed in satoshis when sending the payment (default: 0)
   --outgoing_chan_id value     short channel id of the outgoing channel to use for the first hop of the payment (default: 0)
   --amt value                  (optional) number of satoshis to fulfill the invoice (default: 0)

*/

function NumberDisplay(num) {
    const formattedNumber = parseInt(num).toLocaleString();
    return formattedNumber
}

function NewPaymentFormPopup({ onClose }) {

    const [infoChannels, setInfoChannels] = useState([]);
    const [loading, setLoading] = useState(false);

    const getInfo = () => {
        fetch("http://localhost:3001/channels")
            .then((response) => response.json())
            .then((res) => setInfoChannels(res))
            .catch((error) => {
                console.error(error);
                setInfoChannels([]);
            })
    };

    useEffect(() => {
        getInfo();
    }, []);


    const [payReq, setPayReq] = useState("");
    const [feeLimit, setFeeLimit] = useState("");
    const [outgoingChanId, setOutgoingChanId] = useState("");
    const [amt, setAmt] = useState("");

    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        setLoading(true);
        setCountdownTime(60);
        setCountdownMessage("Paying...");
        let requestLink = `http://localhost:3001/pay?pay_req=${payReq}`;
        if (feeLimit) requestLink += `&fee_limit=${feeLimit}`;
        if (outgoingChanId) requestLink += `&outgoing_chan_id=${outgoingChanId}`;
        if (amt) requestLink += `&amt=${amt}`;

        fetch(requestLink)
            .then((response) => response.json())
            .then((data) => {
                setResponse(data) // this is the response from the server : can success or not
            })
            .catch((error) => {
                setError(error); // this is the error while fetching the data
            })
            .finally(() => {
                setLoading(false);
            });
        // onClose();

    };

    const [countdownMessage, setCountdownMessage] = useState("");
    const [countdownTime, setCountdownTime] = useState(0);

    const setDotsCount = (countdownTime) => {
        const dotsToShow = 3 - countdownTime % 3;
        const dotsString = ".".repeat(dotsToShow).padStart(3, " ").split("").reverse().join("");
        setCountdownMessage(`Paying${dotsString} ${countdownTime}`);
    };

    useEffect(() => {
        let intervalId;

        if (loading && countdownTime > 0) {
            setDotsCount(countdownTime);
            intervalId = setInterval(() => {
                setDotsCount(countdownTime - 1);
                setCountdownTime(countdownTime - 1);
            }, 1000);
        } else {
            setCountdownMessage("Almost there...");
        }

        return () => clearInterval(intervalId);
    }, [loading, countdownTime]);




    return (
        <div className="newpayment-popup-container">
            <div className="newpayment-popup-content">
                <div><button className="newpayment-close-icon-popup" onClick={onClose}></button></div>
                {(!response && !error) &&
                    <form onSubmit={handleSubmit} className="newpayment-form">
                        <input type="text" id="payrequest" placeholder="Payment request" value={payReq} onChange={(e) => setPayReq(e.target.value)} required />
                        <QrScanner setData={setPayReq} />
                        <input type="number" id="feelimit" placeholder="Fee limit (sats)" value={feeLimit} onChange={(e) => setFeeLimit(e.target.value)} />
                        <input type="number" id="amount" placeholder="Amount" value={amt} onChange={(e) => setAmt(e.target.value)} />
                        <div className="newpayment-sort-controls" >
                            <select id="outgoingchannel" value={outgoingChanId} onChange={(e) => setOutgoingChanId(e.target.value)}>
                                <option value="">Channel to use</option>
                                {infoChannels.sort((a, b) => b.local_balance - a.local_balance).map((channel) => (
                                    <option key={channel.chan_id} value={channel.chan_id}>
                                        {NumberDisplay(channel.local_balance)} local satoshis
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" disabled={!payReq} className="newpayment-button">
                            {loading ? countdownMessage : "Pay"}
                        </button>
                    </form>
                }

                {response && response.status && (
                    <p>{response.status} sending {response.value_sat} sats, for {response.fee_sat} sats of fees</p>
                )}

                {response && response.error && (
                    <div className="newpayment-error">
                        <p>{response.error}</p>
                        <p>{response.message}</p>
                    </div>
                )}

                {error && (
                    <p className="newpayment-error">{error.error}</p>
                )}


            </div>
        </div>
    );
}

export default NewPaymentFormPopup;