# error-log-analysis


### InfluxDB Setup

InfluxDB is an open-source time series database developed by InfluxData. InfluxDB is designed to
handle time series data more efficiently. The datastore provides a SQL-like language to query the data, called InfluxQL, which makes it easy for the developers to integrate into their applications.

1. Download binaries and unzip

    ```
    wget https://dl.influxdata.com/influxdb/releases/influxdb-{{VERSION}}.tar.gz
    tar xvfz influxdb-{{VERSION}}.tar.gz
    ```
    
2. Set correct paths in the config file "path-of-download/etc/influxdb/influxdb.conf"

    ```$xslt
    influxd -config ./etc/influxdb/influxdb.conf
    ```

3. Start influxd server in the background

    ```
    ./usr/bin/influxd &
    ```

4. Run influx
   ```
   ./usr/bin/influx
   ```
5. Set InfluxDB configuration path before import to set custom configuration options
    ```$xslt
    influxd -config ./etc/influxdb/influxdb.conf
    echo $INFLUXDB_CONFIG_PATH=./etc/influxdb/influxdb.conf
    ```
6. To import databases 
    ```
    influx -import -path=backup.file -precision=preferred-precision
    ```


### SQLDB Setup

1. software requirements for sql setup
SQLAlchemy is a library that facilitates the communication between Python programs and databases. This library is used as an Object Relational Mapper (ORM) tool that translates Python classes to tables on relational databases and automatically converts function calls to SQL statements. SQLAlchemy also provides a standard interface that allows developers to create database-agnostic code to communicate with a wide variety of database engines.
	```
	pip3 install pandas numpy SQLAlchemy
	python3 ./setup/sqlsetup.py dbpath dbname log_file_path
	```

### Front-end Visualization Setup

1. pip3 install -r ./ELA/requirements.txt


2. FLASK server
	```
	cd ELA
	./start.sh
	```

