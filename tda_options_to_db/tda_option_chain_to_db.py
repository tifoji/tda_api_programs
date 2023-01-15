#"""
#..#######..########..########.####..#######..##....##..######........########..#######...........########..########.
#.##.....##.##.....##....##.....##..##.....##.###...##.##....##..........##....##.....##..........##.....##.##.....##
#.##.....##.##.....##....##.....##..##.....##.####..##.##................##....##.....##..........##.....##.##.....##
#.##.....##.########.....##.....##..##.....##.##.##.##..######...........##....##.....##..........##.....##.########.
#.##.....##.##...........##.....##..##.....##.##..####.......##..........##....##.....##..........##.....##.##.....##
#.##.....##.##...........##.....##..##.....##.##...###.##....##..........##....##.....##..........##.....##.##.....##
#..#######..##...........##....####..#######..##....##..######...........##.....#######...........########..########.
#"""
from psycopg2.extras import execute_values
from psycopg2 import extensions
import concurrent.futures
import pandas as pd
import psycopg2
import datetime, time
import sys
import logging
from globals import client, maxConsumerThreads, maxProducerThreads, sleepTime, ticker_list, stream_client
from db import db_globals as dbg
from db import db_statements as dbs




def get_option_data(data):
    """
    Fetches option data for a given ticker from TDAmeritrade API

    Parameters:
        data (json): Complete option chain response from API call on a ticker.

    Returns:
        pandas.DataFrame: Option data for the given ticker(s).
    """
    option_data = []
    security = data['symbol']  # Get the symbol from the outermost dictionary like $SPX.X
    
    # Loop through the expiration dates in the putExpDateMap
    for exp_date, exp_data in data['putExpDateMap'].items():
        # Loop through the strike prices for the expiration date
        for strike, option_list in exp_data.items():
            # Loop through the option data for the strike price
            for option in option_list:
                option_data.append(option)
                
    # Do the same for the callExpDateMap
    for exp_date, exp_data in data['callExpDateMap'].items():
        for strike, option_list in exp_data.items():
            for option in option_list:
                option_data.append(option)

    # Create a DataFrame starting with the time of the inserts, 'security' and formatted 'expirationDate' columns
    # The 'expirationDate' is taken from the key that occurs for each strike and not the top level key of 
    # put/callExpDateMap. It is the one in unix epoch, hence the conversion. The top level element in 
    # put/callExpDateMap is in format '2020-12-18:18' where 18 is days to expiration and can also be used instead 
    # of converting the one for each strike by using .split() etc
    df = pd.DataFrame(option_data).assign(saveTime=datetime.datetime.now(), security=security)
    # Convert the expirationDate column to a datetime object in date format
    df['expirationDate'] = pd.to_datetime(df['expirationDate'], unit='ms').dt.date
    # Reorder the columns in putExpDateMap and callExpDateMap keeping only the columns we need
    df = df.loc[:, dbg.columns_to_keep]

    return df


def create_conn(dbconfig=dbg.dbconfig):
    """
    Creates a connection to a PostgreSQL database.

    Parameters:
        dbconfig (dict): A dictionary of parameters for connecting to the database. Should contain keys for 'user', 'password', 'host', 'port', and 'database'.

    Returns:
        psycopg2.extensions.connection: A connection to the PostgreSQL database.
    """
    try:
        conn = psycopg2.connect(**dbconfig)
        logging.info(f"{datetime.datetime.now()}: Successfully connected to the database")
    except (Exception, psycopg2.OperationalError) as error:
        logging.error(f"{datetime.datetime.now()}: An error occurred while connecting to the database: {error}")
        conn = None
    return conn

