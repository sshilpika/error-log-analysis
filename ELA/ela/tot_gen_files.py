import numpy as np
import pickle
import pandas as pd
import json
import re
import matplotlib.pyplot as plt
import sys
sys.path.append("../../")
from tot import TopicsOverTime
import datetime
import fileinput
import random
import scipy.special
import math
import numpy as np
import matplotlib.pyplot as plt
import scipy.stats
from scipy.stats import beta
import pickle
from keras.preprocessing.text import Tokenizer, text_to_word_sequence

import sqlite3
from sqlalchemy import create_engine
import os.path
import math
from sqlalchemy_utils import database_exists, create_database

stopwords = ['of', 'the', 'a', 'to', 'in', 'to', 'and', 'by', 'detected',
             'an', 'with', 'request', 'converter', '\n', '', ]

def getConcatenatedStrings(err_text):
    ec = err_text.ERROR_CATEGORY_STRING.lower()
    em = err_text.ERROR_MESSAGE
    em_words = text_to_word_sequence(em, filters='!"#$%&()*+,-./:;<=>?@[\\]^_`{|}~\t\n', lower=True, split=' ')
    return '_'.join([ec]+em_words)

def err_map_str(x):
    jsn = json.loads(x)
    f_res = ""
    for k, v in jsn.items():
        if isinstance(v, dict):
            res = list(zip(v.keys(),v.values()))
            for i in res:
                f_res= f_res+" "+k+"-"+str(i[0])+"_"+str(i[1])
        else:
            f_res= f_res+" "+k+"-"+str(v)
    return f_res

def err_map_str_spaces(x):
    jsn = json.loads(x)
    f_res = ""
    for k, v in jsn.items():
        if isinstance(v, dict):
            res = list(zip(v.keys(),v.values()))
            for i in res:
                f_res= f_res+" "+k+" "+str(i[0])+"_"+str(i[1])
        else:
            f_res= f_res+" "+k+"_"+str(v)
    return f_res

def dictify(x):
    d = json.loads(x)


def joinStrBy(x, s, j):
    lis = x.split(s)
    return j.join(lis)

def formatCname(x):
    lis = x.split("-")
    return lis[0]+lis[1]


def cleanData(data):
    # Remove new line characters
    data = [re.sub('\s+', ' ', sent) for sent in data]
    data = [re.sub("\'", "", sent) for sent in data]
    data = [re.sub("[^a-zA-Z0-9_-]+[0-9]{1,}", "", sent) for sent in data]
    
    return data

def lemmatization(model, text, allowed_posttags=['NOUN', "ADJ", "VERB", "ADV"]):
    sent_out = []

    for sent in text:
        lemma_out = nlp(" ".join(sent))
        sent_out.append(" ".join([token.lemma_ if token.lemma_ not in ['-PRON-'] else "" \
                         for token in lemma_out if token.pos_ not in allowed_posttags]))
    return sent_out


def tot_fit(fname, resultspath, datapath, max_iter=200):

        documents_path = datapath + '/alltitles_'+fname
        timestamps_path = datapath + '/alltimes_'+fname
        stopwords_path = datapath + '/allstopwords'
        tot_topic_vectors_path = resultspath + '/ela_tot_topic_vectors_'+fname+'.csv'
        tot_topic_mixtures_path = resultspath + '/ela_tot_topic_mixtures_'+fname+'.csv'
        tot_topic_shapes_path = resultspath + '/ela_tot_topic_shapes_'+fname+'.csv'
        tot_pickle_path = resultspath + '/ela_tot_'+fname+'.pickle'

        tot = TopicsOverTime()
        documents, timestamps, dictionary = tot.GetPnasCorpusAndDictionary(documents_path, timestamps_path, stopwords_path)
        par = tot.InitializeParameters(documents, timestamps, dictionary, max_iter)
        theta, phi, psi = tot.TopicsOverTimeGibbsSampling(par)
        np.savetxt(tot_topic_vectors_path, phi, delimiter=',')
        np.savetxt(tot_topic_mixtures_path, theta, delimiter=',')
        np.savetxt(tot_topic_shapes_path, psi, delimiter=',')
        tot_pickle = open(tot_pickle_path, 'wb')
        pickle.dump(par, tot_pickle)
        tot_pickle.close()


def save_dates_topics(df, res_datapath):
    df_ts = df[['topic', 'doc', 'datetime']]
    df_ts['link'] = df_ts['doc'].apply(lambda z:"{0}words_per_datetime_doc{1}.csv".format(res_datapath,z))
    df_ts['jobfail'] = df_ts['doc'].apply(lambda z: random.randint(0,1))
    df_ts['second'] = pd.to_datetime(df.datetime).dt.second

    return df_ts

def save_word_scores(df_tmp, remove_cols, res_datapath):
    indx = df_tmp.columns.values.tolist()

    for i in remove_cols:
        indx.remove(i)

    df_tmp_filt = df_tmp[indx]
    df_tmp_filtT = df_tmp_filt.T
    doc = df_tmp['doc'].values[0]
    timestmp = df_tmp['datetime'].values[0]
    df_per_ts = pd.DataFrame(columns=['twords', 'score']+remove_cols)


    for col in df_tmp_filtT.columns.values: #col is topic number
        largest_cols = df_tmp_filtT[col].nlargest(n=6, keep="first")
        largest_cols = largest_cols.reset_index()
        largest_cols.rename(columns={"index":'twords',col:'score'}, inplace=True)
        largest_cols['topic'] = [col] * largest_cols.shape[0]
        largest_cols['doc'] = [doc] * largest_cols.shape[0]
        largest_cols['datetime'] = [timestmp] * largest_cols.shape[0]
        df_per_ts = pd.concat((df_per_ts, largest_cols), axis=0, ignore_index=True)
    
    filename = "{0}/words_per_datetime_doc{1}.csv".format(res_datapath,doc)
    df_per_ts.to_csv(filename,index=False)
    return df_per_ts

