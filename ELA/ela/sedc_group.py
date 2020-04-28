
from influxdb import InfluxDBClient
import pandas as pd
import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sklearn import preprocessing
import datetime


class Sedc_Group():

    def __init__(self):
        self.client = InfluxDBClient(host='localhost', port=8086)
        self.client.switch_database('sedc_test')
        self.measurements = [i['name'] for i in self.client.get_list_measurements()]



    def formatDate(self, date):
        d = " ".join(date.split(".")[0].split("T"))
        d = d.split("Z")[0] if "Z" in d else d
        return datetime.datetime.strptime(d, "%Y-%m-%d %H:%M:%S")



    def get_sedc_group(self, cnames, j_se, j_ee):

        cname_slots = list(set([i.split("n")[0]  for i in cnames]))
        se = j_se
        ee = j_ee

        result_pd_list = []
        result_times = []
        for i in cname_slots:
            for j in [i for i in self.measurements]:
                q = "SELECT * FROM "+j+" where cname=\'"+i+"\' and time>='"+se+"' and time<='"+ee+"'"
                result_set = self.client.query(q)
                if ("series" in result_set.raw.keys()):
                    result_dict = result_set.raw['series'][0]
                    res_values = np.array(result_dict['values'])
                    df_tmp = pd.DataFrame(res_values, columns=result_dict['columns'])
                    result_times.append(res_values[:,0].tolist())
                    result_pd_list.append({result_dict['name']+"_"+i: df_tmp})


        print("Collected result set from DB", len(result_pd_list))

        if len(result_pd_list) == 0:
            for i in cname_slots:
                for j in self.measurements:
                    q = "SELECT * FROM "+j+" where cname=\'"+i+"\' and time>='"+se+"' and time<='"+ee+"'"
                    result_set = self.client.query(q)
                    if ("series" in result_set.raw.keys()):
                        result_dict = result_set.raw['series'][0]
                        res_values = np.array(result_dict['values'])
                        df_tmp = pd.DataFrame(res_values, columns=result_dict['columns'])
                        result_times.append(res_values[:,0].tolist())
                        result_pd_list.append({result_dict['name']+"_"+i: df_tmp})

        # collecting time for all cnames and measurements and sorting these times
        result_times = []
        for i in result_pd_list:
            k = list(i.keys())[0]
            val = i[k]
            val['time'] = val.time.apply(lambda x: self.formatDate(x))
            result_times += val['time'].tolist()

        df_all_times = sorted(set(result_times))
        df_all = pd.DataFrame(index = df_all_times)


        for i in result_pd_list:
            k = list(i.keys())[0]
            val = i[k]
            val.set_index("time", inplace=True)
            df_all[k] = val.value


        df_all.fillna(method='ffill', inplace=True)
        df_all.fillna(method='bfill', inplace=True)
        x = df_all.T.values
        min_max_scaler = preprocessing.MinMaxScaler()
        x_scaled = min_max_scaler.fit_transform(x)
        dfT = pd.DataFrame(x_scaled, columns=df_all_times)

        model = AgglomerativeClustering(n_clusters=5)
        model = model.fit(x_scaled)

        print("AgglomerativeClustering done!")

        dfT['cluster'] = model.labels_
        df_g = dfT.T

        df_g.columns = df_all.columns
        df_gT = df_g.T
        result_set_sedc = []
        for name, group in df_gT.groupby('cluster'):
            sedc_dict = {}
            sedc_dict['cluster_name'] = int(name)
            sedc_dict['measurements'] = group.index.tolist()
            group.drop(columns=["cluster"], inplace=True)
            sedc_dict['cluster_group'] = group.to_numpy().tolist()
            sedc_dict['cluster_group_time'] = [i.strftime("%Y-%m-%d %H:%M:%S") for i in group.columns]
            sedc_dict["cluster_mean"] = group.mean(axis=0).tolist()
            result_set_sedc.append(sedc_dict)

        print("Mean function computation done!")

        return result_set_sedc, df_all_times[0], df_all_times[-1]
