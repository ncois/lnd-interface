import React from "react";
import { useEffect } from "react";
import "../styles/Unspent.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircle } from "@fortawesome/free-solid-svg-icons"


function NumberDisplay(num) {
  const formattedNumber = parseInt(num).toLocaleString();
  return formattedNumber
}

function Unspent({ unspent }) {

  const getConfirmationColor = () => {
    const confirmations = parseInt(unspent?.confirmations);
    if (confirmations > 5) {
      return `rgb(${0}, ${200}, ${0})`
    } else if (confirmations === 0) {
      return `rgb(${200}, ${0}, ${0})`;
    } else {
      const percentage =  (confirmations / 5) * 100
      // set the color between green and orange depending on the number of confirmations
      const r = Math.floor(200 - percentage * 2);
      const g = Math.floor(percentage * 2);
      const b = Math.floor(0);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const color = getConfirmationColor();

  const Icon = <FontAwesomeIcon icon={faCircle} className="unspent-icon" style={{color:color}} />;

  useEffect(() => {
  }, [unspent]);

  return (
    <div className="unspent-container">
      <div>{Icon}{NumberDisplay(unspent?.amount_sat)} sats in <a rel="noreferrer" target="_blank" href={`https://mempool.space/fr/tx/${unspent?.outpoint}`}>this output</a> with {unspent?.confirmations} confirmations ({unspent?.address})</div>
    </div>

  );
}

export default Unspent;