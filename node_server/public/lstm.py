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
import math

# script for returning elevation from lat, long, based on open elevation data
# which in turn is based on SRTM

def get_coords():
    lines = sys.stdin.readlines()
    t = lines[0].split(',')
    l = t[-1].split('\n')
    t[-1] = l[0]
    coords = np.array(t, dtype=np.float)
    nsteps = 5
    return coords, nsteps

def get_angle(p1, p2):
    x_1 = np.asarray([p1[0], p1[1]])
    x_2 = np.asarray([p2[0], p2[1]])
    x_1_p = x_1 - x_2
    x_2_p = x_2 - x_2

    if x_2[0] > x_1[0]: # positive quad
        return np.rad2deg(math.acos(np.dot([0, -1], x_1_p)/(np.linalg.norm([0, -1])*np.linalg.norm(x_1_p))))
    else: # negative case
        return -np.rad2deg(math.acos(np.dot([0, -1], x_1_p)/(np.linalg.norm([0, -1])*np.linalg.norm(x_1_p))))

def determine_direction(main_point, query_point, output_length=9):
    # here I want to find the direction between 2 points
    grid = np.zeros((output_length, 1))
    grid = grid.reshape((3, 3))
    center_i, center_j = grid.shape[0]//2, grid.shape[0]//2
    angle = get_angle(main_point, query_point)
    value = 1
    y = -1
    if (-22.5 < angle and angle <= 22.5): # east
        grid[center_i, center_j+1] = value
        y = 4
    elif(22.5 < angle and angle <= 67.5): # north east
        grid[center_i-1, center_j+1] = value
        y = 3
    elif(67.5 < angle and angle <= 112.5): # north
        grid[center_i-1, center_j] = value
        y = 2
    elif(112.5 < angle and angle <= 157.5): # north west
        grid[center_i-1, center_j-1] = value
        y = 1
    elif(-67.5 < angle and angle <= -22.5): # south east
        grid[center_i+1, center_j+1] = value
        y = 5
    elif(-112.5 < angle and angle <= 67.5): # south
        grid[center_i+1, center_j] = value
        y = 6
    elif(-157.5 < angle and angle <= -112.5): # south west
        grid[center_i+1, center_j-1] = value
        y = 7
    elif(angle >= 157.5 or angle <= 157.5): # west
        grid[center_i, center_j-1] = value
        y = 8
    return y-1, grid

def distance(coord1_lat, coord1_long, coord2_lat, coord2_long):
    '''
    haversine distance
    coord1_lat=latitude of first cooridinate
    coord2_lat=latitude of first cooridinate
    coord1_long=longitude of first cooridinate
    coord2_long=longitude of first cooridinate

    '''
    radius_earth = 6371 # radius of the earth in km
    lat = math.radians(coord1_lat-coord2_lat)
    long = math.radians(coord1_long-coord2_long)
    a = (math.sin(lat/2) * math.sin(lat/2))+((math.cos(math.radians(coord1_lat))*math.cos(math.radians(coord2_lat)))*((math.sin(long/2)*math.sin(long/2))))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = radius_earth * c # getting the distance in km
    return distance


def generate_input(point_1, point_2, frp_1, frp_2, hours, weeks, first=True, y_p=None):
    # X = []
    y_i, grid_i = determine_direction(point_1, point_2)
    if first:
        x1 = [0]
        x1.extend(list(np.array(point_1[:-1])/100))
        x1.append(frp_1)
        x1.append(point_1[-1])
        x1.extend(list(hours))
        x1.extend(list(weeks))
        x1 = np.array(x1)
        x2 = [y_i]
        x2.extend(list(np.array(point_2[:-1])/100))
        x2.append(frp_2)
        x2.append(point_2[-1])
        x2.extend(list(hours))
        x2.extend(list(weeks))
        x2 = np.array(x2)
        X = np.array([x1, x2])
        first = False
    else:
        x1 = [y_p]
        x1.extend(list(np.array(point_1[:-1])/100))
        x1.append(frp_1)
        x1.append(point_1[-1])
        x1.extend(list(hours))
        x1.extend(list(weeks))
        x1 = np.array(x1)
        x2 = [y_i]
        x2.extend(list(np.array(point_2[:-1])/100))
        x2.append(frp_2)
        x2.append(point_2[-1])
        x2.extend(list(hours))
        x2.extend(list(weeks))
        x2 = np.array(x2)
        X = np.array([x1, x2])
    return X

