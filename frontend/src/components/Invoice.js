import React from "react";
import QRCode from "react-qr-code"
import { useEffect, useState } from "react"
import "../styles/Invoice.css"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircle } from "@fortawesome/free-solid-svg-icons"


function NumberDisplay(num) {
  const formattedNumber = parseInt(num).toLocaleString();
  return formattedNumber
}

function coolDateFormat(hour, minute, second) {
  const res = ((parseInt((hour)) > 0) ? parseInt((hour)) + ' hour(s)' : '') + (((parseInt((hour)) === 0) && (parseInt(minute) > 0)) ? parseInt(minute) + ' minute(s)' : '') + (((parseInt(hour) === 0) && (parseInt(minute) === 0)) ? parseInt(second) + ' seconds' : '')
  return res
}

function Invoice({ invoice }) {

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(invoice?.payment_request);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeIcon = <FontAwesomeIcon icon={faCircle} className="invoice-active-icon" />;
  const inactiveIcon = <FontAwesomeIcon icon={faCircle} className="invoice-inactive-icon" />;
  const waitingIcon = <FontAwesomeIcon icon={faCircle} className="invoice-waiting-icon" />;

  const [showQRCode, setShowQRCode] = useState(false);

  const toggleQRCode = () => {
    setShowQRCode(!showQRCode);
  };

  useEffect(() => {
  }, [invoice]);

  return (
    <div className="invoice-container">

      <div>{invoice?.settled ?
        <div>
          <div>{activeIcon}{NumberDisplay(invoice.amt_paid_sat)} sats {invoice.memo ? "(" + invoice.memo + ")" : null} received on {new Date(invoice.settle_date * 1000).toLocaleString()} after {coolDateFormat((invoice.settle_date - invoice.creation_date) / 3600, (invoice.settle_date - invoice.creation_date) % 3600 / 60, (invoice.settle_date - invoice.creation_date) % 60)}</div>
        </div> :
        <div>
          <div>{invoice.state === "CANCELED" ?
            <div>
              {inactiveIcon}{invoice.state} {invoice.memo ? "(" + invoice.memo + ")" : null} on {new Date((parseInt(invoice.creation_date) + parseInt(invoice.expiry)) * 1000).toLocaleString()} after {coolDateFormat(invoice.expiry / 3600, invoice.expiry % 3600 / 60, invoice.expiry % 60)}
            </div> :
            null}
          </div>
          <div>{invoice.state === "OPEN" ?
            <div>
              {waitingIcon}{invoice.state} {invoice.memo ? "(" + invoice.memo + ")" : null} since {new Date((invoice.creation_date) * 1000).toLocaleString()}, for {coolDateFormat(invoice.expiry / 3600, invoice.expiry % 3600 / 60, invoice.expiry % 60)} until {new Date((parseInt(invoice.creation_date) + parseInt(invoice.expiry)) * 1000).toLocaleString()}
              {!showQRCode ? <button className="invoice-button" onClick={toggleQRCode}>Invoice</button> : null}
              {showQRCode && (
                <div className="invoice-popup-container">
                  <div className="invoice-popup-content">
                    <div><button className="invoice-close-icon-popup" onClick={toggleQRCode}></button></div>
                    <QRCode style={{width: "200px", cursor:"copy"}} onClick={handleCopy} value={invoice?.payment_request}/>
                    {copied && <div>Copied to clipboard!</div>}
                  </div>
                </div>
              )}
            </div> :
            null}
          </div>
        </div>}
      </div>
    </div>
  );
}

export default Invoice;