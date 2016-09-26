import d3 from "d3";

module.exports = (function(){


    var countries;
    var citiesPopulation;
    var citiesArea;

    var transitionDuration = 500;

    var createMap = function(el) {
        console.log('start creating map');
        var $el = document.querySelector(el);
        var width = $el.clientWidth;
        var height = $el.clientHeight;

        var projection = d3.geo.mercator()
                            .center([0, 40])
                            .translate( [width/2, height/2] )
                            .scale([width/7]);

        var color = d3.scale.linear()
                        .domain([0, 1367485388])
                        .range(['#d3d5d7', '#ababab']);


        var path = d3.geo.path()
                        .projection(projection);

        var maxZoomIn = width*2;
        var maxZoomOut = width/7;
        //
        var zoom = d3.behavior.zoom()
            .translate( projection.translate() )
            .scale( projection.scale() )
            .scaleExtent( [maxZoomOut, maxZoomIn] )

            .on('zoom', d => {
                var t = d3.event.translate;
                var s = d3.event.scale;

                zoom.translate(t);
                projection.translate(t).scale(s)

                countries.attr('d', path);

                citiesPopulation.attr('cx', d => {
                    return projection( [d.longitude, d.latitude] )[0];
                })
                .attr('cy', d => {
                    return projection([d.longitude, d.latitude])[1];
                });
                // citiesArea
                citiesArea.attr('cx', d => {
                    return projection( [d.longitude, d.latitude] )[0];
                })
                .attr('cy', d => {
                    return projection([d.longitude, d.latitude])[1];
                });
            });




        var zoomIn = function() {
            var newScale = Math.min( projection.scale() * 2, maxZoomIn );
            zoomTo(newScale);
        };

        var zoomOut = function(){
            var newScale = Math.max( projection.scale() / 2, maxZoomOut );
            zoomTo(newScale);
        }


        var zoomTo = function(newScale){
            var t = projection.translate();
            var s = projection.scale();


            t[0] -= width/2;
            t[0] *= newScale/s;
            t[0] += width/2;

            t[1] -= height * 0.55;
            t[1] *= newScale/s;
            t[1] += height * 0.55;

            zoom.translate(t).scale(newScale);
            projection.translate(t).scale(newScale);

            // transition

            countries.transition()
                    .ease('linear')
                    .delay(50)
                    .duration(transitionDuration)
                    .attr('d', path);

            citiesPopulation.transition()
                    .ease('linear')
                    .duration(transitionDuration)
                    .attr('cx', d => {
                        return projection( [d.longitude, d.latitude] )[0];
                    })
                    .attr('cy', d => {
                        return projection( [d.longitude, d.latitude] )[1];
                    });

            citiesArea.transition()
                    .ease('linear')
                    .duration(transitionDuration)
                    .attr('cx', d => {
                        return projection( [d.longitude, d.latitude] )[0];
                    })
                    .attr('cy', d => {
                        return projection( [d.longitude, d.latitude] )[1];
                    });

        }

        d3.select('#zoomIn')
            .on('click', function() {
                zoomIn();
            });

        d3.select('#zoomOut')
            .on('click', function() {
                zoomOut();
            });

        var zoomPresets = [
            {
                name: 'All',
                scale: maxZoomOut,
                x: width/2,
                y: height/2
            },
            {
                name: 'Africa',
                scale: width / 2.5,
                x: width / 2.5,
                y: 0
            },{
                name: 'Americas',
                scale: width /5,
                x: width * 0.8,
                y: height / 3
            }, {
                name: 'Asia',
                scale: width/4,
                x: width/15,
                y: height*0.6
            }, {
                name: 'Europe',
                scale: width*0.6,
                x: width / 3,
                y: height*0.8
            }
        ];

        d3.select('#presets-container')
            .selectAll('button')
            .data(zoomPresets)
            .enter()
            .append('button')
            .text(d => {
                return d.name;
            })
            .on('click', d => {

                var s = d.scale;
                var x = d.x;
                var y = d.y;

                projection.scale(s)
                            .translate([x,y]);

                zoom.scale( projection.scale() )
                        .translate( projection.translate() );

                countries.transition()
                    .ease('linear')
                    .delay(50)
                    .duration(transitionDuration)
                    .attr('d', path);

                citiesPopulation.transition()
                    .ease('linear')
                    .duration(transitionDuration)
                    .attr('cx', d => {
                        return projection([d.longitude, d.latitude])[0];
                    })
                    .attr('cy', d => {
                        return projection([d.longitude, d.latitude])[1];
                    });

                citiesArea.transition()
                    .ease('linear')
                    .duration(transitionDuration)
                    .attr('cx', d => {
                        return projection([d.longitude, d.latitude])[0];
                    })
                    .attr('cy', d => {
                        return projection([d.longitude, d.latitude])[1];
                    });



            })





















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
                    .style('fill', d => {
                        var value = d.properties.population;
                        if(value){
                            return color(value);
                        } else {
                            return '#fff';
                        }
                    });

                d3.csv('data/biggest_cities.csv', data => {

                    citiesPopulation = svg.selectAll('circle.pop')
                        .data(data)
                        .enter()
                        .append('circle')
                        .style('fill', '#e74630')
                        .classed('pop', true)
                        .attr('cx', d => {
                            return projection([d.longitude, d.latitude])[0];
                        })
                        .attr('cy', d => {
                            return projection([d.longitude, d.latitude])[1];
                        })
                        .attr('r', 0)
                        .attr('r', d => {
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
                        .attr('cx', d => {
                            return projection([d.longitude, d.latitude])[0];
                        })
                        .attr('cy', d => {
                            return projection([d.longitude, d.latitude])[1];
                        })
                        .attr('r', 0)
                        .attr('r', d => {
                             var Area = d.Area.replace(/\,/g, "");
                            return Math.sqrt((+Area / width * 20) );
                        })
                        .style('opacity', .8)
                        .call(zoom);

                });

            }); // end d3.json()
        }); // end d3.csv()
    };

    return {
        createMap: createMap

    };

})();
