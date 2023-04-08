import React from "react";
import { useState, useEffect } from "react";
import "../styles/Global.css";
import "../styles/RebalanceFormPopup.css";

/*
    Rebalance channel. Example: lncli payinvoice --amt 100000 --timeout 5m0s --outgoing_chan_id 857801588729577473 --allow_self_payment --last_hop 0303a518845db99994783f606e6629e705cfaf072e5ce9a4d8bf9e249de4fbd019 [invoice]
*/

function NumberDisplayLocal(num, isOutgoing, isIncoming, amt) {
    if (amt) {
        if (isOutgoing) {
            num = (parseInt(num) - parseInt(amt)).toString()
        } else if (isIncoming) {
            num = (parseInt(num) + parseInt(amt)).toString()
        }
    }
    const formattedNumber = parseInt(num).toLocaleString();
    return formattedNumber
}

function NumberDisplayRemote(num, isOutgoing, isIncoming, amt) {
    if (amt) {
        if (isOutgoing) {
            num = (parseInt(num) + parseInt(amt)).toString()
        } else if (isIncoming) {
            num = (parseInt(num) - parseInt(amt)).toString()
        }
    }
    const formattedNumber = parseInt(num).toLocaleString();
    return formattedNumber
}

function BalanceRatioLine({ remoteBalance, capacity, isOutgoing, isIncoming, amt }) {
    const [pointPosition, setPointPosition] = useState(Math.floor((remoteBalance / capacity) * 100));

    useEffect(() => {
        if (amt) {
            if (isOutgoing) {
                remoteBalance = (parseInt(remoteBalance) + parseInt(amt)).toString()
            }
            if (isIncoming) {
                remoteBalance = (parseInt(remoteBalance) - parseInt(amt)).toString()
            }
        }
        setPointPosition(Math.floor((remoteBalance / capacity) * 100));
    }, [amt]);

    return (
        <div
            className={`rebalance-ratio-line ${!isOutgoing && !isIncoming ? 'rebalance-ratio-line-neutral' : ''
                }`}
        >
            <div
                className="rebalance-ratio-point"
                style={{ left: `${pointPosition}%` }}
            >
                {isOutgoing && <div className="rebalance-ratio-arrow-outgoing"></div>}
                {isIncoming && <div className="rebalance-ratio-arrow-incoming"></div>}
            </div>
        </div>
    );
}

