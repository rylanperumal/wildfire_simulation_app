function setup() {
    // -3aUREs6J1xZD-UA3F1AkfVbag-cB3

    var interval;
    var received = 0;
    var can_sumilate = false;
    var value_n = 0;
    var value_rnn = -1;
    var latlngs = [];
    const mymap = L.map('issMap').setView([-29.906137, 25.244125], 5); // latitude, longitude, zoom level
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
    // var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    //     attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    // });
    // var Stamen_Terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
    //     attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    //     subdomains: 'abcd',
    //     minZoom: 0,
    //     maxZoom: 18,
    //     ext: 'png'
    // });

    tiles.addTo(mymap);
    mymap.on('click', addMarker);


    async function addMarker(e) {
        if (markers.length < 2) {
            const {
                lat,
                lng
            } = e.latlng;
            latlngs.push(e.latlng);
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
                    var loader = document.getElementById("l");
                    loader.style.display = "block";
                } else {
                    alert("Select 2 two points on the map below");
                }
            } else {
                alert("Select recurrent neural network architecture");
            }
        } else {
            alert("Select number of steps to be predicted");
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
        clearInterval(interval);
        mymap.setView([-29.906137, 25.244125], 5);
        const response = await fetch('/cleared');
        const json = await response.json();
        console.log('Data cleared');
    });

    async function getData() {
        var count = 0;
        const response = await fetch('database.csv');
        const data = await response.text();
        console.log('Fire simulation data received');
        var loader = document.getElementById("l");
        loader.style.display = "none";
        const table = data.split('\n').slice(1);
        table.forEach(row => {
            const columns = row.split(',');
            const latitude = columns[0];
            const longitude = columns[1];
            // console.log(value.value);
            if (count < parseFloat(value_n.value)) {
                console.log(latitude, longitude);
                const marker = new L.marker([parseFloat(latitude), parseFloat(longitude)], {
                    icon: flameIcon
                }).addTo(mymap).bindPopup(latitude.substring(0, 8) + "," + longitude.substring(0, 8));
                markers.push(marker);
                count = count + 1;
            }
        });
    }


}