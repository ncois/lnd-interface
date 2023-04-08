import psycopg2
import subprocess
import json
import time
import datetime
import sys
import os


args = sys.argv

if len(args) > 1:
    should_update_payments = args[1]
else:
    # Raise an error if the argument is not passed
    exit("Error: Please pass an argument to the script")

USER = os.getenv('USER')
PASSWORD = os.environ.get('PASSWORD')
DATABASE = os.environ.get('DATABASE')
HOST = os.environ.get('HOST')
PORT = os.environ.get('PORT')

conn = psycopg2.connect(
    database=DATABASE,
    user=USER,
    password=PASSWORD,
    host=HOST,
    port=PORT
)

# Update channels table
def insert_channels_data(data):
    try:
        # Drop the table if it exists
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS channels;")
            conn.commit()

        # Create a new table with the same schema as before
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE channels (
                    id SERIAL PRIMARY KEY,
                    active BOOLEAN,
                    remote_pubkey TEXT,
                    peer_alias TEXT,
                    channel_point TEXT,
                    chan_id BIGINT,
                    capacity BIGINT,
                    local_balance BIGINT,
                    remote_balance BIGINT,
                    unsettled_balance BIGINT,
                    total_satoshis_sent BIGINT,
                    total_satoshis_received BIGINT,
                    is_private BOOLEAN,
                    is_initiator BOOLEAN,
                    local_constraints JSONB,
                    remote_constraints JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
            conn.commit()

        # Loop through the data and insert it into the database
        with conn.cursor() as cur:
            for item in data:
                cur.execute("""
                    INSERT INTO channels (active, remote_pubkey, peer_alias, channel_point, chan_id, capacity, local_balance, remote_balance, unsettled_balance, total_satoshis_sent, total_satoshis_received, is_private, is_initiator, local_constraints, remote_constraints)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (item['active'], item['remote_pubkey'], item['peer_alias'], item['channel_point'], item['chan_id'], item['capacity'], item['local_balance'], item['remote_balance'], item['unsettled_balance'], item['total_satoshis_sent'], item['total_satoshis_received'], item['private'], item['initiator'], json.dumps(item['local_constraints']), json.dumps(item['remote_constraints'])))
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting in channels DB: ", e)
        conn.rollback()
        return False

def insert_channels_status(status):
    try:
        with conn.cursor() as cur:
            # Check if the table exists, and if not, create it
            cur.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'update_channels_status');")
            if not cur.fetchone()[0]:
                cur.execute("""
                    CREATE TABLE update_channels_status (
                        ID SERIAL PRIMARY KEY,
                        updated_at TEXT,
                        status BOOLEAN
                    );
                """)

            # Insert the status into the table
            cur.execute("""
                INSERT INTO update_channels_status (updated_at, status)
                VALUES (NOW(), %s);
            """, (status,))

            cur.execute("SELECT COUNT(*) FROM update_channels_status;")
            count = cur.fetchone()[0]
            # If the number of rows is greater than 100, delete the oldest row
            if count > 100:
                cur.execute("DELETE FROM update_channels_status WHERE id = (SELECT id FROM update_channels_status ORDER BY updated_at LIMIT 1);")
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting update_channels_status DB: ", e)
        conn.rollback()
        return False
    
def update_channels_database():
    try:
        # Execute the command line and get the JSON output
        cmdOutput = subprocess.check_output(['lncli', 'listchannels'])
        data = json.loads(cmdOutput)['channels']
        # Insert the data into the database
        if insert_channels_data(data):
            insert_channels_status(True)
        else:
            insert_channels_status(False)
    except Exception as e:
        print("Error while updating channels DB: ", e)
        insert_channels_status(False)

# Update getinfo table
def insert_getinfo_data(data):
    try:
        # Drop the table if it exists
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS getinfo;")
            conn.commit()

        # Create a new table with the same schema as before
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE getinfo (
                    id SERIAL PRIMARY KEY,
                    identity_pubkey TEXT,
                    alias TEXT,
                    color TEXT,
                    num_pending_channels BIGINT,
                    num_active_channels BIGINT,
                    num_peers BIGINT,
                    block_height BIGINT,
                    block_hash TEXT,
                    synced_to_chain BOOLEAN,
                    synced_to_graph BOOLEAN,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
            conn.commit()
        # Loop through the data and insert it into the database
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO getinfo (identity_pubkey, alias, color, num_pending_channels, num_active_channels, num_peers, block_height, block_hash, synced_to_chain, synced_to_graph) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (data['identity_pubkey'], data['alias'], data['color'], data['num_pending_channels'], data['num_active_channels'], data['num_peers'], data['block_height'], data['block_hash'], data['synced_to_chain'], data['synced_to_graph']))
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting in getinfo DB: ", e)
        conn.rollback()
        return False
        
def insert_getinfo_status(status):
    try:
        with conn.cursor() as cur:
            # Check if the table exists, and if not, create it
            cur.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'update_getinfo_status');")
            if not cur.fetchone()[0]:
                cur.execute("""
                    CREATE TABLE update_getinfo_status (
                        ID SERIAL PRIMARY KEY,
                        updated_at TEXT,
                        status BOOLEAN
                    );
                """)

            # Insert the status into the table
            cur.execute("""
                INSERT INTO update_getinfo_status (updated_at, status)
                VALUES (NOW(), %s);
            """, (status,))

            cur.execute("SELECT COUNT(*) FROM update_getinfo_status;")
            count = cur.fetchone()[0]
            # If the number of rows is greater than 100, delete the oldest row
            if count > 100:
                cur.execute("DELETE FROM update_getinfo_status WHERE id = (SELECT id FROM update_getinfo_status ORDER BY updated_at LIMIT 1);")
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting update_getinfo_status DB: ", e)
        conn.rollback()
        return False

def update_getinfo_database():
    try:
        # Execute the command line and get the JSON output
        cmdOutput = subprocess.check_output(['lncli', 'getinfo'])
        data = json.loads(cmdOutput)
        # Insert the data into the database
        if insert_getinfo_data(data):
            insert_getinfo_status(True)
        else:
            insert_getinfo_status(False)
    except Exception as e:
        print("Error while updating getinfo DB: ", e)
        insert_getinfo_status(False)

# Update feereport table
def insert_feereport_data(data):
    try:
        # Drop the table if it exists
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS channel_fees;")
            conn.commit()

        # Create a new table with the same schema as before
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE channel_fees (
                    id SERIAL PRIMARY KEY,
                    chan_id BIGINT,
                    channel_point TEXT,
                    base_fee_msat BIGINT,
                    fee_per_mil BIGINT,
                    fee_rate FLOAT,                    
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
            conn.commit()

        # Loop through the data and insert it into the database
        with conn.cursor() as cur:
            for item in data['channel_fees']:
                cur.execute("""
                    INSERT INTO channel_fees (chan_id, channel_point, base_fee_msat, fee_per_mil, fee_rate)
                    VALUES (%s, %s, %s, %s, %s);
                """, (item['chan_id'], item['channel_point'], item['base_fee_msat'], item['fee_per_mil'], item['fee_rate']))
            conn.commit()

        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS feereport;")
            conn.commit()

        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE feereport (
                    id SERIAL PRIMARY KEY,
                    day_fee_sum BIGINT,
                    week_fee_sum BIGINT,
                    month_fee_sum BIGINT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
            conn.commit()

        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO feereport (day_fee_sum, week_fee_sum, month_fee_sum)
                VALUES (%s, %s, %s);
            """, (data['day_fee_sum'], data['week_fee_sum'], data['month_fee_sum']))
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting in feereport DB: ", e)
        conn.rollback()
        return False

def insert_feereport_status(status):
    try:
        with conn.cursor() as cur:
            # Check if the table exists, and if not, create it
            cur.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'update_feereport_status');")
            if not cur.fetchone()[0]:
                cur.execute("""
                    CREATE TABLE update_feereport_status (
                        ID SERIAL PRIMARY KEY,
                        updated_at TEXT,
                        status BOOLEAN
                    );
                """)
            # Insert the status into the table
            cur.execute("""
                INSERT INTO update_feereport_status (updated_at, status)
                VALUES (NOW(), %s);
            """, (status,))

            cur.execute("SELECT COUNT(*) FROM update_feereport_status;")
            count = cur.fetchone()[0]
            # If the number of rows is greater than 100, delete the oldest row
            if count > 100:
                cur.execute("DELETE FROM update_feereport_status WHERE id = (SELECT id FROM update_feereport_status ORDER BY updated_at LIMIT 1);")
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting update_feereport_status DB: ", e)
        conn.rollback()
        return False

