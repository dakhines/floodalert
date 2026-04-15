const rawLocationData = require("../data/rawLocationData");

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getAllRawData() {
  return rawLocationData;
}

function getRawDataByState(state) {
  const normalizedState = normalize(state);

  return rawLocationData.filter(
    (item) => normalize(item.state) === normalizedState
  );
}

function getRawDataByCity(city) {
  const normalizedCity = normalize(city);

  return rawLocationData.filter(
    (item) => normalize(item.city) === normalizedCity
  );
}

function getRawDataByCityAndState(city, state) {
  const normalizedCity = normalize(city);
  const normalizedState = normalize(state);

  return rawLocationData.filter(
    (item) =>
      normalize(item.city) === normalizedCity &&
      normalize(item.state) === normalizedState
  );
}

module.exports = {
  getAllRawData,
  getRawDataByState,
  getRawDataByCity,
  getRawDataByCityAndState,
};
