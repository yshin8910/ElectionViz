// State FIPS codes
const MICHIGAN = 26;
const FLORIDA = 12;

// Draw initial graph
function drawInitial() {
  clearSvg();
  toggleVotingRateInput();
  setTimeout(draw2004ElectionMap, 50);
}

// Clear what is currently in the svg
function clearSvg() {
  d3.selectAll("svg>*").transition().duration(100).style("opacity", 0).remove();
  d3.select(".tooltip").transition().duration(100).style("opacity", 0);
}

// Function to toggle inputs
function toggleVotingRateInput(enable = false) {
  if (enable) {
    d3.select("#voting-rate-inputs")
      .transition()
      .duration(200)
      .style("opacity", 1)
      .style("z-index", 0);
  } else {
    d3.select("#voting-rate-inputs").style("opacity", 0).style("z-index", -1);
  }
}

function draw2004ElectionMap() {
  displayElectionMap(2004);
}

function draw2008ElectionMap() {
  clearSvg();
  displayElectionMap(2008);
}

function drawElectionDifference() {
  clearSvg();
  displayElectionDifference();
}

function drawMichiganUnemployment() {
  clearSvg();
  displayUnemployment(MICHIGAN);
  drawUnemploymentLegend(MICHIGAN);
}

function drawFloridaUnemployment() {
  clearSvg();
  displayUnemployment(FLORIDA);
  drawUnemploymentLegend(FLORIDA);
}

function drawVotingRateLineChart() {
  clearSvg();
  displayVotingRate();
}

function dummyFunc() {}

// Array of all the graph functions
// Will be called from the scroller functionality

let activationFunctions = [
  drawInitial,
  draw2008ElectionMap,
  dummyFunc,
  drawElectionDifference,
  dummyFunc,
  drawMichiganUnemployment,
  drawFloridaUnemployment,
  drawVotingRateLineChart,
];

// All the scrolling function
// Will draw a new graph based on the index provided by the scroll

// setup scroll functionality

let lastIndex,
  activeIndex = 0;

drawInitial();

// setup scroll functionality
var scroll = scroller().container(d3.select("#graphic"));

// pass in .step selection as the steps
scroll(d3.selectAll(".step"));

// setup event handling
scroll.on("active", function (index) {
  // highlight current step text
  d3.selectAll(".step")
    .transition()
    .duration(500)
    .style("opacity", function (d, i) {
      return i === index ? 1 : 0.1;
    });
  activeIndex = index;
  let sign = activeIndex - lastIndex < 0 ? -1 : 1;
  let scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
  scrolledSections.forEach((i) => {
    if (i > activationFunctions.length - 1) {
      clearSvg();
      toggleVotingRateInput();
      return;
    }
    if (i === 7) {
      toggleVotingRateInput(true);
    } else {
      toggleVotingRateInput();
    }

    // redraw election difference map on the second step if user is scrolling backwards
    if (i === 4 && sign === -1) {
      clearSvg();
      drawElectionDifference();
    } else if (i === 2 && sign === -1) {
      clearSvg();
      draw2008ElectionMap();
    } else if (i === 1 && sign == -1) {
      dummyFunc();
    } else if (i === 3 && sign == -1) {
      dummyFunc();
    } else {
      setTimeout(activationFunctions[i]);
    }
  });
  lastIndex = activeIndex;
});
