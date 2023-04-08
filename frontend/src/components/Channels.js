import React from "react";
import { useState, useEffect } from "react";
import Channel from "./Channel";
import OpenChannelFormPopup from "./OpenChannelFormPopup";
import CloseChannelFormPopup from "./CloseChannelFormPopup";
import UpdateFeeFormPopup from "./UpdateFeeFormPopup";
import RebalanceFormPopup from "./RebalanceFormPopup";
import "../styles/Global.css"
import "../styles/Channels.css"

function Channels({ updateStatus, activeComponent }) {
  const [infoChannels, setInfoChannels] = useState([]);
  const [sortOrder, setSortOrder] = useState("capacity");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showActiveChannels, setShowActiveChannels] = useState(false);


  const [showOpenChannelForm, setShowOpenChannelForm] = useState(false);
  const [showCloseChannelForm, setShowCloseChannelForm] = useState(false);
  const [showUpdateFeeForm, setShowUpdateFeeForm] = useState(false);
  const [showRebalanceForm, setShowRebalanceForm] = useState(false);

  const getInfo = () => {
    fetch("http://localhost:3001/channels")
      .then((response) => response.json())
      .then((res) => setInfoChannels(res))
      .catch((error) => {
        console.error(error);
        setInfoChannels([]);
      });
  };

  useEffect(() => {
    getInfo();
  }, [updateStatus]);

  const handleSortChange = (event) => {
    const newSortOrder = event.target.value;
    if (newSortOrder === sortOrder) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortOrder(newSortOrder);
      setSortDirection("asc");
    }
  };

  const handleToggleActiveChannels = (event) => {
    setShowActiveChannels(event.target.checked);
  };

  const compareChannels = (a, b) => {
    const orderMultiplier = sortDirection === "asc" ? -1 : 1;
    if (sortOrder === "balanceRatio") {
      return orderMultiplier * (a.remote_balance / a.capacity - b.remote_balance / b.capacity);
    } else {
      return orderMultiplier * (b.capacity - a.capacity);
    }
  };

  const sortedChannels = [...infoChannels].sort(compareChannels);

  const filteredChannels = showActiveChannels
    ? sortedChannels.filter((channel) => channel.active)
    : sortedChannels;

  return (
    <div className={`channels fit`} style={{ display: activeComponent === "Channels" ? '' : 'none' }}>

      <div className="channels-sort-controls">
        <label>
          Sort
          <select value={sortOrder} onChange={handleSortChange}>
            <option value="capacity">Capacity</option>
            <option value="balanceRatio">Balance Ratio</option>
          </select>
        </label>
        <label>
          <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={showActiveChannels} onChange={handleToggleActiveChannels} />
          Hide inactive
        </label>
        <button className="channels-openchannel-button" onClick={() => { setShowOpenChannelForm(true) }}>Open</button>
        <button className="channels-closechannel-button" onClick={() => { setShowCloseChannelForm(true) }}>Close</button>
        <button className="channels-updatefee-button" onClick={() => { setShowUpdateFeeForm(true) }}>Fee policy</button>
        <button className="channels-updatefee-button" onClick={() => { setShowRebalanceForm(true) }}>Rebalance</button>
      </div>

      {filteredChannels.length === 0 ? null : (
        filteredChannels.map((channel) => (
          <Channel key={channel.chan_id} channel={channel} />
        ))
      )}

      <div>
        {showOpenChannelForm && (
          <div className="overlay">
            <OpenChannelFormPopup
              onClose={() => setShowOpenChannelForm(false)}
            />
          </div>
        )}
      </div>

      <div>
        {showCloseChannelForm && (
          <div className="overlay">
            <CloseChannelFormPopup
              onClose={() => setShowCloseChannelForm(false)}
              channels={infoChannels}
            />
          </div>
        )}
      </div>

      <div>
        {showUpdateFeeForm && (
          <div className="overlay">
            <UpdateFeeFormPopup
              onClose={() => setShowUpdateFeeForm(false)}
              channels={infoChannels}
            />
          </div>
        )}
      </div>

      <div>
        {showRebalanceForm && (
          <div className="overlay">
            <RebalanceFormPopup
              onClose={() => setShowRebalanceForm(false)}
              channels={infoChannels}
            />
          </div>
        )}
      </div>

    </div>


  );
}

export default Channels;