function setup() {
    // -3aUREs6J1xZD-UA3F1AkfVbag-cB3

    var interval;
    var received = 0;
    var can_sumilate = false;
    var value_n = 0;
    var value_rnn = -1;
    const mymap = L.map('issMap').setView([-29.906137, 25.244125], 4); // latitude, longitude, zoom level
    const flameIcon = L.icon({
        iconUrl: '/images/flame.png',
        iconSize: [30, 30],
        iconAnchor: [12, 15],
    });
    const markers = [];
    const lat_lons = [];
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    const tileURL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tiles = L.tileLayer(tileURL, {
        attribution
    });
    tiles.addTo(mymap);
    mymap.on('click', addMarker);

    async function addMarker(e) {
        if (markers.length < 2) {
            const {
                lat,
                lng
            } = e.latlng;
            const newMarker = new L.marker(e.latlng, {
                icon: flameIcon
            }).addTo(mymap).bindPopup(lat.toFixed(4).toString() + "," + lng.toFixed(4).toString());
            markers.push(newMarker);
            const data = {
                lat,
                lng
            };
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            };
            const response = await fetch('/api', options);
            const json = await response.json();
            console.log('Server received point: ', json);
            if (markers.length == 2) {
                can_sumilate = true;
            }
        }
    }

    async function add_points() {
        var r = 0;
        const d = {
            r
        };
        const op = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(d)
        }
        const res = await fetch('/done', op);
        const json = await res.json();
        received = await json;
        if (received == 1) {
            getData();
            clearInterval(interval);
            received = false;
        }

    }

    const simulate = document.getElementById('simulate');
    simulate.addEventListener('click', async func => {
        value_n = document.getElementById("n");
        value_rnn = document.getElementById("rnn");
        if (isNaN(parseFloat(value_n.value)) == false) {
            if (isNaN(parseFloat(value_rnn.value)) == false) {
                if (can_sumilate == true) {
                    can_sumilate = false;
                    interval = setInterval(add_points, 3000);
                    var v = parseFloat(value_n.value);
                    var r = parseFloat(value_rnn.value);
                    console.log(v);
                    const data = {
                        v,
                        r
                    };
                    const options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(data)
                    };
                    const res = await fetch('/simulate', options);
                    const json = await res.json();
                    console.log('Simulation Starting ...', json);
                }
            } else {
                alert("Select recurrent neural network architecture");
            }
        } else {
            alert("Select number of steps to be predicted");
        }

    });
    const reset = document.getElementById('reset');
    reset.addEventListener('click', event => {
        markers.forEach(marker => {
            mymap.removeLayer(marker);
        });
        markers.length = 0;
        lat_lons.length = 0
        msg = 0;
        document.getElementById("n").value = "Select number of steps to predict";
        document.getElementById("rnn").value = "Select number of steps to predict";

        clearInterval(interval);
    });

    async function getData() {
        var count = 0;
        const response = await fetch('database.csv');
        const data = await response.text();
        console.log('Fire simulation data received');
        const table = data.split('\n').slice(1);
        table.forEach(row => {
            const columns = row.split(',');
            const latitude = columns[0];
            const longitude = columns[1];
            // console.log(value.value);
            if (count < parseFloat(value_n.value)) {
                console.log(latitude, longitude);
                setTimeout(function () {
                    const marker = new L.marker([parseFloat(latitude), parseFloat(longitude)], {
                        icon: flameIcon
                    }).addTo(mymap).bindPopup(latitude.substring(0, 8) + "," + longitude.substring(0, 8));
                    markers.push(marker);
                }, 3000);

                count = count + 1;
            }
        });
    }


}