import React from "react";
import "../styles/Channel.css";
import up from "../assets/up.svg";
import down from "../assets/down.svg";
import tax from "../assets/tax.svg";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";


function NumberDisplay(num) {
  const formattedNumber = parseInt(num).toLocaleString();
  return formattedNumber
}

function BalanceRatioLine({ remoteBalance, capacity }) {
  const remoteBalanceRatio = remoteBalance / capacity;
  const pointPosition = Math.floor(remoteBalanceRatio * 100);

  return (
    <div style={{ position: 'absolute', left: '140px', top: "17px" }} className="channel-balance-ratio-line">
      <div
        className="channel-balance-ratio-point"
        style={{ left: `${pointPosition}%` }}
      />
    </div>
  );
}

function Channel({ channel }) {

  const activeIcon = <FontAwesomeIcon icon={faCircle} className="channel-active-icon" />;
  const inactiveIcon = <FontAwesomeIcon icon={faCircle} className="channel-inactive-icon" />;

  return (
    <div className="channel-container">
      <p className="channel-info">
        <span className="channel-value">{channel?.active ? activeIcon : inactiveIcon}
          Initiated by
          {channel?.is_initiator ? ' me, with ' : ' '}
          <a rel="noreferrer" target="_blank" href={`https://mempool.space/fr/lightning/node/${channel.remote_pubkey}`}>{channel.peer_alias} </a>
          at <a rel="noreferrer" target="_blank" href={`https://mempool.space/fr/tx/${channel.channel_point}`}>this output</a> ({NumberDisplay(channel?.capacity)} satoshis). <a rel="noreferrer" target="_blank" href={`https://mempool.space/fr/lightning/channel/${channel?.chan_id}`}>{channel?.chan_id}</a>
        </span>
      </p>

      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '0px', top: '13px', display: 'inline-block'}} className="channel-value">{NumberDisplay(channel?.local_balance)} sats</span>
        <BalanceRatioLine remoteBalance={channel?.remote_balance || 0} capacity={channel?.capacity || 1} />
        <span style={{ position: 'absolute', left: '480px', top: '13px', display: 'inline-block' }} className="channel-value">{NumberDisplay(channel?.remote_balance)} sats</span>
        <span style={{ position: 'absolute', left: '610px', top: '13px', display: 'inline-block', color: "red" }} className="channel-value"> {channel.unsettled_balance > 0 ? NumberDisplay(channel?.unsettled_balance) + ' sats in HTLC': '' } </span>
      </div>

      <p style={{ position: 'relative' }}>
        <img style={{ position: 'absolute', left: '0px', top: '60px', transform: 'translateY(-5%)' }} width="20px" height="20px" src={up} alt="Up" />
        <span style={{ position: 'absolute', left: '30px', top: '60px' }}>{NumberDisplay(channel?.total_satoshis_sent)} sats</span>
        <img style={{ position: 'absolute', left: '200px', top: '60px', transform: 'translateY(-5%)' }} width="20px" height="20px" src={down} alt="Down" />
        <span style={{ position: 'absolute', left: '230px', top: '60px' }}>{NumberDisplay(channel?.total_satoshis_received)} sats</span>
        <img style={{ position: 'absolute', left: '400px', top: '60px', transform: 'translateY(-5%)' }} width="20px" height="20px" src={tax} alt="Fees" />
        <span style={{ position: 'absolute', left: '430px', top: '60px' }}>{channel?.base_fee_msat} msats + {(channel?.fee_rate * 100).toString().substring(0,5)}%</span>
      </p>

      <p style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '600px', top: '60px' }}>{NumberDisplay(channel?.remote_constraints?.csv_delay)}/{NumberDisplay(channel?.local_constraints?.csv_delay)} blocks</span>
        
      </p>

    </div>
  );
}

export default Channel;