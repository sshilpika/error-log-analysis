import pandas as pd
import numpy as np
import sqlite3
import os.path
import sys
from sqlalchemy import create_engine
from sqlalchemy_utils import database_exists, create_database

def main():

    for dbpath, dbname, csv_file_path in sys.argv[1:]:
    	if dbpath == None or csv_file_path == None or dbname == None:
    		return "Argument list should contain DB path (in the form ./path/to/db/), dbname (in the form dbanme.db), and path of csv log data file"
        
        else:
        	
			engine = create_engine('sqlite:///'+db_path, echo=False)
			df_encoded = pd.read_csv(csv_file_path)
			db_name = dbname.split(".db")[0]
			df_encoded.to_sql(db_name, con=engine, if_exists='append')

if __name__ == "__main__":
    main()


