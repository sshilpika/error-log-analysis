import pickle

from sklearn import metrics
from sklearn.ensemble import RandomForestClassifier
from sklearn import preprocessing
import re
import pandas as pd
import numpy as np


def get_2stage_predictions(df_t, model, remove_cols, target):

    all_col_list = df_t.columns.to_list()
    [all_col_list.remove(i) for i in remove_cols]
    cols_string_dtypes = [c.split("_T")[0] for c in all_col_list if re.search(r"_T$",c) is not None]
    [all_col_list.remove(i) for i in cols_string_dtypes if i in all_col_list]

    col6 = all_col_list
    df_dt = df_t[col6]
    col5 = [col for col in df_dt.select_dtypes([np.object])]
    
    # label encoding of all object dtypes
    for c in col5:
        le = preprocessing.LabelEncoder()
        le.fit(list(set(df_dt[c])))
        df_dt[c+"_T"] = le.transform(df_dt[c].to_list())
    
    df_dt = df_dt.loc[:,~df_dt.columns.isin(col5)]


    X_test = df_dt.loc[:, df_dt.columns != target].to_numpy()
    y_pred = model.predict(X_test)

    return y_pred


def get_predicted_job_exit_status(df_JH, rnn_words):
    model_s1 = pickle.load(open("ela/static/models/stage1_model.sav", 'rb'))
    model_s2 = pickle.load(open("ela/static/models/stage2_model.sav", 'rb'))


# append RNN result to df
    df_t = df_JH.tail(1)
    err_cats = set(df_JH.ERROR_CATEGORY_STRING) # get all error categories!
    res_words = [(i ,j.split(i.lower()+"_")[1]) for i in err_cats for j in rnn_words if i.lower() in j]

    df_t = df_t.append([df_t]*(len(res_words)-1),ignore_index=True)
    df_t['CCT'] = rnn_words
    df_t["ERROR_CATEGORY"] =  [i[0] for i in res_words]
    df_t["ERROR_MESSAGE"] =  [i[1] for i in res_words]

    #list of unwanted columns that needs to removed before the predictions
    unwanted_col = ['EVENT_DATE_ID','Unnamed: 0'] ,

    exit_pass_fail = get_2stage_predictions(df_t, model_s1, unwanted_col+["EXIT_STATUS"], "EXIT_STATUS_FLAG")

    exit_code = get_2stage_predictions(df_t, model_s2, unwanted_col+["EXIT_STATUS_FLAG"], "EXIT_STATUS")

    return (exit_pass_fail, exit_code)



