function displayElectionDifference() {
  var svg = d3.select("#viz");
  var legend = d3.select("#voting-diff-legend");
  var tooltip = d3.select(".tooltip");
  var margin = {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  };
  var width = +svg.attr("width");
  var height = +svg.attr("height");
  var active = d3.select(null);

  var projection = d3
    .geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(width);
  var path = d3.geoPath().projection(projection);

  svg
    .append("rect")
    .attr("class", "background")
    .attr("height", height + margin.top + margin.bottom)
    .attr("width", width + margin.left + margin.right)
    .on("click", clicked);

  var g = svg
    .append("g")
    .attr("class", "us")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  queue()
    .defer(d3.csv, "data/election_county_2000_2016.csv")
    .defer(d3.json, "data/us-counties.json")
    .await(ready);

  function ready(error, electionData, us) {
    if (error) throw error;

    var electionData2004 = electionData.filter((d) => +d.year === 2004);
    var electionData2008 = electionData.filter((d) => +d.year === 2008);

    var countiesToStates = new Map(
      electionData2008.map((d) => [+d.FIPS, d.state_po])
    );
    var numVotesCounties = new Map();
    var numVotesStates = new Map();
    var dataCounties = new Map();
    var dataStates = new Map();
    const titles = ["Change in Democratic Vote", "Change in Republican Vote"];
    const labels = ["low", "", "high"];

    var stateData2004 = d3
      .nest()
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
      .entries(electionData2004);

    var stateData2008 = d3
      .nest()
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
      .entries(electionData2008);

    electionData2004 = d3
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
      .entries(electionData2004);

    electionData2008 = d3
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
      .entries(electionData2008);

    const DEMOCRAT = 0;
    const REPUBLICAN = 1;
    for (
      var i = 0;
      i < electionData2004.length && i < electionData2008.length;
      i++
    ) {
      var countyFIPS = +electionData2004[i].key;

      var changeInDem =
        (electionData2008[i].values[DEMOCRAT].value -
          electionData2004[i].values[DEMOCRAT].value) /
        electionData2004[i].values[DEMOCRAT].value;
      var pctChangeInRepublican =
        (electionData2008[i].values[REPUBLICAN].value -
          electionData2004[i].values[REPUBLICAN].value) /
        electionData2004[i].values[REPUBLICAN].value;

      dataCounties.set(countyFIPS, [changeInDem, pctChangeInRepublican]);
      numVotesCounties.set(countyFIPS, [
        electionData2004[i].values[DEMOCRAT].value,
        electionData2008[i].values[DEMOCRAT].value,
        electionData2004[i].values[REPUBLICAN].value,
        electionData2008[i].values[REPUBLICAN].value,
      ]);
    }

    for (var i = 0; i < stateData2004.length && i < stateData2008.length; i++) {
      var state = stateData2008[i].key;

      var changeInDem =
        (stateData2008[i].values[DEMOCRAT].value -
          stateData2004[i].values[DEMOCRAT].value) /
        stateData2004[i].values[DEMOCRAT].value;
      var pctChangeInRepublican =
        (stateData2008[i].values[REPUBLICAN].value -
          stateData2004[i].values[REPUBLICAN].value) /
        stateData2004[i].values[REPUBLICAN].value;

      dataStates.set(state, [changeInDem, pctChangeInRepublican]);
      numVotesStates.set(state, [
        stateData2004[i].values[DEMOCRAT].value,
        stateData2008[i].values[DEMOCRAT].value,
        stateData2004[i].values[REPUBLICAN].value,
        stateData2008[i].values[REPUBLICAN].value,
      ]);
    }

    var colors = [
      "#e8e8e8",
      "#e4acac",
      "#c85a5a",
      "#b0d5df",
      "#ad9ea5",
      "#985356",
      "#64acbe",
      "#627f8c",
      "#574249",
    ];

    var n = Math.floor(Math.sqrt(colors.length));
    var x = d3
      .scaleQuantile()
      .domain(Array.from(dataCounties.values(), (d) => d[0]))
      .range(d3.range(n));
    var y = d3
      .scaleQuantile()
      .domain(Array.from(dataCounties.values(), (d) => d[1]))
      .range(d3.range(n));
    var color = (value) => {
      if (!value) return "#ccc";
      let [a, b] = value;
      return colors[y(b) + x(a) * n];
    };

    const k = 42;
    const legendHeight = 202;
    const legendWidth = legendHeight;

    legend
      .attr("height", legendHeight)
      .attr("width", legendWidth)
      .append("g")
      .attr("transform", `translate(${legendHeight / 2},${legendWidth / 2})`)
      .html(`
      <g font-family=sans-serif font-size=10>
        <g transform="translate(-${(k * n) / 2},-${(k * n) / 2}) rotate(-45 ${
      (k * n) / 2
    },${(k * n) / 2})">
          <marker id="arrow" markerHeight=10 markerWidth=10 refX=6 refY=3 orient=auto>
            <path d="M0,0L9,3L0,6Z" />
          </marker>
          ${d3.cross(d3.range(n), d3.range(n)).map(
            ([i, j]) => `<rect width=${k} height=${k} x=${i * k} y=${
              (n - 1 - j) * k
            } fill=${colors[j * n + i]}>
            <title>${titles[0]}${labels[j] && ` (${labels[j]})`}\n${titles[1]}${
              labels[i] && ` (${labels[i]})`
            }</title>
          </rect>`
          )}
          <line marker-end="url(#arrow)" x1=0 x2=${n * k} y1=${n * k} y2=${
      n * k
    } stroke=black stroke-width=1.5 />
          <line marker-end="url(#arrow)" y2=0 y1=${
            n * k
          } stroke=black stroke-width=1.5 />
          <text font-weight="bold" dy="0.71em" transform="rotate(90) translate(${
            (n / 2) * k
          },6)" text-anchor="middle">${titles[0]}</text>
          <text font-weight="bold" dy="0.71em" transform="translate(${
            (n / 2) * k
          },${n * k + 6})" text-anchor="middle">${titles[1]}</text>
        </g>
      </g>`);

    g.append("g")
      .attr("id", "counties")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
      .enter()
      .append("path")
      .style("fill", (d) => {
        if (!dataCounties.has(+d.id)) return;
        return color(dataCounties.get(+d.id));
      })
      .attr("d", path)
      .attr("class", "county")
      .on("mousemove", function (d) {
        if (!dataCounties.has(+d.id)) return;
        tooltip.transition().duration(200).style("opacity", 0.9);
        const [
          demVotes2004,
          demVotes2008,
          republicanVotes2004,
          republicanVotes2008,
        ] = numVotesCounties.get(+d.id);
        tooltip
          .style("left", d3.event.pageX + 10 + "px")
          .style("top", d3.event.pageY - 25 + "px")
          .style("display", "inline-block")
          .html(
            `<div class="container">
              <div class="tooltip-title">${
                d.properties.name
              }, ${countiesToStates.get(+d.id)}</div>
              <table> 
                <thead class="header">
                  <tr>
                    <th colspan="2">Party</th>
                    <th>Votes in 2004</th>
                    <th>Votes in 2008</th>
                    <th>% Change</th>
                  </tr>
                <thead>
                <tbody>
                  <tr class="tbl-row dem">
                    <td class="cell-colorblock cell-colorblock-dem"></td>
                    <td class="cell-name cell-name-biden">Democrats</td>
                    <td class="cell-vote"> ${d3.format(",")(demVotes2004)} </td>
                    <td class="cell-vote"> ${d3.format(",")(demVotes2008)} </td>
                    <td class="cell-vote"> ${d3.format(",.1f")(
                      dataCounties.get(+d.id)[0] * 100
                    )}% </td>
                  </tr>
                  <tr class="tbl-row rep">
                    <td class="cell-colorblock cell-colorblock-rep"></td>
                    <td class="cell-name cell-name-rep">Republicans</td>
                    <td class="cell-vote"> ${d3.format(",")(
                      republicanVotes2004
                    )} </td>
                    <td class="cell-vote"> ${d3.format(",")(
                      republicanVotes2008
                    )} </td>
                    <td class="cell-vote"> ${d3.format(",.1f")(
                      dataCounties.get(+d.id)[1] * 100
                    )}% </td>
                  </tr>
                </tbody>
              </table>
            </div>`
          );
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      })
      .on("click", reset)
      .style("opacity", 0)
      .transition()
      .duration(200)
      .style("opacity", 1);

    g.append("g")
      .attr("id", "states")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
      .enter()
      .append("path")
      .style("fill", (d) => {
        var state = d.properties.name;
        if (!dataStates.has(state)) return;
        return color(dataStates.get(state));
      })
      .attr("d", path)
      .attr("class", "state")
      .on("click", clicked)
      .on("mousemove", function (d) {
        var state = d.properties.name;
        if (!dataStates.has(state)) return;
        const [
          demVotes2004,
          demVotes2008,
          republicanVotes2004,
          republicanVotes2008,
        ] = numVotesStates.get(state);
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .style("left", d3.event.pageX + 10 + "px")
          .style("top", d3.event.pageY - 25 + "px")
          .style("display", "inline-block")
          .html(
            `<div class="container">
              <div class="tooltip-title">${state}</div>
              <table> 
                <thead class="header">
                  <tr>
                    <th colspan="2">Party</th>
                    <th>Votes in 2004</th>
                    <th>Votes in 2008</th>
                    <th>% Change</th>
                  </tr>
                <thead>
                <tbody>
                  <tr class="tbl-row dem">
                    <td class="cell-colorblock cell-colorblock-dem"></td>
                    <td class="cell-name cell-name-biden">Democrats</td>
                    <td class="cell-vote"> ${d3.format(",")(demVotes2004)} </td>
                    <td class="cell-vote"> ${d3.format(",")(demVotes2008)} </td>
                    <td class="cell-vote"> ${d3.format(",.1f")(
                      dataStates.get(state)[0] * 100
                    )}% </td>
                  </tr>
                  <tr class="tbl-row rep">
                    <td class="cell-colorblock cell-colorblock-rep"></td>
                    <td class="cell-name cell-name-rep">Republicans</td>
                    <td class="cell-vote"> ${d3.format(",")(
                      republicanVotes2004
                    )} </td>
                    <td class="cell-vote"> ${d3.format(",")(
                      republicanVotes2008
                    )} </td>
                    <td class="cell-vote"> ${d3.format(",.1f")(
                      dataStates.get(state)[1] * 100
                    )}% </td>
                  </tr>
                </tbody>
              </table>
            </div>`
          );
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    g.append("path")
      .datum(
        topojson.mesh(us, us.objects.states, function (a, b) {
          return a !== b;
        })
      )
      .attr("id", "state-borders")
      .attr("d", path);
  }

  function clicked(d) {
    if (d3.select(".background").node() === this) return reset();

    if (active.node() === this) return reset();

    active.classed("active", false);
    active = d3.select(this).classed("active", true);

    var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = 0.9 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

    g.transition()
      .duration(750)
      .style("stroke-width", 1.5 / scale + "px")
      .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
  }

  function reset() {
    active.classed("active", false);
    active = d3.select(null);

    g.transition()
      .delay(100)
      .duration(750)
      .style("stroke-width", "1.5px")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  }
}
