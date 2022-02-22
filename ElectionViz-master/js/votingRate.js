const toSnakeCase = (str) =>
  str &&
  str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map((x) => x.toLowerCase())
    .join("_");

function displayVotingRate() {
  var svg = d3.select("#viz");
  var margin = { top: 20, left: 47, bottom: 50, right: 30 };
  var width = +svg.attr("width") - 150;
  var height = +svg.attr("height") - 150;
  var parseTime = d3.timeParse("%Y");
  var x = d3.scaleTime().range([0, width]);
  var y = d3
    .scaleLinear()
    .range([height - margin.bottom - margin.top, margin.top]);

  d3.csv("data/demographic-voting-rates.csv", function (error, data) {
    if (error) throw error;

    data.forEach(function (d) {
      d.year = parseTime(d.Year);
      d.race = d.Race;
      d.votingRate = +d.Citizen_population;
    });

    var sumstat = d3
      .nest()
      .key(function (d) {
        return d.race;
      })
      .entries(data);

    x.domain(
      d3.extent(data, function (d) {
        return d.year;
      })
    ).nice();
    y.domain([
      d3.min(data, function (d) {
        return d.votingRate;
      }),
      d3.max(data, function (d) {
        return d.votingRate;
      }),
    ]).nice();

    var chart = svg
      .append("g")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add the x Axis
    chart
      .append("g")
      .attr(
        "transform",
        "translate(0," + (height - margin.bottom - margin.top) + ")"
      )
      .call(d3.axisBottom(x));

    // text label for the x axis
    chart
      .append("text")
      .attr("class", "text-normal")
      .attr(
        "transform",
        "translate(" + width / 2 + " ," + (height - margin.bottom + 20) + ")"
      )
      .style("text-anchor", "middle")
      .text("Year");

    // Add the y Axis
    chart.append("g").call(d3.axisLeft(y));

    // text label for the y axis
    chart
      .append("text")
      .attr("class", "text-normal")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Voting Rate");

    var races = sumstat.map(function (d) {
      return d.key;
    });
    var color = d3.scaleOrdinal(d3.schemeCategory10).domain(races);

    chart
      .selectAll(".line")
      .data(sumstat)
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", function (d) {
        return color(d.key);
      })
      .attr("stroke-width", 2)
      .attr("id", function (d) {
        return `${toSnakeCase(d.key)}_path`;
      })
      .attr("d", function (d) {
        return d3
          .line()
          .x(function (d) {
            return x(d.year);
          })
          .y(function (d) {
            return y(+d.votingRate);
          })(d.values);
      });

    color.domain().forEach((race) => {
      d3.select(`#${toSnakeCase(race)}_legend`).style(
        "background",
        color(race)
      );
      d3.select(`#${toSnakeCase(race)}`).on("change", () => {
        if (d3.select(`#${toSnakeCase(race)}`).property("checked")) {
          chart
            .select(`#${toSnakeCase(race)}_path`)
            .transition()
            .duration(100)
            .style("opacity", 1);
        } else {
          chart
            .select(`#${toSnakeCase(race)}_path`)
            .transition()
            .duration(100)
            .style("opacity", 0);
        }
      });
    });
  });
}