def getTotScore(x, topic):
    tmp = pd.read_csv("ela/static/"+x)
    t_topic = tmp[tmp.topic == topic]
    return round(t_topic.score.sum(),3)


def save_tot_files(df_filt, month, jname, component_names, max_iter=200):

    df_tail = df_filt.iloc[-30:]
    df_1 = df_filt.iloc[:-20]

    df_1["cname"] = df_1["cname"].apply(lambda x: formatCname(x))
    df_1['EVENT_TIMESTAMP']  = pd.to_datetime(df_1['EVENT_TIMESTAMP'])
    df_1.sort_values(by='EVENT_EPOCH', ascending=True,inplace=True)

    df_1['ERROR_MAP_STR'] = df_1['ERROR_MAP'].apply(lambda x:err_map_str_spaces(x) )
    cols = [] # list of all columns from the dataset. removed here for privacy
    df = df_1[cols]

    df["ERROR_MESSAGE"] = df["ERROR_MESSAGE"].apply(lambda x: joinStrBy(x," ", "_"))
    df['ALL'] = df.iloc[:,:4].apply(lambda x: ' '.join(x), axis=1)
    df.ALL = df.ALL.apply(lambda x: x.lower())
    df.sort_values(by='EVENT_EPOCH', ascending=True,inplace=True)

    df['ALL_RNN'] = df[['ERROR_CATEGORY', 'ERROR_MESSAGE']].apply(lambda z: getConcatenatedStrings(z), axis=1)

    df_time_groups_list = []
    time_epoch = []
    err_msgs = []

    for name, group in df.groupby(pd.Grouper(key='EVENT_TIMESTAMP', freq='30s')):

        if len(set(group["EVENT_TIMESTAMP"])) >0:

            min_ts = min(set(group["EVENT_EPOCH"]))
            time_epoch.append(min_ts)
            lis = [i for i in set(" ".join(group["ALL"].to_list()).split(" ")) if i != ""]
            err_msgs.append(" ".join(lis))
            df_time_groups_list.append(group)


    datawords = cleanData(err_msgs)
    time_res = []
    for i in range(len(datawords)):
        time_res.append(str(1)+" "+str(time_epoch[i]))

    fname = 'test1'

    with open("ela/static/data_tot/alltitles_"+fname, "w") as f:
        for i in datawords:
            f.write(i+"\n")

    with open("ela/static/data_tot/alltimes_"+fname, "w") as f:
        for i in time_res:
            f.write(i+"\n")


    word_dict = []

    datapath = 'ela/static/data_tot'
    resultspath = datapath+'/results'

    tot_fit(fname, resultspath, datapath, max_iter)

    df_topic_mixtures = pd.read_csv(resultspath+"/ela_tot_topic_mixtures_"+fname+".csv", header=None)
    ela_tot_topic_vectors = pd.read_csv(resultspath+"/ela_tot_topic_vectors_"+fname+".csv", header=None)

    topic_docs = []
    for doc in range(df_topic_mixtures.shape[0]):
        topics_per_doc = df_topic_mixtures.iloc[doc].tolist()
        #denormalize
        tmax = np.max(topics_per_doc)
        tmin = np.min(topics_per_doc)
        topics_per_doc_denorm = [(i*(tmax - tmin))+tmin for i in topics_per_doc]

        topic_words = {}
        for topic_id,topic in enumerate(topics_per_doc_denorm):
            topic_all_words = ela_tot_topic_vectors.iloc[topic_id].tolist()
            #denormalize
            tpmax = np.max(topic_all_words)
            tpmin= np.min(topic_all_words)
            topic_all_words_denorm = [ (i * (tpmax - tpmin))+tpmin for i in topic_all_words]
            word_dist_doc = [word * topic for word in topic_all_words_denorm]
            #normalize
            wmax = np.max(word_dist_doc)
            wmin = np.min(word_dist_doc)
            word_dist_doc_norms = [(i - wmin)/(wmax - wmin) for i in word_dist_doc]

            topic_words[topic_id] = word_dist_doc_norms
        topic_docs.append(topic_words)

    pick_in = open(resultspath+"/ela_tot_"+fname+".pickle", "rb")
    res = pickle.load(pick_in)

    times = time_res
    times = [i.split(" ")[1].split('\n')[0] for i in times]
    times_stftime = [datetime.datetime.fromtimestamp(int(i)).strftime("%Y-%m-%d %H:%M:%S") for i in times ]

    df = pd.DataFrame()
    num_topics = 5
    for ind, doc in enumerate(topic_docs):
        df_tmp = pd.DataFrame.from_dict(doc,orient='index', columns=res['word_token'])
        df_tmp['topic'] = doc.keys()
        df_tmp['doc'] = [ind] * num_topics
        df_tmp['datetime'] = [times_stftime[ind]] * num_topics
        df_tmp.fillna(0,inplace=True)
        save_word_scores(df_tmp, ['topic', 'doc', 'datetime'], datapath)
        df= pd.concat((df, df_tmp), axis=0)


    num_topics = 5
    df_one_topic = df[df.topic == 0]
    res_df_ts = save_dates_topics(df_one_topic, './data_tot/')

    res_df_ts['index'] = np.arange(res_df_ts.shape[0])
    path = datapath+"/topic_doc_first_test.csv"

    for i in range(num_topics):
        res_df_ts['topic_score_'+str(i)] = res_df_ts.link.apply(lambda x: getTotScore(x,i))

    res_df_ts.to_csv(path, index=False)

    return (df_tail, df_one_topic)
