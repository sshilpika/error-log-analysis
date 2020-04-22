from ela import app
from flask import render_template
import os
from flask import Flask, g
import flask_sijax
import pandas as pd
import json

import ela.tot_gen_files
from ela.tot_gen_files import save_tot_files
from ela.rnn_clouds_timeframe import getRnnTimeFramed
from ela.ml_2stage_processing import get_predicted_job_exit_status
from ela.sedc_group import Sedc_Group

from keras.models import load_model

import sqlite3
from sqlalchemy import create_engine
import os.path
import math
from sqlalchemy_utils import database_exists, create_database



path = os.path.join('.', os.path.dirname(__file__), 'static/js/sijax/')


df = {}

@flask_sijax.route(app, '/')
def ela():

    def get_clouds(obj_response, month, jname, component_names):
        # section contains incomplete data... need to annonymize

        obj_response.script('zoomTimeLine(5, 100)')


    def get_job_exit_status(obj_response):

        df_tail = df["df_tail"]
        df_1 = df_tail.loc[:,df_tail.columns != "ALL"]

        pred_results = get_predicted_job_exit_status(df_1, df['rnn_words'])

        jstage1 = max(pred_results[0].tolist(),key=pred_results[0].tolist().count)
        jstage2 = max(pred_results[1].tolist(),key=pred_results[1].tolist().count)

        obj_response.script('appendJobStatus('+str(jstage1)+','+str(jstage2)+',"'+str(df['jname'])+'")')

    def get_rnn_clouds(obj_response, doc, datetime, num_topics):

        allrnn, rnn_words = getRnnTimeFramed(df["df_ALL"])

        df['rnn_words'] = rnn_words
        obj_response.script('appendRnnData(5, '+str(rnn_words)+',false)')
    
    def get_jobs(obj_response, filename, jname):
        
        dfj = pd.read_csv(filename)
        dicts = list(dfj.T.to_dict().values())
        df['jname'] = jname

        obj_response.script('addJobTable('+str(dicts)+')')

    def getSEDC(obj_response):
        
        from datetime import datetime, timedelta
        cnames = df['component_names']
        se = datetime.strptime(df["df_tail"].iloc[0]['START_TIMESTAMP'], "%Y-%m-%d %H:%M:%S") - timedelta(minutes=15)
        ee = datetime.strptime(df["df_tail"].iloc[0]['EVENT_TIMESTAMP'], "%Y-%m-%d %H:%M:%S") + timedelta(minutes=30)

        j_se = se.strftime("%Y-%m-%dT%H:%M:%SZ")
        j_ee = ee.strftime("%Y-%m-%dT%H:%M:%SZ")

        sg = Sedc_Group()
        result_sedc, se_e, ee_e = sg.get_sedc_group(cnames, j_se, j_ee)

        json1 = json.dumps(result_sedc[0])
        
        obj_response.script('addSEDCplot('+str(result_sedc)+',"'+str(se_e)+'","'+str(ee_e)+'")')



    def includeJobFeedback(obj_response, new_exit_status_value):
        print("new_exit_status_value",new_exit_status_value)

        # save updated job exit status in DB


    def get_job_se(obj_response):
        
        se = df["df_tail"].iloc[0]['START_TIMESTAMP']
        ee = df["df_tail"].iloc[0]['EVENT_TIMESTAMP']

        obj_response.script('appendJobSELines("'+str(se)+'","'+str(ee)+'")')


    if g.sijax.is_sijax_request:
        g.sijax.register_callback('get_clouds', get_clouds)
        g.sijax.register_callback('get_rnn_clouds', get_rnn_clouds)
        g.sijax.register_callback('get_job_exit_status', get_job_exit_status)
        g.sijax.register_callback('get_jobs', get_jobs)
        g.sijax.register_callback('getJobSE', get_job_se)
        g.sijax.register_callback('getSEDC', getSEDC)
        g.sijax.register_callback('includeJobFeedback', includeJobFeedback)

        return g.sijax.process_request()

    return render_template("index.html")



    