def update_feereport_database():
    try:
        # Execute the command line and get the JSON output
        cmdOutput = subprocess.check_output(['lncli', 'feereport'])
        data = json.loads(cmdOutput)
        # Insert the data into the database
        if insert_feereport_data(data):
            insert_feereport_status(True)
        else:
            insert_feereport_status(False)
    except Exception as e:
        print("Error while updating feereport DB: ", e)
        insert_feereport_status(False)

# Update onchain_balance table
def insert_onchain_balance_data(data):
    try:
        # Drop the table if it exists
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS onchain_balance;")
            conn.commit()

        # Create a new table with the same schema as before
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE onchain_balance (
                    id SERIAL PRIMARY KEY,
                    total_balance BIGINT,
                    confirmed_balance BIGINT,
                    unconfirmed_balance BIGINT,
                    locked_balance BIGINT,
                    reserved_balance_anchor_chan BIGINT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
            conn.commit()
        # Loop through the data and insert it into the database
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO onchain_balance (total_balance, confirmed_balance, unconfirmed_balance, locked_balance, reserved_balance_anchor_chan) 
                VALUES (%s, %s, %s, %s, %s);
            """, (data['total_balance'], data['confirmed_balance'], data['unconfirmed_balance'], data['locked_balance'], data['reserved_balance_anchor_chan']))
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting in onchain_balance DB: ", e)
        conn.rollback()
        return False
        
def insert_onchain_balance_status(status):
    try:
        with conn.cursor() as cur:
            # Check if the table exists, and if not, create it
            cur.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'update_onchain_balance_status');")
            if not cur.fetchone()[0]:
                cur.execute("""
                    CREATE TABLE update_onchain_balance_status (
                        ID SERIAL PRIMARY KEY,
                        updated_at TEXT,
                        status BOOLEAN
                    );
                """)
            # Insert the status into the table
            cur.execute("""
                INSERT INTO update_onchain_balance_status (updated_at, status)
                VALUES (NOW(), %s);
            """, (status,))

            cur.execute("SELECT COUNT(*) FROM update_onchain_balance_status;")
            count = cur.fetchone()[0]
            # If the number of rows is greater than 100, delete the oldest row
            if count > 100:
                cur.execute("DELETE FROM update_onchain_balance_status WHERE id = (SELECT id FROM update_onchain_balance_status ORDER BY updated_at LIMIT 1);")
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting update_onchain_balance_status DB: ", e)
        conn.rollback()
        return False

def update_onchain_balance_database():
    try:
        # Execute the command line and get the JSON output
        cmdOutput = subprocess.check_output(['lncli', 'walletbalance'])
        data = json.loads(cmdOutput)
        # Insert the data into the database
        if insert_onchain_balance_data(data):
            insert_onchain_balance_status(True)
        else:
            insert_onchain_balance_status(False)
    except Exception as e:
        print("Error while updating onchain_balance DB: ", e)
        insert_onchain_balance_status(False)

# Update invoices table
def insert_invoices_data(data):
    try:
        # Drop the table if it exists
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS invoices;")
            conn.commit()

        # Create a new table with the same schema as before
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE invoices (
                    id SERIAL PRIMARY KEY,
                    memo TEXT,
                    value BIGINT,                    
                    settled BOOLEAN,
                    creation_date BIGINT,
                    settle_date BIGINT,
                    payment_request TEXT,
                    expiry BIGINT,
                    fallback_addr TEXT,
                    cltv_expiry BIGINT,
                    amt_paid_sat BIGINT,           
                    state TEXT,
                    is_keysend BOOLEAN,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
            conn.commit()

        # Loop through the data and insert it into the database
        with conn.cursor() as cur:
            for item in data:
                cur.execute("""
                    INSERT INTO invoices (memo, value, settled, creation_date, settle_date, payment_request, expiry, fallback_addr, cltv_expiry, amt_paid_sat, state, is_keysend)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (item['memo'], item['value'], item['settled'], item['creation_date'], item['settle_date'], item['payment_request'], item['expiry'], item['fallback_addr'], item['cltv_expiry'], item['amt_paid_sat'], item['state'], item['is_keysend']))
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting in invoices DB: ", e)
        conn.rollback()
        return False

