import React from "react";
import { useState } from "react";
import "../styles/Global.css";
import "../styles/UpdateFeeFormPopup.css";

/*
   --base_fee_msat value    the base fee in milli-satoshis that will be charged for each forwarded HTLC, regardless of payment size (default: 0)
   --fee_rate_ppm value     the fee rate ppm (parts per million) that will be charged proportionally based on the value of each forwarded HTLC, the lowest possible rate is 0 with a granularity of 0.000001 (millionths). Can not be set at the same time as fee_rate. (default: 0)
   --time_lock_delta value  the CLTV delta that will be applied to all forwarded HTLCs (default: 0)
   --min_htlc_msat value    if set, the min HTLC size that will be applied to all forwarded HTLCs. If unset, the min HTLC is left unchanged. (default: 0)
   --max_htlc_msat value    if set, the max HTLC size that will be applied to all forwarded HTLCs. If unset, the max HTLC is left unchanged. (default: 0)
   --chan_point value       The updatefee whose fee policy should be updated, if nil the policies for all updatefees will be updated. Takes the form of: txid:output_index
*/

function UpdateFeeFormPopup({ onClose, channels }) {

    const [baseFeeMsat, setBaseFeeMsat] = useState("");
    const [feeRatePpm, setFeeRatePpm] = useState("");
    const [timeLockDelta, setTimeLockDelta] = useState("");
    const [minHtlcMsat, setMinHtlcMsat] = useState("");
    const [maxHtlcMsat, setMaxHtlcMsat] = useState("");
    const [chanPoint, setChanPoint] = useState("");

    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        // baseFeeMsat, feeRatePpm, timeLockDelta  are required
        let requestLink = `http://localhost:3001/updatefees?base_fee_msat=${baseFeeMsat}&fee_rate_ppm=${feeRatePpm}&time_lock_delta=${timeLockDelta}`;
        if (minHtlcMsat) {
            requestLink += `&min_htlc_msat=${minHtlcMsat}`;
        }
        if (maxHtlcMsat) {
            requestLink += `&max_htlc_msat=${maxHtlcMsat}`;
        }
        if (chanPoint) {
            requestLink += `&chan_point=${chanPoint}`;
        }

        fetch(requestLink)
            .then((response) => response.json())
            .then((data) => {
                setResponse(data) // this is the response from the server : can success or not
            })
            .catch((error) => {
                setError(error); // this is the error while fetching the data
            });
        // onClose();

    };

    return (
        <div className="updatefee-popup-container">
            <div className="updatefee-popup-content">
                <div><button className="updatefee-close-icon-popup" onClick={onClose}></button></div>
                {(!response && !error) &&
                    <form onSubmit={handleSubmit} className="updatefee-form">
                        <input type="number" id="baseFeeMsat" placeholder="Base fee (msat)" value={baseFeeMsat} onChange={(e) => setBaseFeeMsat(e.target.value)} required className="updatefee-input" />
                        <input type="number" id="feeRatePpm" placeholder="Fee rate (ppm)" value={feeRatePpm} onChange={(e) => setFeeRatePpm(e.target.value)} required className="updatefee-input" />
                        <input type="number" id="timeLockDelta" placeholder="Time lock delta" value={timeLockDelta} onChange={(e) => setTimeLockDelta(e.target.value)} required className="updatefee-input" />
                        <input type="number" id="minHtlcMsat" placeholder="Min HTLC (msat)" value={minHtlcMsat} onChange={(e) => setMinHtlcMsat(e.target.value)} className="updatefee-input" />
                        <input type="number" id="maxHtlcMsat" placeholder="Max HTLC (msat)" value={maxHtlcMsat} onChange={(e) => setMaxHtlcMsat(e.target.value)} className="updatefee-input" />
                        <div className="updatefee-sort-controls" >
                            <select id="channeltoupdate" value={chanPoint} onChange={(e) => setChanPoint(e.target.value)}>
                                <option value="">Choose channel</option>
                                {channels.map((channel) => (
                                    <option key={channel.channel_point} value={channel.channel_point}>
                                        {channel.chan_id}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" disabled={!baseFeeMsat || !feeRatePpm || !timeLockDelta} className="updatefee-button">Update fee policy</button>
                    </form>
                }

                {response && response.error && (
                    <p className="updatefee-error">{response.error}: {response.message}</p>
                )}

                {response && response.failed_updates && response.failed_updates?.length === 0 && (
                    <p>Success</p>
                )}

                {response && response.failed_updates && response.failed_updates.length !== 0 && (
                    <div>
                        <p className="updatefee-error">Failed updates:</p>
                        <ul>
                            {response.failed_updates.map((update, index) => (
                                <li key={index}>
                                    <p><strong>Outpoint:</strong> {update.outpoint}</p>
                                    <p><strong>Reason:</strong> {update.reason}</p>
                                    <p><strong>Update error:</strong> {update.update_error}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}



                {error && (
                    <p className="error">{error.error}</p>
                )}


            </div>
        </div>
    );
}

export default UpdateFeeFormPopup;