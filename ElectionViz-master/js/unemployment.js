var unemploymentColorScale = d3
  .scaleQuantile()
  .range(d3.schemeBlues[9])
  .domain([1, 10]);

/**
 * Display a choropleth unemployment map of a specific state
 * @param {Number} stateFIPS FIPS state code
 */
function displayUnemployment(stateFIPS) {
  var svg = d3.select("#viz");
  var margin = {
    top: 10,
    bottom: 10,
    left: 100,
    right: 10,
  };
  var width = +svg.attr("width");
  var height = +svg.attr("height");

  var projection = d3
    .geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(width);

  var path = d3.geoPath().projection(projection);

  var g = svg
    .append("g")
    .attr("class", "us-state")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  var tooltip = d3.select(".tooltip");

  queue()
    .defer(d3.csv, "data/2008-unemployment.csv")
    .defer(d3.csv, "data/election_county_2000_2016.csv")
    .defer(d3.json, "data/us-counties.json")
    .await(ready);

  function ready(error, unemploymentData, electionData, us) {
    if (error) throw error;

    var states = topojson.feature(us, us.objects.states).features;
    var counties = topojson.feature(us, us.objects.counties).features;
    var filteredCounties = counties.filter((county) =>
      county.id.toString().startsWith(stateFIPS.toString())
    );
    var filteredStates = states.filter(function (d) {
      // list of state FIPS codes
      return +d.id === +stateFIPS;
    });

    // create a mapping of county FIPS to important data values
    var unemploymentMapping = new Map(
      unemploymentData.map((d) => [
        +d.CountyFIPS,
        {
          UnemploymentRate: +d.UnemploymentRate,
          Name: d["County Name/State Abbreviation"],
        },
      ])
    );

    var filteredElectionDataFor2008 = electionData.filter(
      ({ year, FIPS }) =>
        year === "2008" && FIPS.toString().startsWith(stateFIPS.toString())
    );
    var nested = d3
      .nest()
      .key(function (d) {
        return d.FIPS;
      })
      .key(function (d) {
        return d.party;
      })
      .rollup(function (v) {
        return d3.sum(v, function (d) {
          return d.candidatevotes;
        });
      })
      .entries(filteredElectionDataFor2008);

    var countyElectionDataMapping = new Map();
    nested.forEach((county) => {
      obj = {};
      county.values.forEach((party) => {
        obj[party.key] = party.value;
      });
      const democraticVotes = obj["democrat"];
      const republicanVotes = obj["republican"];
      var totalVotes = 0;
      for (const [key, value] of Object.entries(obj)) {
        totalVotes += value;
      }
      obj["pctDemocrat"] = ((democraticVotes / totalVotes) * 100).toFixed(2);
      obj["pctRepublican"] = ((republicanVotes / totalVotes) * 100).toFixed(2);
      countyElectionDataMapping.set(parseInt(county.key), obj);
    });

    g.append("g")
      .attr("id", "counties")
      .selectAll("path")
      .data(filteredCounties)
      .enter()
      .append("path")
      .style("opacity", 0)
      .style("fill", function (d) {
        return unemploymentColorScale(
          unemploymentMapping.get(+d.id).UnemploymentRate
        );
      })
      .on("mouseover", function (d) {
        d3.select(this).classed("active", true);
      })
      .on("mousemove", function (d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .style("left", d3.event.pageX + 10 + "px")
          .style("top", d3.event.pageY - 25 + "px")
          .style("display", "inline-block")
          .html(
            `<h3 class="tooltip-title">${
              unemploymentMapping.get(+d.id).Name
            }</h3><div class="tooltip-body"><p>Unemployment rate: ${
              unemploymentMapping.get(+d.id).UnemploymentRate
            }%</p><p>Obama vote % 2008: ${countyElectionDataMapping
              .get(+d.id)
              .pctDemocrat.toString()}%</p><p>McCain vote % 2008: ${countyElectionDataMapping
              .get(+d.id)
              .pctRepublican.toString()}%</p></div>`
          );
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
        d3.select(this).classed("active", false);
      })
      .transition()
      .duration(200)
      .style("opacity", 1)
      .attr("d", path)
      .attr("class", "county");

    g.append("g")
      .attr("id", "states")
      .selectAll("path")
      .data(filteredStates)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", "state");

    var state = filteredStates[0];
    stateSelected(state);
  }

  function stateSelected(d) {
    d3.selectAll(".state").classed("active", function (d_) {
      return d_.id === d.id;
    });

    var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = 0.9 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x + 80, height / 2 - scale * y];

    g.style("stroke-width", 1.5 / scale + "px").attr(
      "transform",
      "translate(" + translate + ")scale(" + scale + ")"
    );
  }
}

function drawUnemploymentLegend(stateFIPS) {
  var legendHeight = 200,
    legendWidth = 200;
  var container = d3
    .select(`#unemployment-legend-${stateFIPS}`)
    .attr("height", legendHeight)
    .attr("width", legendWidth);
  var legend = container
    .selectAll("g.legendEntry")
    .data(unemploymentColorScale.range().reverse())
    .enter()
    .append("g")
    .attr("class", "legendEntry");
  legend
    .append("text")
    .attr("class", "legend-text")
    .attr("x", 0)
    .attr("y", 15)
    .text("Unemployment rate (%)");
  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", function (d, i) {
      return i * 20 + 27;
    })
    .attr("width", 10)
    .attr("height", 10)
    .style("stroke", "black")
    .style("stroke-width", 1)
    .style("fill", function (d) {
      return d;
    });
  legend
    .append("text")
    .attr("class", "text-normal")
    .attr("x", 15) //leave 5 pixel space after the <rect>
    .attr("y", function (d, i) {
      return i * 20 + 25;
    })
    .attr("dy", "0.8em") //place text one line *below* the x,y point
    .text(function (d, i) {
      var extent = unemploymentColorScale.invertExtent(d);
      //extent will be a two-element array, format it however you want:
      var format = d3.format(".1f");
      return format(+extent[0]) + " - " + format(+extent[1]);
    });
}
