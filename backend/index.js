// server/index.js

const express = require('express');
const { Pool } = require('pg');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const cors = require("cors");

dotenv.config();

const app = express();

// Create a PostgreSQL pool
const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT
});

app.use(cors({ origin: "*", methods: ["GET"] }));

// Update the database
app.get('/', async (req, res) => {
  const should_update_payments = req.query.payments;
  try {
    const cmdOutput = execSync(`python3 update_db.py ${should_update_payments}`)

    // Query the status table to check if the update succeeded
    const result_getinfo = await pool.query('SELECT status, updated_at FROM update_getinfo_status ORDER BY updated_at DESC LIMIT 1');
    const status_getinfo = result_getinfo.rows[0].status;
    const updated_at_getinfo = result_getinfo.rows[0].updated_at;

    const response_getinfo = {
      date: updated_at_getinfo,
      success: status_getinfo
    };

    const result_channels = await pool.query('SELECT status, updated_at FROM update_channels_status ORDER BY updated_at DESC LIMIT 1');
    const status_channels = result_channels.rows[0].status;
    const updated_at_channels = result_channels.rows[0].updated_at;

    const response_channels = {
      date: updated_at_channels,
      success: status_channels
    };

    const result_feereport = await pool.query('SELECT status, updated_at FROM update_feereport_status ORDER BY updated_at DESC LIMIT 1');
    const status_feereport = result_feereport.rows[0].status;
    const updated_at_feereport = result_feereport.rows[0].updated_at;

    const response_feereport = {
      date: updated_at_feereport,
      success: status_feereport
    };

    const result_onchain_balance = await pool.query('SELECT status, updated_at FROM update_onchain_balance_status ORDER BY updated_at DESC LIMIT 1');
    const status_onchain_balance = result_onchain_balance.rows[0].status;
    const updated_at_onchain_balance = result_onchain_balance.rows[0].updated_at;

    const response_onchain_balance = {
      date: updated_at_onchain_balance,
      success: status_onchain_balance
    };

    const result_invoices = await pool.query('SELECT status, updated_at FROM update_invoices_status ORDER BY updated_at DESC LIMIT 1');
    const status_invoices = result_invoices.rows[0].status;
    const updated_at_invoices = result_invoices.rows[0].updated_at;

    const response_invoices = {
      date: updated_at_invoices,
      success: status_invoices
    };

    const result_payments = await pool.query('SELECT status, updated_at FROM update_payments_status ORDER BY updated_at DESC LIMIT 1');
    const status_payments = result_payments.rows[0].status;
    const updated_at_payments = result_payments.rows[0].updated_at;

    const response_payments = {
      date: updated_at_payments,
      success: status_payments
    };

    const result_unspent = await pool.query('SELECT status, updated_at FROM update_unspent_status ORDER BY updated_at DESC LIMIT 1');
    const status_unspent = result_unspent.rows[0].status;
    const updated_at_unspent = result_unspent.rows[0].updated_at;

    const response_unspent = {
      date: updated_at_unspent,
      success: status_unspent
    };

    const response = {
      getinfo: response_getinfo,
      channels: response_channels,
      feereport: response_feereport,
      onchain_balance: response_onchain_balance,
      invoices: response_invoices,
      payments: response_payments,
      unspent: response_unspent
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred. Check databases' });
  }
});

// Get channels
app.get('/channels', async (req, res) => {
  try {
    const result = await pool.query('SELECT active, remote_pubkey, peer_alias, channels.channel_point, channels.chan_id, channels.capacity, channels.local_balance, channels.remote_balance, channels.unsettled_balance, channels.total_satoshis_sent, channels.total_satoshis_received, channels.is_private, channels.is_initiator, channels.local_constraints, channels.remote_constraints, channel_fees.base_fee_msat, channel_fees.fee_per_mil, channel_fees.fee_rate FROM channels JOIN channel_fees ON channels.chan_id = channel_fees.chan_id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred. Check databases' });
  }
});

// Get channel by chan_id
app.get('/channels/:chan_id', async (req, res) => {

  const chanid = req.params.chan_id;

  let chanInfo;
  try {
    chanInfo = JSON.parse(execSync(`lncli getchaninfo ${chanid}`).toString())
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'An error occurred while fetching channel information', message: err.message })
  }

  res.json(chanInfo)
});

// Get a report of total fees
app.get('/feereport', async (req, res) => {
  try {
    const result = await pool.query('SELECT day_fee_sum, week_fee_sum, month_fee_sum FROM feereport');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred. Check databases' });
  }
});

