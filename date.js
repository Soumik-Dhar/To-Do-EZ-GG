// function to get current date
function getDate() {
  const options = {
    weekday: "long",
    month: "long",
    day: "numeric"
  }
  return new Date().toLocaleDateString("en-US", options);
}

// exporting function
exports.getDate = getDate;
