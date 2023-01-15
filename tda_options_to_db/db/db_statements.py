from importlib import import_module 
from pathlib import Path

table_name = None
index_name = None

current_dir = Path(__file__).parent
db_globals_file = current_dir / 'db_globals.py'
db_globals_file = str(db_globals_file.resolve())
with open(db_globals_file) as f:
    exec(f.read())

create_table_statement = """
CREATE TABLE IF NOT EXISTS {} (
    saveTime timestamp without time zone,
    security text,
    expirationDate date,
    putCall text,
    symbol text,
    description text,
    exchangeName text,
    bid real,
    ask real,
    last real,
    mark real,
    bidSize integer,
    askSize integer,
    lastSize integer,
    highPrice real,
    lowPrice real,
    openPrice real,
    closePrice real,
    totalVolume integer,
    tradeTimeInLong bigint,
    quoteTimeInLong bigint,
    netChange real,
    volatility real,
    delta real,
    gamma real,
    theta real,
    vega real,
    rho real,
    openInterest integer,
    timeValue real,
    theoreticalOptionValue real,
    theoreticalVolatility real,
    strikePrice real,
    daysToExpiration integer,
    percentChange real,
    markChange real,
    markPercentChange real,
    intrinsicValue real,
    inTheMoney boolean
);
""".format(table_name) 

create_index_statement = f"""
    CREATE UNIQUE INDEX IF NOT EXISTS {index_name} ON {table_name} (
        symbol, tradeTimeInLong, quoteTimeInLong
    );
"""