def insert_invoices_status(status):
    try:
        with conn.cursor() as cur:
            # Check if the table exists, and if not, create it
            cur.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'update_invoices_status');")
            if not cur.fetchone()[0]:
                cur.execute("""
                    CREATE TABLE update_invoices_status (
                        ID SERIAL PRIMARY KEY,
                        updated_at TEXT,
                        status BOOLEAN
                    );
                """)
            # Insert the status into the table
            cur.execute("""
                INSERT INTO update_invoices_status (updated_at, status)
                VALUES (NOW(), %s);
            """, (status,))

            cur.execute("SELECT COUNT(*) FROM update_invoices_status;")
            count = cur.fetchone()[0]
            # If the number of rows is greater than 100, delete the oldest row
            if count > 100:
                cur.execute("DELETE FROM update_invoices_status WHERE id = (SELECT id FROM update_invoices_status ORDER BY updated_at LIMIT 1);")
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting update_invoices_status DB: ", e)
        conn.rollback()
        return False

def update_invoices_database():
    try:
        # Execute the command line and get the JSON output
        cmdOutput = subprocess.check_output(['lncli', 'listinvoices'])
        data = json.loads(cmdOutput)['invoices']
        # Insert the data into the database
        if insert_invoices_data(data):
            insert_invoices_status(True)
        else:
            insert_invoices_status(False)
    except Exception as e:
        print("Error while updating invoices DB: ", e)
        insert_invoices_status(False)

