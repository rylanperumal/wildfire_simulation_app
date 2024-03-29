function setup() {
    // -3aUREs6J1xZD-UA3F1AkfVbag-cB3

    var interval;
    var received = 0;
    var can_sumilate = false;
    var value_n = 0;
    var value_rnn = -1;
    var point_interval;
    var dir;
    // -29.593539, 25.581864
    // -29.906137, 25.244125
    const mymap = L.map('issMap').setView([-28.381810, 25.935159], 6); // latitude, longitude, zoom level
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
    var link = document.getElementById("text");



    tiles.addTo(mymap);
    mymap.on('click', addMarker);

    async function plot_second_point(lat_1, lng_2) {
        dir = document.getElementById('direction');
        if (isNaN(parseFloat(dir.value)) == false) {
            var lat_diff = Math.sqrt(Math.pow(0.0001, 2) + Math.pow(0.0001, 2))
            var lon_diff = Math.sqrt(Math.pow(0.0001, 2) + Math.pow(0.0001, 2))
            var lat = lat_1;
            var lng = lng_2;
            if (dir.value == 1) {
                // north west
                lat = lat + lat_diff;
                lng = lng - lon_diff;
            } else if (dir.value == 2) {
                // north
                lat = lat + lat_diff;
                lng = lng;
            } else if (dir.value == 3) {
                // north east
                lat = lat + lat_diff;
                lng = lng + lon_diff;
            } else if (dir.value == 5) {
                // east
                lat = lat;
                lng = lng + lon_diff;
            } else if (dir.value == 8) {
                // south east
                lat = lat - lat_diff;
                lng = lng + lon_diff;
            } else if (dir.value == 7) {
                // south
                lat = lat - lat_diff;
                lng = lng;
            } else if (dir.value == 6) {
                // south west
                lat = lat - lat_diff;
                lng = lng - lon_diff;
            } else if (dir.value == 4) {
                // west
                lat = lat;
                lng = lng - lon_diff;
            }
            const marker = new L.marker([lat, lng], {
                icon: flameIcon
            }).addTo(mymap).bindPopup(lat.toFixed(4).toString() + "," + lng.toFixed(4).toString());
            const data = {
                lat,
                lng
            };
            console.log(lat, lng);
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
            markers.push(marker);
            console.log('Server received point: ', json);
            console.log(dir.value);
        }
        if (markers.length == 2) {
            can_sumilate = true;
            clearInterval(point_interval);
        }
    }
    async function addMarker(e) {
        if (markers.length < 1) {
            const {
                lat,
                lng
            } = e.latlng;
            // latlngs.push(e.latlng);
            const marker = new L.marker(e.latlng, {
                icon: flameIcon
            }).addTo(mymap).bindPopup(lat.toFixed(4).toString() + "," + lng.toFixed(4).toString());
            markers.push(marker);
            const data = {
                lat,
                lng
            };
            console.log(lat, lng)
            setTimeout(function () {
                mymap.setView([lat, lng], 18);

            }, 1500);
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
            // Adding second point based on direction
            point_interval = setInterval(function () {
                plot_second_point(lat, lng)
            }, 1000);
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
        dir = document.getElementById('direction');
        if (isNaN(parseFloat(dir.value)) == false) {
            if (isNaN(parseFloat(value_n.value)) == false) {
                if (isNaN(parseFloat(value_rnn.value)) == false) {
                    if (can_sumilate == true) {
                        can_sumilate = false;
                        interval = setInterval(add_points, 1000);
                        var v = parseFloat(value_n.value);
                        var r = parseFloat(value_rnn.value);
                        var d = parseFloat(dir.value);
                        console.log(v);
                        const data = {
                            v,
                            r,
                            d
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
                        var loader = document.getElementById("l");
                        loader.style.display = "block";
                    } else {
                        alert("Select a point on the map below");
                    }
                } else {
                    alert("Select recurrent neural network architecture");
                }
            } else {
                alert("Select number of steps to be predicted");
            }
        } else {
            alert("Select intial direction");
        }

    });
    const back = document.getElementById("back");
    back.addEventListener("click", async b => {
        const response = await fetch('/cleared');
        const json = await response.json();
        console.log('Data cleared ');
    });
    const reset = document.getElementById('reset');
    reset.addEventListener('click', async event => {
        markers.forEach(marker => {
            mymap.removeLayer(marker);
        });
        markers.length = 0;
        lat_lons.length = 0
        msg = 0;
        document.getElementById("n").value = "Select number of steps to predict";
        document.getElementById("rnn").value = "Choose Recurrent Neural Network Architecture";
        document.getElementById("direction").value = "Select initial direction";

        clearInterval(interval);
        mymap.setView([-28.381810, 25.935159], 6);
        const response = await fetch('/cleared');
        const json = await response.json();
        can_sumilate = false;
        console.log('Data cleared');
        link.style.display = "none";
    });

    async function getData() {
        var count = 0;
        const response = await fetch('database.csv');
        const data = await response.text();
        console.log('Fire simulation data received');
        var loader = document.getElementById("l");
        loader.style.display = "none";
        const table = data.split('\n').slice(1);

        var i = 2;

        function animated_loop() {
            setTimeout(function () {
                var row = table[i];
                var columns = row.split(',');
                const latitude = columns[0];
                const longitude = columns[1];
                console.log(latitude, longitude);
                const marker = new L.marker([parseFloat(latitude), parseFloat(longitude)], {
                    icon: flameIcon
                }).addTo(mymap).bindPopup(latitude.substring(0, 8) + "," + longitude.substring(0, 8));
                markers.push(marker);
                i++;
                if (i < table.length - 1) {
                    animated_loop();
                }
            }, 2000);
        }
        animated_loop();

        link.style.display = "block";
    }


}