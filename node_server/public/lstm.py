import tensorflow
from keras.models import load_model
import sys, json
import os
import numpy as np
from datetime import date
import datetime
import random
import requests
import pandas as pd

# script for returning elevation from lat, long, based on open elevation data
# which in turn is based on SRTM
def get_elevation(lat, long):
    query = ('https://api.open-elevation.com/api/v1/lookup'f'?locations={lat},{long}')
    r = requests.get(query).json()  # json object, various ways you can extract value
    # one approach is to use pandas json functionality:
    elevation = pd.io.json.json_normalize(r, 'results')['elevation'].values[0]
    return elevation

def get_coords():
    lines = sys.stdin.readlines()
    t = lines[0].split(',')
    l = t[-1].split('\n')
    t[-1] = l[0]
    coords = np.array(t, dtype=np.float)
    nsteps = 5
    return coords, nsteps

if __name__ == '__main__':
    coords, nsteps = get_coords()
    model = load_model('/home/rylan/Desktop/wildfire_simulation_app/node_server/public/lstm_3.h5')
    today = date.today()
    # print(today.hour)
    point_1 = coords[:2]
    point_2 = coords[2:]
    p1_ele = get_elevation(point_1[0], point_1[1])
    p2_ele = get_elevation(point_2[0], point_2[1])

    year, week, day_of_week = today.isocalendar()
    hour = datetime.datetime.now().hour
    weeks = np.zeros(52)
    hours = np.zeros(24)
    hours[hour-1] = 1
    weeks[week-1] = 1
    frp = random.random()
    # print(frp)
    print(p1_ele)
    print(p3_ele)
    print('done')
