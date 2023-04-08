import React from "react";
import { useState, useEffect } from "react";
import Payment from "./Payment";
import NewPaymentFormPopup from "./NewPaymentFormPopup";
import "../styles/Global.css"
import "../styles/Payments.css"

function Payments({ updateStatus, setUpdateStatus, isLoading, setIsLoading, activeComponent }) {
  const [infoPayments, setinfoPayments] = useState([]);
  const [numToShow, setNumToShow] = useState(10);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);

  const getInfo = () => {
    fetch("http://localhost:3001/payments")
      .then((response) => response.json())
      .then((res) => setinfoPayments(res))
      .catch((error) => {
        console.error(error);
        setinfoPayments([]);
      });
  };

  const handleNumToShowChange = (e) => {
    setNumToShow(parseInt(e.target.value));
  }

  useEffect(() => {
    getInfo();
  }, [updateStatus]);

  const handleRefresh = (should_update_payments) => {
    setIsLoading(true);
    fetch(`http://localhost:3001/?payments=${should_update_payments || false}`)
      .then(response => response.json())
      .then(updateStatus => setUpdateStatus(updateStatus))
      .catch(error => {
        console.error(error);
        setUpdateStatus(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className={`payments fit`} style={{ display: activeComponent === "Payments" ? '' : 'none' }}>
      <div className="payments-sort-controls">
        <label htmlFor="numToShow">Show the last</label>
        <select name="numToShow" id="numToShow" value={numToShow} onChange={handleNumToShowChange}>
          <option value="10">10</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <button className="payments-button" onClick={() => { setShowNewPaymentForm(true) }}>Pay</button>
        <button className={`payments-hard-refresh-button ${isLoading ? 'payments-loading' : ''}`} onClick={() => handleRefresh(true)} disabled={isLoading}>
          {<div className={` ${isLoading ? 'banner-spinner' : 'banner-refresh-icon'}`}></div>}
        </button>
      </div>
      {infoPayments.length === 0 ? (
        null
      ) : (

        infoPayments.slice(0, numToShow).map((payment) => (
          <Payment key={payment.payment_request} payment={payment} />
        ))
      )}

      <div>
        {showNewPaymentForm && (
          <div className="overlay">
            <NewPaymentFormPopup
              onClose={() => setShowNewPaymentForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Payments;