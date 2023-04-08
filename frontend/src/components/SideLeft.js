import React from "react";
import { useState, useEffect } from "react";
import "../styles/Global.css";
import "../styles/SideLeft.css";
import "../styles/Banner.css";
import okIcon from "../assets/ok.svg";
import errorIcon from "../assets/error.svg";
import alertIcon from "../assets/alert.svg";
import up from "../assets/up.svg";
import down from "../assets/down.svg";
import bitcoin from "../assets/bitcoin.svg";
import block from "../assets/block.png";
import lightning from "../assets/lightning.svg";
import tax from "../assets/tax.svg";
import invoice from "../assets/invoice.svg";
import payment from "../assets/payment.svg";

function NumberDisplay(num) {
    const formattedNumber = parseInt(num).toLocaleString();
    return formattedNumber
}

function SideLeft({ updateStatus, activeComponent, setActiveComponent }) {

    const [info, setInfo] = useState(null);
    const [invoices, setInvoices] = useState(null);
    const [payments, setPayments] = useState(null);

    const getInfo = () => {
        // Fetch info
        const infoPromise = fetch('http://localhost:3001/info').then(response => response.json());

        // Fetch traffic data
        const trafficPromise = fetch('http://localhost:3001/traffic').then(response => response.json());

        const feereportPromise = fetch('http://localhost:3001/feereport').then(response => response.json());

        const walletbalancePromise = fetch('http://localhost:3001/walletbalance').then(response => response.json());

        const channelbalancePromise = fetch('http://localhost:3001/channelbalance').then(response => response.json());

        const invoicesPromise = fetch('http://localhost:3001/invoices').then(response => response.json());

        const paymentsPromise = fetch('http://localhost:3001/payments').then(response => response.json());

        // Wait for all promises to resolve
        Promise.all([infoPromise, trafficPromise, feereportPromise, walletbalancePromise, channelbalancePromise, invoicesPromise, paymentsPromise])
            .then(([generalinfo, traffic, feereport, walletbalance, channelbalance, invoices, payments]) => {
                setInvoices(invoices)
                setPayments(payments)
                const updatedInfo = {
                    ...generalinfo[0],
                    ...traffic[0],
                    ...feereport[0],
                    ...walletbalance[0],
                    ...channelbalance[0]
                };
                setInfo(updatedInfo);
            })
            .catch(error => {
                console.error(error);
                setInfo(null);
            });
    };

    // get number of invoices
    const getInvoiceCount = () => {
        if (invoices) {
            return invoices.length
        } else {
            return 0
        }
    }

    // check if any invoices are open
    const checkInvoices = () => {
        if (invoices) {
            const openInvoices = invoices.filter(invoice => invoice.state === "OPEN")
            if (openInvoices.length > 0) {
                return [true, openInvoices]
            } else {
                return [false, []]
            }
        }
    }

    // get number of payments
    const getPaymentCount = () => {
        if (payments) {
            return payments.length
        } else {
            return 0
        }
    }

    const renderStatusDetailed = () => {
        if (info) {
            return (
                <div className="sideleft-fit">

                    <p>
                        Connected to {NumberDisplay(info.num_peers)} peers <img style={{ verticalAlign: 'middle' }} width="30px" height="30px" src={info.num_peers > 0 ? okIcon : errorIcon} alt="Peers" />
                    </p>

                    <p>
                        {NumberDisplay(info?.num_active_channels)} active channels, {NumberDisplay(info.num_pending_channels)} pending  <button style={{ verticalAlign: 'middle', display: `${activeComponent === "Channels" ? 'none' : ''}` }} className={`${activeComponent === "Channels" ? null : 'sideleft-plus'}`} onClick={() => setActiveComponent("Channels")}></button>
                    </p>

                    <p style={info.synced_to_chain ? { color: 'green' } : { color: 'red' }}>
                        {info.synced_to_chain ? "Synced to chain " : "Not synced to chain "}<img style={{ verticalAlign: 'middle' }} width="30px" height="30px" src={info.synced_to_chain ? okIcon : alertIcon} alt="Syncing to chain" />
                    </p>

                    <p><img style={{ verticalAlign: 'middle' }} width="30px" height="30px" src={block} alt="Block" /> <a rel="noreferrer" target="_blank" href={`https://mempool.space/block/${info?.block_hash}`}>{NumberDisplay(info?.block_height)}</a></p>

                    <p>
                        <img style={{ verticalAlign: 'middle' }} width="30px" height="30px" src={bitcoin} alt="Bitcoin" /> {NumberDisplay(info?.confirmed_balance)} sats {`${info?.unconfirmed_balance === '0' ? '' : `+ ${NumberDisplay(info?.unconfirmed_balance)} unconfirmed`}`} <button style={{ verticalAlign: 'middle', display: `${activeComponent === "Unspents" ? 'none' : ''}` }} className={`${activeComponent === "Unspents" ? null : 'sideleft-plus'}`} onClick={() => setActiveComponent("Unspents")}></button>
                        
                    </p>

                    <p style={info.synced_to_graph ? { color: 'green' } : { color: 'red' }}>
                        {info.synced_to_graph ? "Synced to graph " : "Not synced to graph "}<img style={{ verticalAlign: 'middle' }} width="30px" height="30px" src={info.synced_to_graph ? okIcon : alertIcon} alt="Syncing to graph" />
                    </p>

                    <p><img style={{ verticalAlign: 'middle' }} width="30px" height="30px" src={lightning} alt="Lightning" /> {NumberDisplay(info?.total_local_balance)} sats ({NumberDisplay(info?.total_remote_balance)} remote) </p>

                    <p>{`${info?.locked_balance === '0' ? '' : `(${NumberDisplay(info?.locked_balance)} sats locked)`}`}</p>

                    <p>
                        <img style={{ verticalAlign: 'middle' }} width="30px" height="30px" src={down} alt="Down" /> {NumberDisplay(info?.tot_satoshis_received)} sats received
                    </p>

                    <p>
                        <img style={{ verticalAlign: 'middle' }} width="30px" height="30px" src={up} alt="Up" /> {NumberDisplay(info?.tot_satoshis_sent)} sats sent
                    </p>

                    <p>
                        <img style={{ verticalAlign: 'middle' }} width="30px" height="30px" src={tax} alt="Fees" /> {NumberDisplay(info?.day_fee_sum)}, {NumberDisplay(info?.week_fee_sum)}, {NumberDisplay(info?.month_fee_sum)} day, week, month fees
                    </p>

                    <p>
                        <img style={{ verticalAlign: 'middle' }} width="30px" height="30px" src={invoice} alt="Invoice" /> {getInvoiceCount() + " invoices"}{checkInvoices()[0] ? " (" + checkInvoices()[1].length.toString() + " open)" : ""}  <button style={{ verticalAlign: 'middle', display: `${activeComponent === "Invoices" ? 'none' : ''}` }} className={`${activeComponent === "Invoices" ? null : 'sideleft-plus'}`} onClick={() => setActiveComponent("Invoices")}></button>
                    </p>

                    <p>
                        <img style={{ verticalAlign: 'middle' }} width="30px" height="30px" src={payment} alt="Payment" /> {getPaymentCount() + " payments"}  <button style={{ verticalAlign: 'middle', display: `${activeComponent === "Payments" ? 'none' : ''}` }} className={`${activeComponent === "Payments" ? null : 'sideleft-plus'}`} onClick={() => setActiveComponent("Payments")}></button>
                    </p>

                </div>
            )
        } else {
            return null
        }
    };

    useEffect(() => {
        getInfo();
    },
        [updateStatus]);

    return (

        <div className={`side-left sideleft-fit`} style={{ backgroundColor: info?.color }}>
            {info ? (
                <div>
                    <h2>{`${info.alias}'s`} <a rel="noreferrer" target="_blank" href={`https://mempool.space/fr/lightning/node/${info.identity_pubkey}`}>node</a> </h2>
                    {renderStatusDetailed()}
                </div>
            ) : (
                null
            )}
        </div>
    );
}

export default SideLeft;