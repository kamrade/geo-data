import d3 from "d3";

console.log( "d3 version is " + d3.version );

// var geoData = require('./components/geo-data/geo-data');
import geoData from './components/geo-data/geo-data';

var el = "#geo-data";
geoData.createMap(el);
