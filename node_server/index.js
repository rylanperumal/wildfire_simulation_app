const express = require('express');
const app = express();
app.listen(3000, () => console.log('listening at 3000'));
app.use(express.static('public'));
app.use(express.json({limit: '1mb'}));
const all_data = [];
var myPythonScriptPath = 'public/lstm.py';
let {PythonShell} = require('python-shell')
var pyshell = new PythonShell(myPythonScriptPath);
const messages = []
const test = []
app.post('/api', (request, response) => {
    console.log('I got a request');
    // console.log(request.body);
    const data = request.body;
    all_data.push(data);
    response.json(all_data);
    if (all_data.length == 2){


        // var fs = require('fs');
        // fs.unlink('predicted_points.csv', function (err) {
        //     //Do whatever else you need to do here
        // });
        // pyshell.send(JSON.stringify([1,2,3,4,5]));
        // console.log("hello");
        // console.log(all_data);
        // console.log('Sending to python');
        pyshell.send([all_data[0].lat, all_data[0].lon, all_data[1].lat, all_data[1].lon]);
        pyshell.on('message', function (message) {
            console.log(message);
            // test.append(message)
            // response.text(message);
            // messages.push(message);
            // console.log('Python received');
        });
        // response.send(message);
        pyshell.end(function (err) {
            if (err){
                throw err;
            };
        });
        all_data.length = 0;
    }
    // response.json(messages);
});