// Update fee policy
app.get('/updatefees', async (req, res) => {
  const base_fee_msat = req.query.base_fee_msat;
  const fee_rate_ppm = req.query.fee_rate_ppm;
  const time_lock_delta = req.query.time_lock_delta;
  const min_htlc_msat = req.query.min_htlc_msat;
  const max_htlc_msat = req.query.max_htlc_msat;
  const chan_point = req.query.chan_point;

  if (base_fee_msat === undefined || fee_rate_ppm === undefined || time_lock_delta === undefined) {
    return res.status(400).json({ error: 'Missing parameters', message: 'base_fee_msat, fee_rate_ppm and time_lock_delta are required' });
  }

  let command = `lncli updatechanpolicy --base_fee_msat ${base_fee_msat} --fee_rate_ppm ${fee_rate_ppm} --time_lock_delta ${time_lock_delta}`;

  if (min_htlc_msat !== undefined) {
    command += ` --min_htlc_msat ${min_htlc_msat}`;
  }

  if (max_htlc_msat !== undefined) {
    command += ` --max_htlc_msat ${max_htlc_msat}`;
  }

  if (chan_point !== undefined) {
    command += ` --chan_point ${chan_point}`;
  }

  let result;
  try {
    result = JSON.parse(execSync(command).toString());
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'An error occurred while updating fee policy', message: err.message })
  }

  res.json(result)
});

// Get the wallet balance on chain
app.get('/walletbalance', async (req, res) => {
  try {
    const result = await pool.query('SELECT total_balance, confirmed_balance, unconfirmed_balance, locked_balance, reserved_balance_anchor_chan FROM onchain_balance');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred. Check databases' });
  }
});

// Get all unspent outputs on chain
app.get('/unspents', async (req, res) => {
  try {
    const result = await pool.query('SELECT address_type, address, amount_sat, pk_script, outpoint, confirmations FROM unspent');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred. Check databases' });
  }
});

// Get a new receive address
app.get('/newaddress', async (req, res) => {

  const type = (req.query.type ? req.query.type : "p2wkh");

  let address;
  try {
    address = JSON.parse(execSync(`lncli newaddress ${type}`).toString())
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'An error occurred while generating new address', message: err.message })
  }

  res.json(address)

});

// Send a payment
app.get('/onchainsend', async (req, res) => {
  const addr = req.query.addr;
  const amount = req.query.amount;
  const sweepall = req.query.sweepall;
  const sat_per_byte = req.query.sat_per_byte;

  if (!addr || (!amount && !sweepall) || !sat_per_byte) {
    return res.status(400).json({ error: 'Missing parameters', message: 'Address, sats per vbyte, and either amount or sweepall switch are required' });
  }

  if (amount && sweepall) {
    return res.status(400).json({ error: 'Invalid parameters', message: 'Amount and sweepall switch cannot be used together' });
  }

  let command = `lncli sendcoins ${sweepall ? "--sweepall" : ""} --addr ${addr} --sat_per_vbyte ${sat_per_byte} --min_confs 0`;
  if (amount) {
    command += ` --amt ${amount}`;
  }

  let result;
  try {
    result = JSON.parse(execSync(command).toString());
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'An error occurred while sending onchain coins', message: err.message })
  }

  res.json(result)
});

// Open a channel
app.get('/openchannel', async (req, res) => {
  const node_key = req.query.node_key;
  const connect = req.query.connect;
  const local_amt = req.query.local_amt;
  const base_fee_msat = req.query.base_fee_msat;
  const fee_rate_ppm = req.query.fee_rate_ppm;
  const sat_per_vbyte = req.query.sat_per_vbyte;
  const remote_csv_delay = req.query.remote_csv_delay;
  const max_local_csv = req.query.max_local_csv;

  if (!node_key || !local_amt) {
    return res.status(400).json({ error: 'Missing parameters', message: 'Node key, local amount, are required' });
  }

  let command = `lncli openchannel --node_key ${node_key} --local_amt ${local_amt} --connect ${connect}`;

  if (base_fee_msat) {
    command += ` --base_fee_msat ${base_fee_msat}`;
  }

  if (fee_rate_ppm) {
    command += ` --fee_rate_ppm ${fee_rate_ppm}`;
  }

  if (sat_per_vbyte) {
    command += ` --sat_per_vbyte ${sat_per_vbyte}`;
  }

  if (remote_csv_delay) {
    command += ` --remote_csv_delay ${remote_csv_delay}`;
  }

  if (max_local_csv) {
    command += ` --max_local_csv ${max_local_csv}`;
  }

  let result;
  try {
    result = JSON.parse(execSync(command).toString());
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'An error occurred while opening channel', message: err.message })
  }

  res.json(result)
});

// Close a channel
app.get('/closechannel', async (req, res) => {
  const chan_point = req.query.chan_point;
  const force = req.query.force;
  const sat_per_vbyte = req.query.sat_per_vbyte;

  if (!chan_point) {
    return res.status(400).json({ error: 'Missing parameters', message: 'Channel point is required' });
  }

  let command = `lncli closechannel --chan_point ${chan_point} ${force ? "--force" : ""}`;

  if (sat_per_vbyte) {
    command += ` --sat_per_vbyte ${sat_per_vbyte}`;
  }

  let result;
  try {
    result = JSON.parse(execSync(command).toString());
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'An error occurred while closing channel', message: err.message })
  }

  res.json(result)
});

