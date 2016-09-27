import d3 from "d3";

module.exports = (function(){

    // global variables
    var $el, el;
    var width = 0,
    height = 0;

    var projection;     // d3.geo.mercator - функция отображения карты (развернутая сфера)
    var color;          // color scale function
    var path;           // функция отрисовки path. отрисовывает все path согласно данным
    var zoom;           // функция zoom-ирования - zoom-listener (scale, translate)
    var svg;            // root-объект svg
    var graticule;
    var grid;

    var maxValue = 0;
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
        maxZoomIn = width*2;
        maxZoomOut = scaling.baseScale; // width/6
        path = d3.geo.path().projection(projection);
        graticule = d3.geo.graticule();


        zoom = d3.behavior.zoom()
            .translate( projection.translate() )
            .scale( projection.scale() )
            .scaleExtent( [maxZoomOut, maxZoomIn] )
            .on('zoom', function(d) {
                interactMap(d);
            });

        svg = d3.select(el)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
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

    // MAIN FUNCTION ************************************************************
    var createMap = function(element) {
        initMap(element);
        setInitialState();

        var reset = d3.select('button#reset')
            .on('click', function(e){
                var scale = maxZoomOut;
                var x = width / 2;
                var y = height / 2;
                projection.scale(scale).translate([x,y]);
                zoom.scale( projection.scale() ).translate( projection.translate() );
                countries.transition()
                    .ease('linear')
                    .delay(50)
                    .duration(500)
                    .attr('d', path);

                citiesPopulation.transition()
                    .ease('linear')
                    .duration(500)
                    .attr('cx', function(d){
                        return projection([d.longitude, d.latitude])[0];
                    })
                    .attr('cy', function(d){
                        return projection([d.longitude, d.latitude])[1];
                    });

                    citiesArea.transition()
                        .ease('linear')
                        .duration(500)
                        .attr('cx', function(d){
                            return projection([d.longitude, d.latitude])[0];
                        })
                        .attr('cy', function(d){
                            return projection([d.longitude, d.latitude])[1];
                        });


            })

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

                var countriesGroup = svg.append('g')
                    .attr('id', 'countriesGroup')
                    .call(zoom); // bind zoom listener to the countries group

                countriesGroup.append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', width)
                    .attr('height', height)
                    .attr('fill', '#e9e9e9');

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
                        .call(zoom);


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

                        .on('mouseover', function(d){
                            // var x = d3.event.pageX;
                            // var y = d3.event.pageY;
                            var x = this.getAttribute("cx");
                            var y = this.getAttribute("cy");
                            var r = this.getAttribute("r");
                            d3.select('#tooltip .name')
                                .text(d.name);
                            d3.select('#tooltip .value-area')
                                .text( d.Area );
                            d3.select('#tooltip .value-population')
                                .text( d.Population );
                            d3.select('#tooltip')
                                .style('left', function(){
                                    var positionX = x - this.clientWidth/2 + r/4;
                                    return positionX + 'px';
                                })
                                .style('top', function() {
                                    var positionY = y - this.clientHeight + Math.ceil(r);
                                    return positionY + 'px';
                                })
                                .style('opacity', 1);
                        })

                        .on('mouseout', function(){
                            d3.select('#tooltip')
                                .style('opacity', 0);
                        })
                        .call(zoom);
                });
            });
        });
    };

    return {
        createMap: createMap
    };

})();
