import tensorflow
from tensorflow.keras import backend
from keras.models import load_model
import sys
import json
import os
import numpy as np
from datetime import date
import datetime
import random
import requests
import pandas as pd
import math
import time


def get_coords():
    lines = input()
    coords = np.array(lines.split(','))
    dir = int(coords[-1])
    rnn = int(coords[-2])
    nsteps = int(coords[-3])
    coordinates = coords[:-3].astype(np.float)
    return coordinates, nsteps, rnn, dir


def get_angle(p1, p2):
    x_1 = np.asarray([p1[0], p1[1]])
    x_2 = np.asarray([p2[0], p2[1]])
    x_1_p = x_1 - x_2
    x_2_p = x_2 - x_2

    if x_2[0] > x_1[0]:  # positive quad
        return np.rad2deg(math.acos(np.dot([0, -1], x_1_p)/(np.linalg.norm([0, -1])*np.linalg.norm(x_1_p))))
    else:  # negative case
        return -np.rad2deg(math.acos(np.dot([0, -1], x_1_p)/(np.linalg.norm([0, -1])*np.linalg.norm(x_1_p))))


def determine_direction(main_point, query_point, output_length=9):
    # here I want to find the direction between 2 points
    grid = np.zeros((output_length, 1))
    grid = grid.reshape((3, 3))
    center_i, center_j = grid.shape[0]//2, grid.shape[0]//2
    angle = get_angle(main_point, query_point)
    value = 1
    # y = -1
    if (-22.5 < angle and angle <= 22.5):  # east
        grid[center_i, center_j+1] = value
        y = 4
    elif(22.5 < angle and angle <= 67.5):  # north east
        grid[center_i-1, center_j+1] = value
        y = 2
    elif(67.5 < angle and angle <= 112.5):  # north
        grid[center_i-1, center_j] = value
        y = 1
    elif(112.5 < angle and angle <= 157.5):  # north west
        grid[center_i-1, center_j-1] = value
        y = 0
    elif(-67.5 < angle and angle <= -22.5):  # south east
        grid[center_i+1, center_j+1] = value
        y = 7
    elif(-112.5 < angle and angle <= 67.5):  # south
        grid[center_i+1, center_j] = value
        y = 6
    elif(-157.5 < angle and angle <= -112.5):  # south west
        grid[center_i+1, center_j-1] = value
        y = 5
    elif(angle >= 157.5 or angle <= 157.5):  # west
        grid[center_i, center_j-1] = value
        y = 3
    return y


def distance(coord1_lat, coord1_long, coord2_lat, coord2_long):
    '''
    haversine distance
    coord1_lat=latitude of first cooridinate
    coord2_lat=latitude of first cooridinate
    coord1_long=longitude of first cooridinate
    coord2_long=longitude of first cooridinate

    '''
    radius_earth = 6371  # radius of the earth in km
    lat = math.radians(coord1_lat-coord2_lat)
    long = math.radians(coord1_long-coord2_long)
    a = (math.sin(lat/2) * math.sin(lat/2))+((math.cos(math.radians(coord1_lat))
                                              * math.cos(math.radians(coord2_lat)))*((math.sin(long/2)*math.sin(long/2))))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = radius_earth * c  # getting the distance in km
    return distance


def generate_input(point_1, point_2, frp_1, frp_2, hours, weeks, first=True, y_p=None):
    # X = []
    y_i = determine_direction(point_1, point_2)
    if first:
        x1 = [np.random.choice([0, 1, 2, 3, 4, 5, 6, 7])]
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
    URL = 'https://elevation-api.io/api/elevation?points=' + \
        '(' + str(lat) + ',' + str(lon) + ')&key=-3aUREs6J1xZD-UA3F1AkfVbag-cB3'
    r = requests.get(url=URL)
    data = r.json()
    return data['elevations'][0]['elevation']


