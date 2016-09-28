import d3 from "d3";
import classie from "../../classie"

module.exports = (function(){

    // global variables
    var $el, el;
    var width = 0,
    height = 0;
    var tooltip = d3.select('#tooltip');

    var projection;     // d3.geo.mercator - функция отображения карты (развернутая сфера)
    var color;          // color scale function
    var path;           // функция отрисовки path. отрисовывает все path согласно данным
    var zoom;           // функция zoom-ирования - zoom-listener (scale, translate)
    var svg;            // root-объект svg
    var graticule;
    var grid;

    var maxValue = 0;
    var countriesGroup;
    var countries;
    var citiesPopulation;
    var citiesArea;
    var previousCord = {
        x: 0,
        y: 0
    };

    // options *********************************************************************
    var transitionDuration = 500;
    var mapColors = {
        land_base: '#d3d5d7',
        land_optional: '#ababab'
    };
    var scaling = {
        baseScale: 0 // = width/7;
    };
    var maxZoomIn = 0;
    var maxZoomOut = 0;

    // helpers
    var valueFormat = d3.format(',');

    // INIT MAP ****************************************************************
    var initMap = function(element) {
        el = element
        $el = document.querySelector(el);
        width = $el.clientWidth;
        height = $el.clientHeight;
        scaling.baseScale = width/6;
    };

    // SET INITIAL STATE *******************************************************
    var setInitialState = function() {
        projection = d3.geo.mercator()
                        .center([0, 40])
                        .translate( [width/2, height/2] )
                        .scale( [ scaling.baseScale ] );
        color = d3.scale.linear()
                  .range( [ mapColors.land_base, mapColors.land_optional ] );
        maxZoomIn = width/2;
        maxZoomOut = scaling.baseScale; // width/6
        path = d3.geo.path().projection(projection);
        graticule = d3.geo.graticule();


        zoom = d3.behavior.zoom()
            .translate( projection.translate() )
            .scale( projection.scale() )
            .scaleExtent( [maxZoomOut, maxZoomIn] )
            .on('zoom', interactMap );

        svg = d3.select(el)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        countriesGroup = svg.append('g')
            .attr('id', 'countriesGroup');

        countriesGroup.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width)
            .attr('height', height)
            .attr('fill', '#e9e9e9');
    };

    // work with global variables countries, citiesPopulation, citiesArea
    var interactMap = function(d) {
        var t = d3.event.translate;
        var s = d3.event.scale;
        zoom.translate(t);
        projection.translate(t).scale(s);
        countries.attr('d', path);
        citiesPopulation
            .attr('cx', function(d) { return projection( [d.longitude, d.latitude] )[0]; })
            .attr('cy', function(d) { return projection([d.longitude, d.latitude])[1]; });
        citiesArea
            .attr('cx', function(d) { return projection( [d.longitude, d.latitude] )[0]; })
            .attr('cy', function(d) { return projection([d.longitude, d.latitude])[1]; });
        grid.attr('d', path);
    }

    var mapBehavior = function() {
        
        countriesGroup.call(zoom);

        // работа с данными
        // страны
        d3.csv('data/countries-GDP.csv', function(data){ // страны, GDP
            maxValue = d3.max(data, function(d) { return +d.GDP; })
            color.domain([ 0, maxValue ]);
            // переносим все нужные данные в объект json
            // совмещаем две таблицы countries-GDP и просто geo.json
            // в geo.json - это большой файл с очертаниями стран и континентов.
            d3.json('data/geo.json', function(json) {
                for (var i = 0, l = data.length; i < l; i++) {
                    var dataCountryCode = data[i].countryCode;
                    var dataValue = +data[i].GDP;
                    for(var j = 0, f = json.features.length; j < f; j++){
                        var jsonCountryCode = json.features[j].properties.iso_a3;
                        if(dataCountryCode == jsonCountryCode){
                            json.features[j].properties.population = dataValue;
                            break;
                        }
                    }
                }

                // страны
                countries = countriesGroup.selectAll('path')
                    .data(json.features)
                    .enter()
                    .append('path')
                    .classed("country", true)
                    .attr('d', path)
                    .style('fill', function(d) {
                        var value = d.properties.population;
                        if(value){
                            return color(value);
                        } else {
                            return '#fff';
                        }
                    })

                // сетка
                grid = svg.append("path")
                    .datum(graticule)
                    .attr("class", "graticule")
                    .attr("d", path);

                d3.csv('data/biggest_cities.csv', function(data) {

                    citiesPopulation = svg.selectAll('circle.pop')
                        .data(data)
                        .enter()
                        .append('circle')
                        .style('fill', '#e74630')
                        .classed('pop', true)
                        .attr('cx', function(d) {
                            return projection([d.longitude, d.latitude])[0];
                        })
                        .attr('cy', function(d) {
                            return projection([d.longitude, d.latitude])[1];
                        })
                        .attr('r', 0)
                        .attr('r', function(d) {
                            var population = d.Population.replace(/\,/g, "");
                            return Math.sqrt((+population / width) * 0.05);
                        })
                        .style('opacity', .2)
                        .call(zoom)
                        ;


                    citiesArea = svg.selectAll('circle.area')
                        .data(data)
                        .enter()
                        .append('circle')
                        .style('fill', '#5b5388')
                        .classed('area', true)
                        .attr('cx', function(d) {
                            return projection([d.longitude, d.latitude])[0];
                        })
                        .attr('cy', function(d) {
                            return projection([d.longitude, d.latitude])[1];
                        })
                        .attr('r', 0)
                        .attr('r', function(d) {
                             var Area = d.Area.replace(/\,/g, "");
                            return Math.sqrt((+Area / width * 30) );
                        })
                        .style('opacity', .8)

                        .on('click', function(d){
                            var x = this.getAttribute("cx");
                            var y = this.getAttribute("cy");
                            var r = this.getAttribute("r");
                            d3.select('#tooltip .name')
                                .text(d.name);
                            d3.select('#tooltip .value-area')
                                .text( d.Area );
                            d3.select('#tooltip .value-population')
                                .text( d.Population );
                            tooltip
                                .style('left', function(){
                                    var positionX = x - this.clientWidth/2 + r/4;
                                    return positionX + 'px';
                                })
                                .style('top', function() {
                                    var positionY = y - this.clientHeight + 40;
                                    return positionY + 'px';
                                });
                            tooltipShow();
                        })
                        .on('mouseout', tooltipHide)
                        .call(zoom);
                });
            });
        });        
    };

    // map state
    var resetMap = function(){
        var scale = maxZoomOut;
        var x = width / 2;
        var y = height / 2;
        projection.scale(scale).translate([x,y]);
        zoom.scale( projection.scale() ).translate( projection.translate() );
        countries.transition()
            .ease('linear')
            .delay(50)
            .duration(100)
            .attr('d', path);

        citiesPopulation.transition()
            .ease('linear')
            .duration(100)
            .attr('cx', function(d){
                return projection([d.longitude, d.latitude])[0];
            })
            .attr('cy', function(d){
                return projection([d.longitude, d.latitude])[1];
            });

        citiesArea.transition()
            .ease('linear')
            .duration(100)
            .attr('cx', function(d){
                return projection([d.longitude, d.latitude])[0];
            })
            .attr('cy', function(d){
                return projection([d.longitude, d.latitude])[1];
            });
    };

    var activateMap = function(){
        classie.remove(document.querySelector("#overlay"), 'active');
    }

    var deactivateMap = function(){
        classie.add(document.querySelector("#overlay"), 'active');
        resetMap();
    }

    var tooltipShow = function() {
        tooltip.style('opacity', 1);
    };

    var tooltipHide = function() {
         tooltip.style('opacity', 0);
    };
    
    // MAIN FUNCTION
    var createMap = function(element) {
        initMap(element);
        setInitialState();
        mapBehavior();
    };
    
    return {
        createMap: createMap,
        tooltipHide: tooltipHide,
        activateMap: activateMap,
        deactivateMap: deactivateMap,
        resetMap: resetMap
    };

})();
