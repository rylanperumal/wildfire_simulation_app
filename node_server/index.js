const express = require('express');
var myPythonScriptPath = 'public/lstm.py';
let {PythonShell} = require('python-shell')
var pyshell = new PythonShell(myPythonScriptPath);
const app = express();
app.listen(3000, () => console.log('listening at 3000'));
app.use(express.static('public'));
app.use(express.json({limit: '1mb'}));
const all_data = [];

app.post('/api', (request, response) => {
    console.log('I got a request');
    // console.log(request.body);
    const data = request.body;
    all_data.push(data);
    response.json(all_data);
    console.log(all_data);
    if (all_data.length == 2){
        //var myPythonScriptPath = 'public/lstm.py';
        let {PythonShell} = require('python-shell')
        var pyshell = new PythonShell(myPythonScriptPath);
        pyshell.on('message', function (message) {
            // received a message sent from the Python script (a simple "print" statement)
            console.log(message);
        });
        pyshell.end(function (err) {
            if (err){
                throw err;
            };

            console.log('finished');
        });
    }
});