def get_new_point(points, y, lat_diff, lon_diff):
    point = points[-1]
    new_point = []
    # print(y)
    # print(lat_diff)
    # print(lon_diff)
    if y == 0:
        # north west
        new_point.append(point[0] + lat_diff)
        new_point.append(point[1] - lon_diff)
    elif y == 1:
        # north
        new_point.append(point[0] + lat_diff)
        new_point.append(point[1])
    elif y == 2:
        # north east
        new_point.append(point[0] + lat_diff)
        new_point.append(point[1] + lon_diff)
    elif y == 3:
        # west
        new_point.append(point[0])
        new_point.append(point[1] - lon_diff)
    elif y == 4:
        # east
        new_point.append(point[0])
        new_point.append(point[1] + lon_diff)
    elif y == 5:
        # south west
        new_point.append(point[0] - lat_diff)
        new_point.append(point[1] - lon_diff)
    elif y == 6:
        # south
        new_point.append(point[0] - lat_diff)
        new_point.append(point[1])
    elif y == 7:
        # south east
        new_point.append(point[0] - lat_diff)
        new_point.append(point[1] + lon_diff)
    return new_point


if __name__ == '__main__':
    coords, nsteps, rnn, dir = get_coords()
    points = []
    model_nums = [3, 4, 5, 6, 7, 8]
    models = []

    for i in model_nums:
        if rnn == 0:
            models.append(load_model(
                '/home/rylan/Desktop/wildfire_simulation_app/node_server/public/lstm_networks/lstm_'+str(i)+'.h5'))
        else:
            models.append(load_model(
                '/home/rylan/Desktop/wildfire_simulation_app/node_server/public/gru_networks/gru_'+str(i)+'.h5'))
    today = date.today()
    point_1 = list(coords[:2])
    point_2 = list(coords[2:])
    points.append(point_1.copy())
    points.append(point_2.copy())
    point_1.append(get_elevation(point_1))
    point_2.append(get_elevation(point_2))

    year, week, day_of_week = today.isocalendar()
    hour = datetime.datetime.now().hour
    weeks = np.zeros(52)
    hours = np.zeros(24)
    hours[hour-1] = 1
    weeks[week-1] = 1
    frp_1 = random.random()
    frp_2 = random.random()

    '''
    # this is for the first point
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

    '''

    X_prev = np.array(generate_input(point_1, point_2, frp_1,
                                     frp_2, hours, weeks, first=True, y_p=None))
    X_prev = X_prev.reshape((1, X_prev.shape[0], X_prev.shape[1]))
    # print(X)
    y_pred = []
    y_pred.append(models[0].predict_classes(X_prev)[0])
    # print(model.predict_proba(X))
    # y_pred.append(dir-1)

    lat_diff = 0.0001
    lon_diff = 0.0001

    if nsteps > 1:
        for i in range(nsteps):
            new_point = get_new_point(
                points.copy(), y_pred[i], lat_diff, lon_diff)
            points.append(np.array(new_point.copy()))
            old_point = list(points[i+1])
            new_point.append(get_elevation(new_point.copy()))
            old_point.append(get_elevation(old_point.copy()))

            frp_1 = random.random()
            frp_2 = random.random()

            X_new = np.array(generate_input(old_point.copy(), new_point.copy(
            ), frp_1, frp_2, hours, weeks, first=False, y_p=y_pred[i].copy()))

            X_new = X_new.reshape((1, X_new.shape[0], X_new.shape[1]))
            # X = X_prev.copy()

            X = np.concatenate(
                (X_prev[:, :-1, :].copy(), X_new.copy()), axis=1)

            if i < 5:
                y_pred.append(models[i+1].predict_classes(X)[0])

            if i >= 5:
                X = X[:, -3:, :].copy()
                y_pred.append(models[1].predict_classes(X)[0])

            X_prev = X.copy()
            # print(model.predict_proba(X))

    points = np.array(points)
    y_pred.insert(0, dir-1)
    y_pred.insert(0, -1)
    points_df = pd.DataFrame(
        {'latitude': points[:, 0], 'longitude': points[:, 1], 'direction': y_pred[:-1]})
    points_df.to_csv(
        r'/home/rylan/Desktop/wildfire_simulation_app/node_server/public/database.csv', index=None, header=True)
    print('CSV Created')
