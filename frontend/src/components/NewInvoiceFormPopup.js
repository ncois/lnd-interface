import React from "react";
import { useState } from "react";
import QRCode from "react-qr-code";
import "../styles/Global.css";
import "../styles/NewInvoiceFormPopup.css";

/*
   --memo value              a description of the payment to attach along with the invoice (default="")
   --expiry value            the invoice's expiry time in seconds. If not specified an expiry of 3600 seconds (1 hour) is implied. (default: 0)
   --amt value               the amt of satoshis in this invoice (default: 0)

*/

function NewInvoiceFormPopup({ onClose }) {

    const [loading, setLoading] = useState(false);

    const [memo, setMemo] = useState("");
    const [expiry, setExpiry] = useState("");
    const [amt, setAmt] = useState("");

    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        setLoading(true);
        // nothing is required
        let requestLink = `http://localhost:3001/newinvoice`;

        // add the ? 
        if (memo || expiry || amt) {
            requestLink += `?`;
        }

        if (memo) {
            requestLink += `&memo="${memo}"`;
        }
        if (expiry) {
            requestLink += `&expiry=${expiry}`;
        }
        if (amt) {
            requestLink += `&amt=${amt}`;
        }

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

    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
      navigator.clipboard.writeText(response.payment_request);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="newinvoice-popup-container">
            <div className="newinvoice-popup-content">
                <div><button className="newinvoice-close-icon-popup" onClick={onClose}></button></div>
                {(!response && !error) &&
                    <div>
                        <form onSubmit={handleSubmit} className="newinvoice-form">
                            <input type="text" id="amt" placeholder="Amount (sats)" value={amt} onChange={(e) => setAmt(e.target.value)} />
                            <input type="text" id="memo" placeholder="Memo" value={memo} onChange={(e) => setMemo(e.target.value)} />
                            <input type="text" id="expiry" placeholder="Expiry (seconds)" value={expiry} onChange={(e) => setExpiry(e.target.value)} />

                            <button type="submit" disabled={false} >{loading ? "Loading..." : "New invoice"}</button>
                        </form>
                    </div>
                }

                {response && response.payment_request && (
                    <div>
                    <QRCode style={{cursor:"copy"}} onClick={handleCopy} value={response.payment_request} />
                    {copied && <div>Copied to clipboard!</div>}
                    </div>
                    
                )}

                {response && response.error && (

                    <div className="newinvoice-error">
                        <p>{response.error}</p>
                        <p>{response.message}</p>
                    </div>
                )}

                {error && (
                    <p className="newinvoice-error">{error.error}</p>
                )}


            </div>
        </div>
    );
}

export default NewInvoiceFormPopup;