# Update payments table
def insert_payments_data(data):
    try:
        # Drop the table if it exists
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS payments;")
            conn.commit()

        # Create a new table with the same schema as before
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE payments (
                    id SERIAL PRIMARY KEY,
                    payment_hash TEXT,
                    value BIGINT,
                    creation_date BIGINT,
                    attempt_time BIGINT,
                    resolve_time BIGINT,
                    fee BIGINT,
                    payment_preimage TEXT,
                    value_sat BIGINT,
                    value_msat BIGINT,
                    payment_request TEXT,
                    memo TEXT,
                    destination TEXT,
                    status TEXT,
                    fee_sat BIGINT,
                    fee_msat BIGINT,
                    nb_hops SMALLINT,
                    failure_reason TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
            conn.commit()

        # Loop through the data and insert it into the database
        # we reverse the list to have the most recent payments first
        count = 0
        with conn.cursor() as cur:
            for item in data[::-1]:
                if 'htlcs' in item and len(item['htlcs']) > 0 and 'attempt_time_ns' in item['htlcs'][0]:
                    attempt_time_ns = item['htlcs'][0]['attempt_time_ns']
                else:
                    attempt_time_ns = 0

                if 'htlcs' in item and len(item['htlcs']) > 0 and 'resolve_time_ns' in item['htlcs'][0]:
                    resolve_time_ns = item['htlcs'][0]['resolve_time_ns']
                else:
                    resolve_time_ns = 0

                # Get the memo and the destination from the payment request
                if 'payment_request' in item and item['payment_request'] != '' and should_update_payments == "true":
                    [memo, destination] = get_memo_and_destination_from_payment_request(item['payment_request'])
                else:
                    [memo, destination] = ['', '']

                cur.execute("""
                    INSERT INTO payments (payment_hash, value, creation_date, attempt_time, resolve_time, fee, payment_preimage, value_sat, value_msat, payment_request, memo, destination, status, fee_sat, fee_msat, nb_hops, failure_reason)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (item['payment_hash'], item['value'], item['creation_date'], attempt_time_ns, resolve_time_ns, item['fee'], item['payment_preimage'], item['value_sat'], item['value_msat'], item['payment_request'], memo, destination, item['status'], item['fee_sat'], item['fee_msat'], len(item['htlcs'][0]['route']['hops']), item['failure_reason']))
                
                count += 1
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting in payments DB: ", e)
        conn.rollback()
        return False
        
def get_memo_and_destination_from_payment_request(payment_request):
    try:
        # Get the memo from the payment request
        decoded_payment_request = subprocess.check_output(['lncli', 'decodepayreq', payment_request])
        data = json.loads(decoded_payment_request)
        description = data['description']
        destination = data['destination']
        return [description, destination]

    except Exception as e:
        print("Error while getting destination from payment request: ", e)
        return ['', '']
    
def insert_payments_status(status):
    try:
        with conn.cursor() as cur:
            # Check if the table exists, and if not, create it
            cur.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'update_payments_status');")
            if not cur.fetchone()[0]:
                cur.execute("""
                    CREATE TABLE update_payments_status (
                        ID SERIAL PRIMARY KEY,
                        updated_at TEXT,
                        status BOOLEAN
                    );
                """)
            # Insert the status into the table
            cur.execute("""
                INSERT INTO update_payments_status (updated_at, status)
                VALUES (NOW(), %s);
            """, (status,))

            cur.execute("SELECT COUNT(*) FROM update_payments_status;")
            count = cur.fetchone()[0]
            # If the number of rows is greater than 100, delete the oldest row
            if count > 100:
                cur.execute("DELETE FROM update_payments_status WHERE id = (SELECT id FROM update_payments_status ORDER BY updated_at LIMIT 1);")
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting update_payments_status DB: ", e)
        conn.rollback()
        return False

def update_payments_database():
    try:
        # Execute the command line and get the JSON output
        cmdOutput = subprocess.check_output(['lncli', 'listpayments'])
        data = json.loads(cmdOutput)['payments']
        # Insert the data into the database
        if insert_payments_data(data):
            insert_payments_status(True)
        else:
            insert_payments_status(False)
    except Exception as e:
        print("Error while updating payments DB: ", e)
        insert_payments_status(False)

# Update unspsent table
def insert_unspent_data(data):
    try:
        # Drop the table if it exists
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS unspent;")
            conn.commit()

        # Create a new table with the same schema as before
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE unspent (
                    id SERIAL PRIMARY KEY,
                    address_type SMALLINT,
                    address TEXT,
                    amount_sat BIGINT,
                    pk_script TEXT,
                    outpoint TEXT,
                    confirmations BIGINT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
            conn.commit()

        # Loop through the data and insert it into the database
        with conn.cursor() as cur:
            for item in data:

                cur.execute("""
                    INSERT INTO unspent (address_type, address, amount_sat, pk_script, outpoint, confirmations)
                    VALUES (%s, %s, %s, %s, %s, %s);
                """, (item['address_type'], item['address'], item['amount_sat'], item['pk_script'], item['outpoint'], item['confirmations']))
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting in unspent DB: ", e)
        conn.rollback()
        return False

def insert_unspent_status(status):
    try:
        with conn.cursor() as cur:
            # Check if the table exists, and if not, create it
            cur.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'update_unspent_status');")
            if not cur.fetchone()[0]:
                cur.execute("""
                    CREATE TABLE update_unspent_status (
                        ID SERIAL PRIMARY KEY,
                        updated_at TEXT,
                        status BOOLEAN
                    );
                """)
            # Insert the status into the table
            cur.execute("""
                INSERT INTO update_unspent_status (updated_at, status)
                VALUES (NOW(), %s);
            """, (status,))

            cur.execute("SELECT COUNT(*) FROM update_unspent_status;")
            count = cur.fetchone()[0]
            # If the number of rows is greater than 100, delete the oldest row
            if count > 100:
                cur.execute("DELETE FROM update_unspent_status WHERE id = (SELECT id FROM update_unspent_status ORDER BY updated_at LIMIT 1);")
            conn.commit()

        return True
    except Exception as e:
        print("Error while inserting update_unspent_status DB: ", e)
        conn.rollback()
        return False

def update_unspent_database():
    try:
        # Execute the command line and get the JSON output
        cmdOutput = subprocess.check_output(['lncli', 'listunspent'])
        data = json.loads(cmdOutput)['utxos']
        # Insert the data into the database
        if insert_unspent_data(data):
            insert_unspent_status(True)
        else:
            insert_unspent_status(False)
    except Exception as e:
        print("Error while updating unspent DB: ", e)
        insert_unspent_status(False)


update_channels_database()
print("channels")
update_getinfo_database()
print("getinfo")
update_feereport_database()
print("feereport")
update_onchain_balance_database()
print("onchain_balance")
update_invoices_database()
print("invoices")
update_payments_database()
print("payments")
update_unspent_database()
print("unspent")
print("Try to update databases at: ", datetime.datetime.now())
