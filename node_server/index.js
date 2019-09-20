const express = require('express');
const app = express();
app.listen(3000, () => console.log('listening at 3000'));
app.use(express.static('public'));
app.use(express.json({limit: '1mb'}));
const all_data = []
var done = 0
app.post('/api', (request, response) => {
    console.log('I got a request');
    const data = request.body;
    all_data.push(data);
    response.json(all_data.length);

});
app.post('/sim', (request, response) => {
    if (all_data.length == 2){
        // cons.log(data);
        // all_data.push(data);
        response.json('getting predictions');
        var myPythonScriptPath = 'public/lstm.py';
        let {PythonShell} = require('python-shell');
        var pyshell = new PythonShell(myPythonScriptPath);
        console.log(all_data);
        pyshell.send([all_data[0].lat, all_data[0].lng, all_data[1].lat, all_data[1].lng]);
        pyshell.on('message', function (message) {
            console.log(message);
        })
        pyshell.end(function (err) {
            done = 1;
            if (err){
                throw err;
            };
        });
        all_data.length = 0;

    }
});

app.post('/done', (request, response) => {
    response.json(done);
    console.log(done);
    // console.log(request.body);
    done = request.body.r;
});



