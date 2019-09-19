import tensorflow
from keras.models import load_model
import sys, json
import os
#Read data from stdin
def read_in():
    lines = sys.stdin.readlines()
    # Since our input would only be having one line, parse our JSON data from that
    return json.loads(lines[0])

def main():
    #get our data as an array from read_in()
    lines = read_in()
    print(lines)

    # Sum  of all the items in the providen array
    total_sum_inArray = 0
    for item in lines:
        total_sum_inArray += item

        #return the sum to the output stream
        print(total_sum_inArray)


if __name__ == '__main__':
    print(os.getcwd())
    model = load_model('/home/rylan/Desktop/wildfire_simulation_app/node_server/public/lstm_3.h5')
    print('hello')
    # main()
    print('done')
