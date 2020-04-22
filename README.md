# error-log-analysis


### InfluxDB Setup

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


### SQL Setup

1. software requirements for sql setup
```
pip3 install pandas numpy SQLAlchemy
```

2. python3 ./setup/sqlsetup.py dbpath dbname log_file_path

### Front-end Visualization Setup

1. pip3 install -r ./ELA/requirements.txt


2. FLASK server
	```
	cd ELA
	./start.sh
	```