def get_conn(connection_pool):
    """
    Obtains a connection from a connection pool.

    Parameters:
        connection_pool (psycopg2.pool.ThreadedConnectionPool): Connection pool to obtain a connection from.

    Returns:
        psycopg2.extensions.connection: A connection from the connection pool.
    """
    try:
        conn = connection_pool.getconn()
        logging.info(f"{datetime.datetime.now()}: Successfully obtained a connection from the connection pool.")
        return conn
    except (Exception, psycopg2.Error) as error:
        logging.error(f"{datetime.datetime.now()}: An error occurred while obtaining a connection from the connection pool: {error}")
        return None

def put_conn(conn, connection_pool):
    """
    Returns a connection to the connection pool.

    Parameters:
        conn (psycopg2.extensions.connection): Connection to return to the pool.
        connection_pool (psycopg2.pool.ThreadedConnectionPool): Connection pool to return the connection to.
    """
    try:
        connection_pool.putconn(conn)
        logging.info(f"{datetime.datetime.now()}: Successfully returned connection to the pool")
    except (Exception, psycopg2.OperationalError) as error:
        logging.error(f"{datetime.datetime.now()}: An error occurred while returning connection to the pool: {error}")

def create_table(conn, table_name=dbg.table_name):
    """
    Creates a table in a PostgreSQL database.

    Parameters:
        conn (psycopg2.extensions.connection): A connection to the PostgreSQL database.
        table_name (str): The name of the table to be created.

    """
    with conn.cursor() as cur:
        try:
            cur.execute(f"SELECT to_regclass('{table_name}')")
            if not cur.fetchone()[0]:
                cur.execute(dbs.create_table_statement)
                conn.commit()
                logging.info(f"{datetime.datetime.now()}: Table {table_name} created successfully")
            else:
                logging.info(f"{datetime.datetime.now()}: Table {table_name} already exists")
        except (Exception, psycopg2.DatabaseError) as error:
            logging.error(f"{datetime.datetime.now()}: An error occurred while creating table: {error}")
            conn.rollback()

def create_index(conn, index_name=dbg.index_name):
    """
    Creates an index on a table in a PostgreSQL database.

    Parameters:
        conn (psycopg2.extensions.connection): A connection to the PostgreSQL database.
        index_name (str): The name of the index to be created.
    """
    with conn.cursor() as cur:
        try:
            cur.execute(f"SELECT to_regclass('{index_name}')")
            if not cur.fetchone()[0]:
                cur.execute(dbs.create_index_statement)
                conn.commit()
                logging.info(f"{datetime.datetime.now()}: Index {index_name} created successfully")
            else:
                logging.info(f"{datetime.datetime.now()}: Index {index_name} already exists")
        except (Exception, psycopg2.DatabaseError) as error:
            logging.error(f"{datetime.datetime.now()}: An error occurred while creating index: {error}")
            conn.rollback()

def insert_data_into_table(option_data, conn, table_name=dbg.table_name):
    """
    Inserts data into a table in a PostgreSQL database.

    Parameters:
        option_data (pandas.DataFrame): Data to be inserted into the table.
        conn (psycopg2.extensions.connection): A connection to the PostgreSQL database.
        table_name (str): The name of the table to insert the data into.

    Returns:
        str: status 'success' or 'failed'
    """
    status = None
    with conn.cursor() as cur:
        try:
            # Insert the data into the table. DO NOTHING on 3 columns ensures only new data is inserted every loop and not duplicates 
            logging.info(f"{datetime.datetime.now()}: Processing {len(option_data)} rows for {option_data['security'][0]}")
            insert_statement = f"INSERT INTO {table_name} ("
            insert_statement += ', '.join(option_data.columns)
            insert_statement += ") VALUES %s ON CONFLICT (symbol, tradeTimeInLong, quoteTimeInLong) DO NOTHING"
            execute_values(cur, insert_statement, option_data.values)
            conn.commit()    
            if conn.get_transaction_status() == extensions.TRANSACTION_STATUS_IDLE:
                status = 'success' 
            else:
                logging.warning(f"{datetime.datetime.now()}: Insert Status: {conn.get_transaction_status()} ") 
        except (Exception, psycopg2.DatabaseError) as error:
            logging.error(f"{datetime.datetime.now()}: An error occurred: {error} Rolling Back Connection")
            status = 'failed'
            conn.rollback()
    return status

