from keras.models import load_model
import pandas as pd
from keras.preprocessing.text import Tokenizer, text_to_word_sequence
import re
import json
import numpy as np
from sklearn.utils import shuffle

# Theta CABINETS
def getCNAME_COL(cname, group, col=None):
    match = re.search(r'c([0-9]+)-([0-1])c([0-2])s([0-9]+)(\D*[0-9]*)(\D*[0-9]*)', cname)
    if col is None and not isinstance(group, list):
        return match.group(group)
    elif not isinstance(group, list):
        matched = match.group(group)
        if col in matched:
            return matched.split(col)[1]

    else:
        for g in group:
            matched = match.group(g)
            if col in matched:
                return matched.split(col)[1]

    return -1

def getConcatenatedStrings(err_text):
    ec = err_text.ERROR_CATEGORY.lower()
    em = err_text.ERROR_MESSAGE
    em_words = text_to_word_sequence(em, filters='!"#$%&()*+,-./:;<=>?@[\\]^_`{|}~\t\n', lower=True, split=' ')
    return '_'.join([ec]+em_words)


def create_train_valid(features,
                       labels,
                       num_words):
    """Create validation features and labels."""

    X_valid = np.array(features)
    y_valid = np.zeros((len(labels), num_words), dtype=np.int8)

    for example_index, word_index in enumerate(labels):
        y_valid[example_index, word_index] = 1

    import gc
    gc.enable()
    del features, labels
    gc.collect()

    return X_valid, y_valid


# some of the data manipulation steps have been removed because of data privacy issues
def getRnn(df_JH, df_words, doc, dt, num_topics):

    word_idx = None
    idx_word = None
    RANDOM_STATE = 50
    BATCH_SIZE = 2048

    model_dir = 'ela/static/models/'

    with open('ela/static/models/word_idx_all.json', 'r') as f:
        word_idx = json.load(f)

    with open('ela/static/models/idx_word_all.json', 'r') as f:
        idx_word = json.load(f)

    model = load_model(model_dir+"pre-trained-vis-rnn.h5")

    df_JH['EXIT_STATUS_FLAG'] = df_JH['EXIT_STATUS'].apply(lambda x: x if x==0 else 1)
    emessage = list(set(df_JH["ERROR_MESSAGE"]))
    df_JH['ERROR_MESSAGE_ID'] = df_JH["ERROR_MESSAGE"].apply(lambda x: emessage.index(x))
    # user can include more data manipulation steps here.
    df_JH['CCT'] = df_JH[['ERROR_CATEGORY', 'ERROR_MESSAGE']].apply(lambda z: getConcatenatedStrings(z), axis=1)

    rnn_input_list = []
    for name, group in df_JH.groupby(by='COMPONENT_NAME'):
        
        group.sort_values(by='EVENT_TIMESTAMP', inplace=True)
        rnn_input_list.append(group.CCT.tolist())

    sequences = []
    for i in rnn_input_list:
        sequences.append([word_idx[j.lower()] if j.lower() in word_idx.keys() else 0 for j in i ])

    features = []
    labels = []
    training_length = 10

    for seq in sequences:
        for i in range(training_length, len(seq)):
            extract = seq[i - training_length:i + 1]
            features.append(extract[:-1])
            labels.append(extract[-1])

    features = np.array(features)
    num_words = len(word_idx) + 1

    X_valid, y_valid = create_train_valid(features, labels, num_words)

    tr = model.predict(X_valid, batch_size=2048, verbose=1)
    result_vals = []
    
    for ind,i in enumerate(tr):
        maxi= i.tolist().index(max(i))
        result_vals.append(idx_word[str(maxi)])

    return result_vals


def getRnnTimeFramed(df_filt):
    
    df_filt['EVENT_TIMESTAMP'] = pd.to_datetime(df_filt['EVENT_TIMESTAMP'])

    word_idx = None
    idx_word = None

    with open('ela/static/models/word_idx_all.json', 'r') as f:
        word_idx = json.load(f)

    with open('ela/static/models/idx_word_all.json', 'r') as f:
        idx_word = json.load(f)

    model_dir = 'ela/static/models/'
    model = load_model(model_dir+"pre-trained-vis-rnn.h5")

    print("processing dataframe now..")
    list_cname_tgroups = [] # list of dict of cname and timegroup list
    list_cname_time = []
    for name, group in df_filt.groupby("COMPONENT_NAME"):
        cname_tgroup_dict = {}
        dict_cname_time = {}
        cname_tgroup_dict['cname'] = name
        cname_tgroup_dict['tgroups'] = [] # list of dict of timeframe and dataframes of time groups
        
        dict_cname_time['name'] = name
        dict_cname_time['pred_words'] = []
        
        for time, group_t in group.groupby(pd.Grouper(key='EVENT_TIMESTAMP', freq='10T')):
            tgroup_dict = {}
            if group_t.shape[0] > 10:
                pred_words = list(set(getRnn(group_t, word_idx, idx_word, model)))
                tgroup_dict['pred_words'] = pred_words
                if(len(pred_words) !=0):
                    tgroup_dict['timeframe'] = time.strftime("%Y-%m-%d %H:%M:%S")
                    cname_tgroup_dict['tgroups'].append(tgroup_dict)
                    dict_cname_time['pred_words'].append(pred_words)
        
        if len(cname_tgroup_dict['tgroups']) !=0:
            list_cname_tgroups.append(cname_tgroup_dict)
        
        if len(dict_cname_time['pred_words']) != 0:
            list_cname_time.append(dict_cname_time)
    
    list_cname_time_formatted = [i['name']+" -> "+str(list(np.hstack(i['pred_words']))) for i in list_cname_time]

    return list_cname_tgroups, list_cname_time_formatted