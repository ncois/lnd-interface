import React from "react";
import { useEffect } from "react";
import "../styles/Payment.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircle } from "@fortawesome/free-solid-svg-icons"


function NumberDisplay(num) {
  const formattedNumber = parseInt(num).toLocaleString();
  return formattedNumber
}

function FloatDisplay(num) {
  const formattedNumber = parseFloat(num).toLocaleString();
  return formattedNumber
}

function coolDateFormat(hour, minute, second) {
  const res = ((parseInt((hour)) > 0) ? parseInt((hour)) + ' hour(s)' : '') + (((parseInt((hour)) === 0) && (parseInt(minute) > 0)) ? parseInt(minute) + ' minute(s)' : '') + (((parseInt(hour) === 0) && (parseInt(minute) === 0)) ? parseInt(second) + ' seconds' : '')
  return res
}

function Payment({ payment }) {

  const activeIcon = <FontAwesomeIcon icon={faCircle} className="payment-active-icon" />;
  const inactiveIcon = <FontAwesomeIcon icon={faCircle} className="payment-inactive-icon" />;

  useEffect(() => {
  }, [payment]);

  return (
    <div className="payment-container">

      <div>{payment?.status === "SUCCEEDED" ?
        <div>
          <div>{activeIcon}{NumberDisplay(payment.value_sat)} sats paid on {new Date(payment.resolve_time/1e6).toLocaleString()}. It took {coolDateFormat(((payment.resolve_time - payment.attempt_time) / 1e9) / 3600, ((payment.resolve_time - payment.attempt_time) / 1e9) % 3600 / 60, ((payment.resolve_time - payment.attempt_time) / 1e9) % 60)} ({NumberDisplay(payment.nb_hops)} hops), for {FloatDisplay(payment.fee_msat/1000)} sats</div>
          {payment?.destination === '' ? '' : <div style={{marginLeft:"25px"}}>to <a rel="noreferrer" target="_blank" href={`https://mempool.space/fr/lightning/node/${payment?.destination}`}>{payment.destination.substring(0, 8) + "..." + payment.destination.substring(payment.destination.length - 8)}</a> {payment?.memo === '' ? '' : `for ${payment.memo}`}</div>}
        </div> : null}
      </div>

      <div>{payment?.failure_reason !== "FAILURE_REASON_NONE" ?
        <div>
          <div>{inactiveIcon}{NumberDisplay(payment.value_sat)} sats failed to be paid on {new Date(payment.attempt_time/1e6).toLocaleString()}: {payment?.failure_reason}</div>
        </div> : null}
      </div>
    </div>
  );
}

export default Payment;