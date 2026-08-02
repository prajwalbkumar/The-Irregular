const cfg = require('../../field.config.js');

// IATA code of the airport with home:true — drives the topbar city label,
// the globe's home point, and the map-note copy without hardcoding it.
module.exports = () => Object.keys(cfg.airports).find(k => cfg.airports[k].home) || Object.keys(cfg.airports)[0];
