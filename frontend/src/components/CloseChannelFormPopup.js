import React from "react";
import { useState } from "react";
import "../styles/Global.css";
import "../styles/CloseChannelFormPopup.css";

/*
   --chan_point value     (optional) the channel point. If set, funding_txid and output_index flags and positional arguments will be ignored
   --force                attempt an uncooperative closure
   --sat_per_vbyte value  (optional) a manual fee expressed in sat/vbyte that should be used when crafting the transaction (default: 0)
*/

function CloseChannelFormPopup({ onClose, channels }) {

    const [chanPoint, setChanPoint] = useState("");
    const [force, setForce] = useState(false);
    const [satPerVbyte, setSatPerVbyte] = useState("");

    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        // chanPoint is required
        let requestLink = `http://localhost:3001/closechannel?chan_point=${chanPoint}`;
        if (force) {
            requestLink += `&force=${force}`;
        }
        if (satPerVbyte) {
            requestLink += `&sat_per_vbyte=${satPerVbyte}`;
        }

        fetch(requestLink)
            .then((response) => response.json())
            .then((data) => {
                setResponse(data) // this is the response from the server : can success or not
                console.log(data);
            })
            .catch((error) => {
                setError(error); // this is the error while fetching the data
            });
        // onClose();

    };

    return (
        <div className="closechannelform-popup-container">
            <div className="closechannelform-popup-content">
                <div><button className="closechannelform-close-icon-popup" onClick={onClose}></button></div>
                {(!response && !error) &&
                    <form onSubmit={handleSubmit} className="closechannel-form">
                        <div className="closechannelform-sort-controls" >
                            <select id="channeltoclose" value={chanPoint} onChange={(e) => setChanPoint(e.target.value)}>
                                <option value="">Channel to close</option>
                                {channels.map((channel) => (
                                    <option key={channel.channel_point} value={channel.channel_point}>
                                        {channel.chan_id}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <input type="number" id="satPerVbyte" placeholder="Sats per vbyte" value={satPerVbyte} onChange={(e) => setSatPerVbyte(e.target.value)} className="closechannelform-input" />
                        <div> Force close:
                            <input type="checkbox" id="force" checked={force} onChange={(e) => {
                                setForce(e.target.checked);
                            }}/>
                        </div>
                        <br></br>
                        <button type="submit" disabled={!chanPoint} className="closechannelform-button">Close channel</button>
                    </form>
                }

                {response && response.error && (
                    <p className="closechannelform-error">{response.error}: {response.message}</p>
                )}

                {response && response.closing_txid && (
                    <a rel="noreferrer" target="_blank" href={`https://mempool.space/fr/tx/${response.closing_txid}`}>Check closing transaction</a>
                )}

                {error && (
                    <p className="closechannelform-error">{error.error}</p>
                )}


            </div>
        </div>
    );
}

export default CloseChannelFormPopup;