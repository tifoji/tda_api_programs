
import yaml
import os
from psycopg2.pool import ThreadedConnectionPool
from pathlib import Path

# Some common variables initialized from the yaml files
current_dir = Path(__file__).parent
main_dir = current_dir.parent
user_config_folder = os.path.join(main_dir, 'user_config')

# Database config and other database related variables
columns_config_folder = current_dir
columns_config_file = os.path.join(columns_config_folder, 'columns.yaml')
with open(columns_config_file, "r") as file:
    column_names = yaml.load(file, Loader=yaml.FullLoader)
    columns_to_keep = column_names["columns"]

database_config_file = os.path.join(user_config_folder, 'database_config.yaml')
with open(database_config_file, 'r') as f:
    database_config = yaml.load(f, Loader=yaml.FullLoader)
dbconfig = {
    'host': database_config['postgres']['host'],
    'port': database_config['postgres']['port'],
    'database': database_config['postgres']['database'],
    'user': database_config['postgres']['user'],
    'password': database_config['postgres']['password']
}
table_name = database_config['postgres']['table_name']
index_name = database_config['postgres']['index_name']
minThreadPoolSize=database_config['threading']['minThreadPoolSize']
maxThreadPoolSize=database_config['threading']['maxThreadPoolSize']
connection_pool = ThreadedConnectionPool(minThreadPoolSize, maxThreadPoolSize, **dbconfig)