function RebalanceFormPopup({ onClose, channels }) {

    const [amt, setAmt] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [timeout, setTimeout] = useState("1m0s");
    const [outgoing_chan_id, setOutgoing_chan_id] = useState("");
    const [last_hop, setLast_hop] = useState("");

    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const [loading, setLoading] = useState(false);

    const handleChooseChannel = (channelId) => {
        setOutgoing_chan_id(channelId);
        console.log("outgoing channel id:" + channelId);
    }

    const handleChooseLastHop = (lastHop) => {
        // get the nodeid of the outgoing channel, if defined
        let outgoingNode = channels.find((channel) => channel.chan_id === outgoing_chan_id);
        console.log("outgoing node id:" + outgoingNode?.remote_pubkey)

        if (lastHop === outgoingNode?.remote_pubkey) {
            console.log("last hop is the node we are sending the payment to");
        } else {
            setMaxAmountDependingOnChannels(outgoing_chan_id, lastHop)
            setLast_hop(lastHop);
            console.log("incoming node id:" + lastHop);
        }
    }

    const setMaxAmountDependingOnChannels = (channelId, lastHop) => {
        let local_balance_of_outgoing_channel = parseInt(channels.find((channel) => channel.chan_id === channelId)?.local_balance);
        let remote_balance_of_incoming_channel = parseInt(channels.find((channel) => channel.remote_pubkey === lastHop)?.remote_balance);
        let maxAmount = Math.min(local_balance_of_outgoing_channel, remote_balance_of_incoming_channel);
        let capacity_of_outgoing_channel = parseInt(channels.find((channel) => channel.chan_id === channelId)?.capacity);
        let capacity_of_incoming_channel = parseInt(channels.find((channel) => channel.remote_pubkey === lastHop)?.capacity);
        // we substract max(capacities)/100
        setMaxAmount(Math.max((maxAmount - (Math.max(capacity_of_outgoing_channel, capacity_of_incoming_channel) / 100)), 0).toString());
    }

    const handleChooseAmount = (amount) => {
        if (parseInt(amount) > parseInt(maxAmount)) {
            setAmt(maxAmount.toString());
        } else if (parseInt(amount) < 0) {
            setAmt("0");
        }
        else {
            setAmt(amount.toString());
        }
    }

    const AutomaticAmount = (remoteBalanceOutgoing, remoteBalanceIncoming, capacityOutgoing, capacityIncoming) => {
        // we need the remote balance ratio of the outgoing channel and the remote balance ratio of the incoming channel to be equal
        if (parseInt((remoteBalanceIncoming * capacityOutgoing - remoteBalanceOutgoing * capacityIncoming) / (capacityOutgoing + capacityIncoming)) > 0) {
            handleChooseAmount((parseInt((remoteBalanceIncoming * capacityOutgoing - remoteBalanceOutgoing * capacityIncoming) / (capacityOutgoing + capacityIncoming))).toString())
        } else {
            handleChooseAmount("0");
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true)
        // get the number of seconds to wait with timeout
        let timeoutSeconds = parseInt(timeout.split("m")[0]) * 60 + parseInt(timeout.split("m")[1].split("s")[0])
        setCountdownTime(timeoutSeconds);

        // get the invoice from my node

        fetch("http://localhost:3001/newinvoice").then((response) => response.json()).then((data) => {
            if (data.payment_request[0] === "l") {
                console.log("invoice:" + data.payment_request);
                let requestLink = "http://localhost:3001/rebalance?amt=" + amt + "&timeout=" + timeout + "&outgoing_chan_id=" + outgoing_chan_id + "&last_hop=" + last_hop + "&invoice=" + data.payment_request;
                fetch(requestLink)
                    .then((response) => response.json())
                    .then((data) => {
                        setResponse(data) // this is the response from the server : can success or not
                        console.log(data);
                    })
                    .catch((error) => {
                        setError(error); // this is the error while fetching the data
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            }
        }).catch((error) => {
            setError(error); // this is the error while fetching the invoice
        })
    }

    const [countdownMessage, setCountdownMessage] = useState("");
    const [countdownTime, setCountdownTime] = useState(0);

    const setDotsCount = (countdownTime) => {
        const dotsToShow = 3 - countdownTime % 3;
        const dotsString = ".".repeat(dotsToShow).padStart(3, " ").split("").reverse().join("");
        setCountdownMessage(`Paying${dotsString} ${countdownTime}`);
    };

    useEffect(() => {
        let intervalId;

        if (loading && countdownTime > 0) {
            setDotsCount(countdownTime);
            intervalId = setInterval(() => {
                setDotsCount(countdownTime - 1);
                setCountdownTime(countdownTime - 1);
            }, 1000);
        } else {
            setCountdownMessage("Almost there...");
        }

        return () => clearInterval(intervalId);
    }, [loading, countdownTime]);

    return (
        <div className="rebalance-popup-container">
            <div className="rebalance-popup-content">
                <div><button className="rebalance-close-icon-popup" onClick={onClose}></button></div>

                {!response && !error &&
                    <div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Peer</th>
                                    <th>Balance Ratio Line</th>
                                    <th>Balance</th>

                                </tr>
                            </thead>
                            <tbody>
                                {channels.map((channel) => (
                                    <tr key={channel.chan_id}>
                                        <td><small>{channel.remote_pubkey.substring(0, 6) + "..." + channel.remote_pubkey.substring(channel.remote_pubkey.length - 6)}</small></td>
                                        <td>
                                            <BalanceRatioLine
                                                remoteBalance={channel?.remote_balance || 0}
                                                capacity={channel?.capacity || 1}
                                                isOutgoing={outgoing_chan_id === channel.chan_id}
                                                isIncoming={last_hop === channel.remote_pubkey}
                                                amt={amt}
                                            />
                                        </td>
                                        <td>{NumberDisplayLocal(channel?.local_balance, outgoing_chan_id === channel.chan_id, last_hop === channel.remote_pubkey, amt)} sats - {NumberDisplayRemote(channel?.remote_balance, outgoing_chan_id === channel.chan_id, last_hop === channel.remote_pubkey, amt)} sats</td>
                                        <td>
                                            <div>
                                                {outgoing_chan_id === channel.chan_id ? (
                                                    <button className="rebalance-choose-outgoing-channel-button" onClick={() => { }}>Selected as outgoing</button>
                                                ) : (
                                                    <button className={`rebalance-choose-outgoing-channel-button ${outgoing_chan_id === '' && last_hop !== channel.remote_pubkey ? "" : "hidden"}`} onClick={() => handleChooseChannel(channel.chan_id)}>Choose as outgoing</button>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {outgoing_chan_id === "" ? null :
                                                <div>
                                                    {last_hop === channel.remote_pubkey ? (
                                                        <button className="rebalance-choose-lasthop-node-button" onClick={() => { }}>Selected as incoming</button>
                                                    ) : (
                                                        <button className={`rebalance-choose-lasthop-node-button ${last_hop === '' && outgoing_chan_id !== channel.chan_id ? "" : "hidden"}`} onClick={() => handleChooseLastHop(channel.remote_pubkey)}>Choose as incoming</button>
                                                    )}
                                                </div>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <br />
                        {outgoing_chan_id !== "" && last_hop !== "" ?
                            <div >
                                <input type="number" id="amt" placeholder="Amount" value={amt} min={0} max={maxAmount} step={10000} onChange={(e) => handleChooseAmount(e.target.value)} className="rebalance-input" />
                                <button className="rebalance-button" onClick={() => {
                                    AutomaticAmount(
                                        parseInt(channels.find((channel) => channel.chan_id === outgoing_chan_id)?.remote_balance),
                                        parseInt(channels.find((channel) => channel.remote_pubkey === last_hop)?.remote_balance),
                                        parseInt(channels.find((channel) => channel.chan_id === outgoing_chan_id)?.capacity),
                                        parseInt(channels.find((channel) => channel.remote_pubkey === last_hop)?.capacity))
                                }}>Set amout automatically</button>

                                <input type="text" id="timeout" value={timeout} onChange={(e) => setTimeout(e.target.value)} className="rebalance-input" />
                                <button className="rebalance-button" onClick={() => {
                                    setTimeout("5m0s")
                                }}>5 minutes timeout</button>

                            </div>
                            : null}
                        <br />
                        {outgoing_chan_id !== "" && last_hop !== "" && amt !== "" && timeout !== "" ?
                            <button type="submit" className="rebalance-button" onClick={handleSubmit}>{loading ? countdownMessage : "Rebalance"}</button>

                            : null}
                    </div>
                }

                {response && response.error && (
                    <p className="rebalance-error">{response.error}: {response.message}</p>
                )}

                {response && response.status && response?.status === "SUCCEEDED" && (
                    <div>
                        <p>Rebalanced successfully {response.value} sats in {response?.htlcs[0]?.route?.hops?.length} hops, for {response.fee} sats of fees</p>
                    </div>
                )}

                {response && response.status && response?.status !== "SUCCEEDED" && (
                    <div className="rebalance-error">
                        <p>Rebalance failed. {response?.failure_reason}</p>
                    </div>
                )}

                {error && (
                    <p className="rebalance-error">{error.error}</p>
                )}

            </div>
        </div>
    );
}

export default RebalanceFormPopup;