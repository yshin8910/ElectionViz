function displayElectionMap(year) {
  var svg = d3.select("#viz");
  var tooltip = d3.select(".tooltip");
  var margin = {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  };
  var width = +svg.attr("width");
  var height = +svg.attr("height");
  const democratBlue = "#019BD8";
  const republicanRed = "#D81C28";
  const electoralCollegeOutcome = {
    2004: [251, 286],
    2008: [365, 173],
  };

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
    var electionData = electionData.filter((d) => +d.year === +year);
    var [democraticCandidate, republicanCandidate] = Array.from(
      new Set(electionData.map((d) => d.candidate))
    );

    var sumstats = d3
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
      .entries(electionData);

    var data = new Map(
      sumstats.map((d) => [d.key, [...d.values.map((d) => +d.value)]])
    );

    var projection = d3
      .geoAlbersUsa()
      .translate([width / 2, height / 2]) // translate to center of screen
      .scale(width); // scale things down to see entire US

    var path = d3.geoPath().projection(projection);

    g.append("g")
      .attr("id", "states")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", "state")
      .style("fill", function (d) {
        const state = d.properties.name;
        if (!data.has(state)) return;
        var [democraticVotes, republicanVotes] = data.get(state);
        if (democraticVotes > republicanVotes) {
          return democratBlue;
        } else {
          return republicanRed;
        }
      })
      .on("mousemove", function (d) {
        const state = d.properties.name;
        if (!data.has(state)) return;

        var [democraticVotes, republicanVotes, otherVotes] = data.get(state);
        const totalVotes = democraticVotes + republicanVotes + otherVotes;
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
                    <th colspan="2">Candidate</th>
                    <th>Total Votes</th>
                    <th>% of the Vote</th>
                  </tr>
                <thead>
                <tbody>
                  <tr class="tbl-row dem">
                    <td class="cell-colorblock cell-colorblock-dem"></td>
                    <td class="cell-name cell-name-biden">${democraticCandidate}</td>
                    <td class="cell-vote"> ${d3.format(",")(
                      democraticVotes
                    )} </td>
                    <td class="cell-vote"> ${d3.format(",.1f")(
                      (democraticVotes / totalVotes) * 100
                    )}% </td>
                  </tr>
                  <tr class="tbl-row rep">
                    <td class="cell-colorblock cell-colorblock-rep"></td>
                    <td class="cell-name cell-name-rep">${republicanCandidate}</td>
                    <td class="cell-vote"> ${d3.format(",")(
                      republicanVotes
                    )} </td>
                    <td class="cell-vote"> ${d3.format(",.1f")(
                      (republicanVotes / totalVotes) * 100
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

    g.append("text")
      .attr("class", "title")
      .attr("transform", "translate(" + width / 2 + " ," + 20 + ")")
      .style("text-anchor", "middle")
      .text(`${+year} Election Results`);

    // election results
    const offset = 50;
    const barHeight = 8;
    const totalHeight = 26;
    const targetWidth = width - 20;
    const [votesD, votesR] = electoralCollegeOutcome[+year];
    var votesScale = d3
      .scaleLinear()
      .domain([0, votesD + votesR])
      .range([0, targetWidth]);
    g.append("text")
      .attr("class", "text-semibold")
      .attr("x", 0)
      .attr("y", offset + 8)
      .attr("dy", "0.31em")
      .attr("text-anchor", "start")
      .attr("fill", democratBlue)
      .text(`${votesD} - ${democraticCandidate}`);
    g.append("rect")
      .attr("x", 0)
      .attr("y", offset + totalHeight - barHeight)
      .attr("width", votesScale(votesD))
      .attr("height", barHeight)
      .attr("fill", democratBlue);
    g.append("text")
      .attr("class", "text-semibold")
      .attr("x", targetWidth)
      .attr("y", offset + 8)
      .attr("dy", "0.31em")
      .attr("text-anchor", "end")
      .attr("fill", republicanRed)
      .text(`${republicanCandidate} - ${votesR}`);
    g.append("rect")
      .attr("x", targetWidth - votesScale(votesR))
      .attr("y", offset + totalHeight - barHeight)
      .attr("width", votesScale(votesR))
      .attr("height", barHeight)
      .attr("fill", republicanRed);

    // legend
    g.append("rect")
      .attr("x", width / 2 - 100)
      .attr("y", 37)
      .attr("width", 15)
      .attr("height", 15)
      .style("fill", democratBlue);
    g.append("rect")
      .attr("x", width / 2)
      .attr("y", 37)
      .attr("width", 15)
      .attr("height", 15)
      .style("fill", republicanRed);
    g.append("text")
      .attr("class", "text-semibold")
      .attr("x", width / 2 - 80)
      .attr("y", 50)
      .text("Democrat")
      .style("font-size", "15px");
    g.append("text")
      .attr("class", "text-semibold")
      .attr("x", width / 2 + 20)
      .attr("y", 50)
      .text("Republican")
      .style("font-size", "15px");
  }
}
