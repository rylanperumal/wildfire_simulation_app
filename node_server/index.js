const express = require('express');
const app = express();
app.listen(3000, () => console.log('listening at 3000'));
app.use(express.static('public'));
app.use(express.json({limit: '1mb'}));
const all_data = [];

app.post('/api', (request, response) => {
    // console.log('I got a request');
    // console.log(request.body);
    const data = request.body;
    all_data.push(data);
    // console.log(data);
    response.json(all_data);
    // console.log(all_data);
    if (all_data.length == 2){
        var myPythonScriptPath = 'public/lstm.py';
        let {PythonShell} = require('python-shell')
        var pyshell = new PythonShell(myPythonScriptPath);
        // pyshell.send(JSON.stringify([1,2,3,4,5]));
        // console.log("hello");
        // console.log(all_data);
        pyshell.send([all_data[0].lat, all_data[0].lon, all_data[0].ele, all_data[1].lat, all_data[1].lon, all_data[1].ele]);
        // pyshell.send(all_data);
        pyshell.on('message', function (message) {
            // received a message sent from the Python script (a simple "print" statement)
            console.log(message);
        });
        pyshell.end(function (err) {
            if (err){
                throw err;
            };

            // console.log('finished');
        });
        all_data.length = 0;
    }
});


