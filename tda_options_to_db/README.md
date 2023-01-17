This project is a python script that captures option data snapshots every n seconds from TD Ameritrade's API and writes it to a postgres database. It includes code to handle errors and log important events. It also takes advantage of parallel processing, database connection pooling and the tda-api wrapper by @alexgolec and team.


## Getting started

To get started with this project, you will need to have python 3.6 or above installed on your system. I think it is a tda-api requirement. You will also need to have a TD Ameritrade developer account to access the API.

-   Clone the repository to your local system.
-   Create a virtual/conda/venv environment and activate it or use system python.
-   Run pip install -r requirements.txt to install all the required packages.


## Instructions 
At a minimum 3 files need user specific input before running the main script.

1.  `token.pickle` Place it in the `token` directory. Currently not supporting the token generation but you can use the tda-api example code to generate the token.
2.  `tda_credentials.yaml` in the `user_config` folder. This file should contain the following information:
-        `API_KEY`: Your TD Ameritrade developer account client ID
-        `REDIRECT_URI`: The redirect URI you used when creating your developer account
-        `ACCOUNT_ID`: Your TD Ameritrade Account ID
-        `TOKEN_PATH`: Full path to the token.pickle  WINDOWS: `D:/path/to/token.pickle`  *nix: `/path/to/token.pickle`

NOTE: If you already have a `token.pickle` file, you can skip the above step and just copy the file to the token directory. 

3.  `database_config.yaml` in the `user_config` folder. This file should contain the following information:
-        `user`: Your database username
-        `password`: Your database password
-        `host`: The hostname or IP address of your database server
-        `port`: The port number used by your database
-        `database`: The name of the database you want to use

Optionally include more tickers by editing `tickers.yaml` in the `user_config` directory, change the number of threads etc in `basic_config.yaml` &
`database_config.yaml`, change log levels in `log_config.yaml` etc.
By default some of the elements returned by the API are not stored. You can look at the list of elements in `db/columns.yaml` and should you choose to add any new element, update the create table statement in `db/db_statements.py` accordingly. However this shouldn't really be necessary as the columns dropped are not of much significance. Sample json respone in the samples folder give an idea of the json response structure 


### Execution

Just run `/path/to/python tda_option_chain_to_db.py`

To stop just press `ctrl+c`. The script will stop after the current iteration is complete. Or you can kill the process.


### Directory Structure
```
tda_options_to_db/
|-- tda_option_chain_to_db.py
|-- globals.py
|-- db/
    |-- db_globals.py
    |-- db_statements.py
    |-- columns.yaml
|-- user_config/
    |-- basic_config.yaml
    |-- tickers.yaml
    |-- log_config.yaml
    |-- database_config.yaml
    |-- tda_credentials.yaml
|-- log/
    |-- tda_option_flow.log
|-- requirements/
    |-- requirements.txt
|-- samples/
    |-- sample_api_response.json
    |-- sample_query.sql
    |-- sample_postgres_data.csv
|-- token/
    |-- token.pickle
```