// Get the total balance of all channels
app.get('/channelbalance', async (req, res) => {
  try {
    const result = await pool.query('SELECT SUM(local_balance) AS total_local_balance, SUM(remote_balance) AS total_remote_balance FROM channels');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred. Check databases' });
  }
});

// Rebalance channel. Example: lncli payinvoice --amt 100000 --timeout 5m0s --outgoing_chan_id 857801588729577473 (= channel 2) --allow_self_payment --last_hop 0303a518845db99994783f606e6629e705cfaf072e5ce9a4d8bf9e249de4fbd019 (= channel 1) [invoice]
app.get('/rebalance', async (req, res) => {
  const outgoing_chan_id = req.query.outgoing_chan_id;
  const last_hop = req.query.last_hop;
  const amt = req.query.amt;
  const invoice = req.query.invoice;
  const timeout = req.query.timeout;

  if (!outgoing_chan_id || !last_hop || !amt || !invoice || !timeout) {
    return res.status(400).json({ error: 'Missing parameters', message: 'outgoing_chan_id, last_hop, amt, invoice, timeout are required' });
  }

  let command = `lncli payinvoice --amt ${amt} --timeout ${timeout} --outgoing_chan_id ${outgoing_chan_id} --allow_self_payment --force --json --last_hop ${last_hop} ${invoice}`;

  let result;
  try {
    result = JSON.parse(execSync(command).toString());
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'An error occurred while rebalancing', message: err.message })
  }
  
  res.json(result)
});


// Get the total traffic of all channels
app.get('/traffic', async (req, res) => {
  try {
    const result = await pool.query('SELECT SUM(total_satoshis_sent) AS tot_satoshis_sent, SUM(total_satoshis_received) AS tot_satoshis_received FROM channels');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred. Check databases' });
  }
});

// Get general info of my node
app.get('/info', async (req, res) => {
  try {
    const result = await pool.query('SELECT identity_pubkey, alias, color, num_pending_channels, num_active_channels, num_peers, block_height, block_hash, synced_to_chain, synced_to_graph FROM getinfo');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred. Check databases' });
  }
});

// Get node info based on pubkey
app.get('/node/:pubkey', async (req, res) => {

  const pubkey = req.params.pubkey;

  let nodeInfo;
  try {
    nodeInfo = JSON.parse(execSync(`lncli getnodeinfo ${pubkey}`).toString())
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'An error occurred while fetching node information', message: err.message })
  }

  res.json(nodeInfo)

});

// Get the list of invoices
app.get('/invoices', async (req, res) => {
  try {
    const result = await pool.query('SELECT memo, value, settled, creation_date, settle_date, payment_request, expiry, fallback_addr, cltv_expiry, amt_paid_sat, state, is_keysend FROM invoices');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred. Check databases' });
  }
});

// Get an invoice for a payment
app.get('/newinvoice', async (req, res) => {
  const memo = req.query.memo;
  const amt = req.query.amt;
  const expiry = req.query.expiry;

  // no parameters is ok

  let command = `lncli addinvoice`

  if (memo) {
    command += ` --memo ${memo}`;
  }

  if (amt) {
    command += ` --amt ${amt}`;
  }

  if (expiry) {
    command += ` --expiry ${expiry}`;
  }

  let result;
  try {
    result = JSON.parse(execSync(command).toString());
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'An error occurred while creating invoice', message: err.message })
  }

  res.json(result)
});

// Get the list of payments
app.get('/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT payment_hash, value, creation_date, attempt_time, resolve_time, fee, payment_preimage, value_sat, value_msat, payment_request, memo, destination, status, fee_sat, fee_msat, nb_hops, failure_reason FROM payments');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred. Check databases' });
  }
});

// Make a payment
app.get('/pay', async (req, res) => {
  pay_req = req.query.pay_req
  fee_limit = (req.query.fee_limit ? req.query.fee_limit : "0")
  outgoing_chan_id = (req.query.outgoing_chan_id ? req.query.outgoing_chan_id : "0")
  amt = (req.query.amt ? req.query.amt : "0")

  if (!pay_req) {
    return res.status(400).json({ error: 'Missing parameter', message: 'pay_req is required' });
  }

  let command = `lncli payinvoice --pay_req ${pay_req}`;

  if (parseInt(fee_limit) > 0) {
    command += ` --fee_limit ${fee_limit}`;
  }

  if (outgoing_chan_id && outgoing_chan_id !== '0') {
    command += ` --outgoing_chan_id ${outgoing_chan_id}`;
  }

  if (amt) {
    command += ` --amt ${amt}`;
  }

  command += ` --allow_self_payment --force --json`;

  let result;
  try {
    result = JSON.parse(execSync(command).toString());
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'An error occurred while paying invoice', message: err.message })
  }

  res.json(result)
});

// Start the server
app.listen(3001, () => {
  console.log('Server listening on port 3001');
});