import React from "react";
import { useState } from "react";
import QrScanner from "./QrScanner";
import "../styles/Global.css";
import "../styles/OpenChannelFormPopup.css";

/*
   --node_key value                         the identity public key of the target node/peer serialized in compressed format
   --connect value                          (optional) the host:port of the target node
   --local_amt value                        the number of satoshis the wallet should commit to the channel (default: 0)
   --base_fee_msat value                    the base fee in milli-satoshis that will be charged for each forwarded HTLC, regardless of payment size (default: 0)
   --fee_rate_ppm value                     the fee rate ppm (parts per million) that will be charged proportionally based on the value of each forwarded HTLC, the lowest possible rate is 0 with a granularity of 0.000001 (millionths) (default: 0)
   --sat_per_vbyte value                    (optional) a manual fee expressed in sat/vbyte that should be used when crafting the transaction (default: 0)
   --remote_csv_delay value                 (optional) the number of blocks we will require our channel counterparty to wait before accessing its funds in case of unilateral close. If this is not set, we will scale the value according to the channel size (default: 0)
   --max_local_csv value                    (optional) the maximum number of blocks that we will allow the remote peer to require we wait before accessing our funds in the case of a unilateral close. (default: 0)

*/

function OpenChannelFormPopup({ onClose }) {

    const [nodeKey, setNodeKey] = useState("");
    const [connect, setConnect] = useState("");
    const [localAmt, setLocalAmt] = useState("");
    const [baseFeeMsat, setBaseFeeMsat] = useState("");
    const [feeRatePpm, setFeeRatePpm] = useState("");
    const [satPerVbyte, setSatPerVbyte] = useState("");
    const [remoteCsvDelay, setRemoteCsvDelay] = useState("");
    const [maxLocalCsv, setMaxLocalCsv] = useState("");

    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // nodekey, connect, localamt are required
        let requestLink = `http://localhost:3001/openchannel?node_key=${nodeKey}&local_amt=${localAmt}`;
        if (connect) {
            requestLink += `&connect=${connect}`;
        }
        if (baseFeeMsat) {
            requestLink += `&base_fee_msat=${baseFeeMsat}`;
        }
        if (feeRatePpm) {
            requestLink += `&fee_rate_ppm=${feeRatePpm}`;
        }
        if (satPerVbyte) {
            requestLink += `&sat_per_vbyte=${satPerVbyte}`;
        }
        if (remoteCsvDelay) {
            requestLink += `&remote_csv_delay=${remoteCsvDelay}`;
        }
        if (maxLocalCsv) {
            requestLink += `&max_local_csv=${maxLocalCsv}`;
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
        <div className="openchannel-popup-container">
            <div className="openchannel-popup-content">
                <div><button className="openchannel-close-icon-popup" onClick={onClose}></button></div>
                {(!response && !error) &&
                    <form onSubmit={handleSubmit} className="openchannel-form">
                        <input type="text" id="nodekey" placeholder="Node key" value={nodeKey} onChange={(e) => setNodeKey(e.target.value)} required className="openchannel-input" />
                        <QrScanner setData={setNodeKey} />
                        <input type="text" id="connect" placeholder="host:port" value={connect} onChange={(e) => setConnect(e.target.value)} className="channel-input" />
                        <input type="number" id="localamt" placeholder="Local amount (sats)" value={localAmt} onChange={(e) => setLocalAmt(e.target.value)} required className="openchannel-input" />
                        <input type="number" id="baseFeeMsat" placeholder="Base fee (msat)" value={baseFeeMsat} onChange={(e) => setBaseFeeMsat(e.target.value)} className="openchannel-input" />
                        <input type="number" id="feeRatePpm" placeholder="Fee rate (ppm)" value={feeRatePpm} onChange={(e) => setFeeRatePpm(e.target.value)} className="openchannel-input" />
                        <input type="number" id="satPerVbyte" placeholder="Sats per vbyte" value={satPerVbyte} onChange={(e) => setSatPerVbyte(e.target.value)} className="openchannel-input" />
                        <input type="number" id="remoteCsvDelay" placeholder="Remote CSV delay" value={remoteCsvDelay} onChange={(e) => setRemoteCsvDelay(e.target.value)} className="openchannel-input" />
                        <input type="number" id="maxLocalCsv" placeholder="Max local CSV" value={maxLocalCsv} onChange={(e) => setMaxLocalCsv(e.target.value)} className="openchannel-input" />
                        <button type="submit" disabled={!nodeKey || !localAmt} className="openchannel-button">Open channel</button>
                    </form>
                }

                {response && response.error && (
                    <p className="openchannel-error">{response.error}: {response.message}</p>
                )}

                {response && response.funding_txid && (
                    <a rel="noreferrer" target="_blank" href={`https://mempool.space/fr/tx/${response.funding_txid}`}>Check funding transaction</a>
                )}

                {error && (
                    <p className="openchannel-error">{error.error}</p>
                )}


            </div>
        </div>
    );
}

export default OpenChannelFormPopup;