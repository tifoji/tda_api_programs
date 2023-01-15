import logging
import os
import yaml
from tda.auth import easy_client
from tda.streaming import StreamClient


# Some common variables initialized from the yaml files
script_dir = os.path.dirname(os.path.abspath(__file__))
user_config_folder = os.path.join(script_dir, 'user_config')

# Authentication for stream client
tda_credentials_file = os.path.join(user_config_folder, 'tda_credentials.yaml')
with open(tda_credentials_file, 'r') as f:
    tda_credentials = yaml.load(f, Loader=yaml.FullLoader) 
client = easy_client(
        api_key=tda_credentials['API_KEY'],
        redirect_uri=tda_credentials['REDIRECT_URI'],
        token_path=tda_credentials['TOKEN_PATH'])
stream_client = StreamClient(client, account_id=tda_credentials['ACCOUNT_ID'])

# Threading config
basic_config_file = os.path.join(user_config_folder, 'basic_config.yaml')
with open(basic_config_file, 'r') as f:
    config = yaml.safe_load(f)
maxProducerThreads = config['threading']['maxProducerThreads']
maxConsumerThreads = config['threading']['maxConsumerThreads']
sleepTime = config['pauseTimeBetweenRuns']['sleepTime']

# Logging config
log_file_folder = os.path.join(script_dir, 'log')
log_config_file = os.path.join(user_config_folder, 'log_config.yaml')
with open(log_config_file, 'r') as f:
    log_config = yaml.safe_load(f)
log_file = os.path.join(log_file_folder, log_config['filename'])
logging.basicConfig(filename=log_file, level=logging.getLevelName(log_config['level']))
#Suppress authentication INFO level messages. change to INFO in yaml to see them
logging.getLogger(log_config['suppress']['logger']).setLevel(logging.getLevelName(log_config['suppress']['level']))

# Ticker list config
tickers_config_file = os.path.join(user_config_folder, 'tickers.yaml')
with open(tickers_config_file, 'r') as f:
    tickers_config = yaml.safe_load(f)
ticker_list = tickers_config["ticker_list"]



