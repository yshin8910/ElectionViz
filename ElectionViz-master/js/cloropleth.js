(function displayVoteDiff() {
    d3.csv("data/election_county_2000_2016.csv", function (data) {
        var nested = d3
            .nest()
            .key(function (d) {
                return d.year;
            })
            .key(function (d) {
                return d.state;
            })
            .key(function (d) {
                return d.party;
            })
            .rollup(function (v) {
                return d3.sum(v, function (d) {
                    return d.candidatevotes;
                });
            })
            .entries(data);

        var margin = { top: 0, left: 0, right: 0, bottom: 0 },
            height = 400 - margin.top - margin.bottom,
            width = 800 - margin.left - margin.right;

        var svg = d3.select("#viz")
            .append("svg")
            .attr("height", height + margin.top + margin.bottom)
            .attr("width", width + margin.left + margin.right)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin + ")");


        //create new projection using Albers USA (geoAlbersUSA) and center it + zoom
        var projection = d3
            .geoAlbersUsa()
            .translate([width / 2, height / 2])
            .scale(width);

        //create a path (geoPath) and set projection
        var path = d3.geoPath().projection(projection);
        var negativeColor = "#f7dfde";
        var lowColor = "#deebf7";
        var highColor = "#08306b";

        //array of states
        var states = Array.from(new Set(data.map(d => d.state))).slice(0, 51);
        console.log(states);

        //load GeoJSON and merge with states data
        d3.json("data/states.json", function (error, topology) {
            //loop through each state data value in the .csv file
            for (var i = 0; i < states.length; i++) {
                //grab state name
                var dataState = states[i];
                //grab democrat data
                var dataDemocrats2004 = nested[1].values[i].values[0]; //2004, state, dem/rep
                var dataDemocrats2008 = nested[2].values[i].values[0].values[]

                if ()

                    //find the correpsonding state inside the GeoJSON
                    for (var j = 0; j < topology.features.length; j++) {
                        var jsonState = topology.features[j].properties.NAME;

                        if (dataState = jsonState) {
                            //copy the data value into the JSON
                            topology.featuers[j].properties.DEMOCRAT = dataDemocrats;
                            topology.features[j].properties
                        }
                    }
            }
        })

    })

})();