import d3 from "d3";

console.log( "d3 version is " + d3.version );

// var geoData = require('./components/geo-data/geo-data');
import geoData from './components/geo-data/geo-data';

var el = "#geo-data";
geoData.createMap(el);


// test events
var activate = d3.select("#activate")
    .on('click', geoData.activateMap);

var deactivate = d3.select("#deactivate")
    .on('click', geoData.deactivateMap);

var reset = d3.select('#reset')
    .on('click', geoData.resetMap);