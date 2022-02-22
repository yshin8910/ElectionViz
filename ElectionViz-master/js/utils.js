/**
 * Turns an integer into a number string with commas
 * @param {Number} x Number
 * @returns Number with commas
 */
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
