import React from "react";
import { useState, useEffect } from "react";
import Invoice from "./Invoice";
import NewInvoiceFormPopup from "./NewInvoiceFormPopup";
import "../styles/Global.css"
import "../styles/Invoices.css"

function Invoices({ updateStatus, activeComponent }) {
  const [infoInvoices, setinfoInvoices] = useState([]);
  const [numToShow, setNumToShow] = useState(10);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  const getInfo = () => {
    fetch("http://localhost:3001/invoices")
      .then((response) => response.json())
      .then((res) => setinfoInvoices(res))
      .catch((error) => {
        console.error(error);
        setinfoInvoices([]);
      });
  };

  const handleNumToShowChange = (e) => {
    setNumToShow(parseInt(e.target.value));
  }

  useEffect(() => {
    getInfo();
  }, [updateStatus]);

  return (
    <div className={`invoices fit`} style={{ display: activeComponent === "Invoices" ? '' : 'none' }}>
      <div className="invoices-sort-controls">
        <label htmlFor="numToShow">Show the last</label>
        <select name="numToShow" id="numToShow" value={numToShow} onChange={handleNumToShowChange}>
          <option value="10">10</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>

        <button className="invoices-button" onClick={() => { setShowInvoiceForm(true) }}>New invoice</button>

      </div>
      {infoInvoices.length === 0 ? (
        null
      ) : (
        infoInvoices.slice(-numToShow).reverse().map((invoice) => (
          <Invoice key={invoice.payment_request} invoice={invoice} />
        ))
      )}

      <div>
        {showInvoiceForm && (
          <div className="overlay">
            <NewInvoiceFormPopup
              onClose={() => setShowInvoiceForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Invoices;