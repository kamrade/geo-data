import d3 from "d3";

module.exports = (function(){


    // var countries;
    // var cities;

    var createMap = function(el) {
        console.log('start creating map');
        var $el = document.querySelector(el);
        var width = $el.clientWidth;
        var height = $el.clientHeight;

        var projection = d3.geo.mercator()
                            .center([0, 40])
                            .translate( [width/2, height/2] )
                            .scale([width/7]);

        // console.log( projection([100.544285, 13.726721]) );
        // var color = d3.scale.quantize()
        // 			.range([ "#dbdbdb", "#c2c2c2", "#949494", "#767676", "#4a4a4a" ]);
        var color = d3.scale.linear()
                        .domain([0, 1367485388])
                        .range(['#aaa', '#333']);


        var path = d3.geo.path()
                        .projection(projection);

        // var maxZoomIn = width*2;
        // var maxZoomOut = width/7;
        //
        // var zoom = d3.behavior.zoom()
        //     .translate( projection.translate() )
        //     .scale( projection.scale() )
        //     .scaleExtent( [maxZoomOut, maxZoomIn] );
        //
        // var zoomIn = function() {
        //     var newScale = Math.min( projection.scale() * 2, maxZoomIn );
        //     zoomTo(newScale);
        // };
        //
        // var zoomOut = function(){
        //     var newScale = Math.max( projection.scale() / 2, maxZoomOut );
        //     zoomTo(newScale);
        // }
        //
        //
        // var zoomTo = function(newScale){
        //     var t = projection.translate();
        //     var s = projection.scale();
        //
        //
        //     t[0] -= width/2;
        //     t[0] *= newScale/s;
        //     t[0] += width/2;
        //
        //     t[1] -= height * 0.55;
        //     t[1] *= newScale/s;
        //     t[1] += height * 0.55;
        //
        //     zoom.translate(t).scale(newScale);
        //     projection.translate(t).scale(newScale);
        //
        //     countries.transition()
        //             .ease('linear')
        //             .delay(50)
        //             .duration(500)
        //             .attr('d', path);
        //
        //     cities.transition()
        //             .ease('linear')
        //             .duration(500)
        //             .attr('cx', d => {
        //                 return projection( [d.longitude, d.latitude])[0];
        //             })
        //             .attr('cy', d => {
        //                 return projection( [d.longitude, d.latitude])[1];
        //             });
        // }

        d3.select('#zoomIn')
            .on('click', function() {
                zoomIn();
            });

        d3.select('#zoomOut')
            .on('click', function() {
                zoomOut();
            });

        var svg = d3.select(el)
                    .append('svg')
                    .attr('width', width)
                    .attr('height', height);

        d3.csv('data/countries_coma.csv', function(data){

            color.domain([
                0,
                d3.max(data, function(d){
                    return +d.Population;
                })
            ]);

            d3.json('/data/geo.json', function(json){

                for (var i = 0, l = data.length; i < l; i++) {

                    var dataCountryCode = data[i].countryCode;
                    var dataValue = +data[i].Population;

                    for(var j = 0, f = json.features.length; j < f; j++){
                        var jsonCountryCode = json.features[j].properties.iso_a3;
                        if(dataCountryCode == jsonCountryCode){
                            json.features[j].properties.population = dataValue;
                            break;
                        }
                    }
                }

                svg.selectAll('path')
                    .data(json.features)
                    .enter()
                    .append('path')
                    .classed("country", true)
                    .attr('d', path)
                    .style('fill', d => {
                        var value = d.properties.population;
                        if(value){
                            return color(value);
                        } else {
                            return '#e74630';
                        }
                    });

                d3.csv('data/biggest_cities.csv', data => {

                    svg.selectAll('circle.pop')
                        .data(data)
                        .enter()
                        .append('circle')
                        .style('fill', '#e74630')
                        .style('opacity', 0)
                        .classed('pop', true)
                        .attr('cx', d => {
                            return projection([d.longitude, d.latitude])[0];
                        })
                        .attr('cy', d => {
                            return projection([d.longitude, d.latitude])[1];
                        })
                        .attr('r', 0)
                        .transition()
                        .delay(500)
                        .duration(500)
                        .attr('r', d => {
                            // return 5;
                             var population = d.Population.replace(/\,/g, "");
                            return Math.sqrt((+population / width) * 0.2);
                        })
                        .style('opacity', .2);


                    svg.selectAll('circle.area')
                        .data(data)
                        .enter()
                        .append('circle')
                        .style('fill', '#5b5388')
                        .style('opacity', 0)
                        .classed('area', true)
                        .attr('cx', d => {
                            return projection([d.longitude, d.latitude])[0];
                        })
                        .attr('cy', d => {
                            return projection([d.longitude, d.latitude])[1];
                        })
                        .attr('r', 0)
                        .transition()
                        .duration(500)
                        .attr('r', d => {
                            // return 5;
                             var Area = d.Area.replace(/\,/g, "");
                            return Math.sqrt((+Area / width * 20) );
                        })
                        .style('opacity', .8);

                });

            }); // end d3.json()
        }); // end d3.csv()
    };

    return {
        createMap: createMap

    };

})();