def get_elevation(point):
    lat = point[0]
    lon = point[1]
    URL = 'https://elevation-api.io/api/elevation?points=' + '(' + str(lat) + ',' + str(lon) + ')&key=-3aUREs6J1xZD-UA3F1AkfVbag-cB3'
    # print(URL)
    # URL = 'https://api.open-elevation.com/api/v1/lookup\?locations\= ' + str(lat) + ',' + str(lon) + '\ '
    r = requests.get(url=URL)
    data = r.json()
    # print(data)
    # print(data['elevations'][0]['elevation'])
    return data['elevations'][0]['elevation']

def get_new_point(points, y_pred):
    point_old = points[-2]
    point = points[-1]
    lat_diff = abs(point[0]-point_old[0])
    lon_diff = abs(point[1]-point_old[1])
    new_point = []
    # print(lat_diff, lon_diff)
    # print(y_pred)
    if y_pred == 0:
        # north west
        new_point.append(point[0] + lat_diff)
        new_point.append(point[1] - lon_diff)
    elif y_pred == 1:
        # north
        new_point.append(point[0] + lat_diff)
        new_point.append(point[1])
    elif y_pred == 2:
        # north east
        new_point.append(point[0] + lat_diff)
        new_point.append(point[1] + lon_diff)
    elif y_pred == 3:
        # west
        new_point.append(point[0])
        new_point.append(point[1] - lon_diff)
    elif y_pred == 4:
        # east
        new_point.append(point[0])
        new_point.append(point[1] + lon_diff)
    elif y_pred == 5:
        # south west
        new_point.append(point[0] - lat_diff)
        new_point.append(point[1] - lon_diff)
    elif y_pred == 6:
        # south
        new_point.append(point[0] - lat_diff)
        new_point.append(point[1])
    elif y_pred == 7:
        # south east
        new_point.append(point[0] - lat_diff)
        new_point.append(point[1] + lon_diff)
    return new_point



if __name__ == '__main__':
    coords, nsteps = get_coords()
    # get_coords()
    # print(coords, nsteps)
    points = []
    print('loading model')
    model = load_model('/home/rylan/Desktop/wildfire_simulation_app/node_server/public/lstm_3.h5')
    print('model loaded')
    today = date.today()
    # print(today.hour)
    point_1 = list(coords[:2])
    point_2 = list(coords[2:])
    points.append(point_1.copy())
    points.append(point_2.copy())
    point_1.append(get_elevation(point_1))
    point_2.append(get_elevation(point_2))

    print('Starting')
    year, week, day_of_week = today.isocalendar()
    hour = datetime.datetime.now().hour
    weeks = np.zeros(52)
    hours = np.zeros(24)
    hours[hour-1] = 1
    weeks[week-1] = 1
    # for i in range(n_steps):
    frp_1 = random.random()
    frp_2 = random.random()
    X = np.array(generate_input(point_1, point_2, frp_1, frp_2, hours, weeks, first=True, y_p=None))
    X = X.reshape((1, X.shape[0], X.shape[1]))
    y_pred = []
    y_pred.append(model.predict_classes(X)[0])
    # print(X)
    # print(X.shape)
    # print('Starting n steps')
    # print(y_pred[0])
    for i in range(nsteps):
        new_point = get_new_point(points.copy(), y_pred[i])
        points.append(np.array(new_point.copy()))
        old_point = list(points[i+1])
        new_point.append(get_elevation(new_point.copy()))
        old_point.append(get_elevation(old_point.copy()))

        frp_1 = random.random()
        frp_2 = random.random()

        X = np.array(generate_input(old_point.copy(), new_point.copy(), frp_1, frp_2, hours, weeks, first=False, y_p=y_pred[i].copy()))
        X = X.reshape((1, X.shape[0], X.shape[1]))
        y_pred.append(model.predict_classes(X)[0])

    points = np.array(points)
    print(points)
    points_df = pd.DataFrame(points[1:])
    print(points_df)
    print('Writing to CSV')
    # print(os.getcwd())
    points_df.to_csv(r'/home/rylan/Desktop/wildfire_simulation_app/node_server/public/predicted_points.csv', index=None, header=True)
    print('CSV Created')
    print('done')