def on_insert_completion_logging(status, security, start_time):
    """
    Logs the completion of data insertion into a table

    Parameters:
        status (str): status 'success' or 'failed'
        security (str): Ticker symbol
        start_time (float): Time of insertion start
    """
    if status == 'success':
        elapsed_time = time.perf_counter() - start_time
        logging.info(f"{datetime.datetime.now()}: Data insertion for {security} completed successfully in {elapsed_time:0.6f} seconds")
    else:
        logging.warning(f"{datetime.datetime.now()}: Data insertion for {security} failed")


def produce_data(ticker):
    """
    Produces option data for a given ticker using the TDAmeritrade API.

    Parameters:
        ticker (str): Ticker symbol for which option data is needed.

    Returns:
        pd.DataFrame: Option data for the ticker.
    """
    try:
        r = client.get_option_chain(symbol=ticker).json()
        logging.info(f"{datetime.datetime.now()}: API Status: {ticker} {r['status']}")
        if r["status"] == "SUCCESS":
            option_data = get_option_data(r)
            return option_data
        else:
            logging.warning(f"{datetime.datetime.now()}: Markets might be closed for {ticker} Check later")
    except Exception as e:
        logging.error(f"{datetime.datetime.now()}: An error occurred while getting option data for {ticker}: {e}")

def consume_data(option_data):
    """
    Consumes the option data produced by the produce_data function, by inserting it into a PostgreSQL table.

    Parameters:
        option_data (pd.DataFrame): Option data to be inserted into the table.

    Returns:
        None
    """
    status = None
    conn = get_conn(dbg.connection_pool)
    try:
        logging.info(f"{datetime.datetime.now()}: Consuming option data for {option_data['security'][0]}")
        start_time = time.perf_counter()
        status = insert_data_into_table(option_data, conn)
        on_insert_completion_logging(status, option_data["security"][0], start_time)
    except Exception as e:
        logging.error(f"{datetime.datetime.now()}: An error occurred while consuming option data: {e}")
    finally:
        put_conn(conn, dbg.connection_pool)
        logging.info(f"{datetime.datetime.now()}: Done consuming option data for {option_data['security'][0]}")

def main():
    """
    Entry point of the program. Creates necessary resources (connection pool, thread executors) and starts the data 
    production and consumption process.

    Returns:
        None
    """
    produce_executor = concurrent.futures.ThreadPoolExecutor(maxProducerThreads)
    consume_executor = concurrent.futures.ThreadPoolExecutor(maxConsumerThreads)
    with get_conn(dbg.connection_pool) as conn:
        create_table(conn)
        create_index(conn)
        while True:
            try:
                produce_futures = [produce_executor.submit(produce_data, ticker) for ticker in ticker_list]
                for future in concurrent.futures.as_completed(produce_futures):
                    option_data = future.result()
                    if option_data is not None:
                        logging.info(f"{datetime.datetime.now()}: Submitting {option_data['security'][0]} for consumption")
                        consume_futures = consume_executor.submit(consume_data, option_data)
                    else:
                        logging.error(f"{datetime.datetime.now()}: No data")
                logging.info(f"{datetime.datetime.now()}: Sleeping for 60 seconds")
                time.sleep(sleepTime)
            except KeyboardInterrupt:
                produce_executor.shutdown()
                consume_executor.shutdown()
                dbg.connection_pool.closeall()
                logging.warning(f"{datetime.datetime.now()}: Keyboard Interrupt. Exiting")
                sys.exit(0)
            except Exception as e:
                produce_executor.shutdown()
                consume_executor.shutdown()
                dbg.connection_pool.closeall()
                logging.error(f"{datetime.datetime.now()}: An error occurred {e} Check for database connection issues")
                sys.exit(1)

#Execution Entry Point. No execution if imported as a module.
if __name__ == "__main__":
    main()
