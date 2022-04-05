var tempCountryCode = "IND";
var temp_data;
var path = d3.geoPath();
var data = d3.map();

var legendScale = d3.scaleThreshold().domain([0,10, 20, 40, 60, 80, 90,100]).range(d3.schemeReds[8]);
var svg = d3.select(".scale"), width = +svg.attr("width");
var legend = svg.selectAll(".legend").data([0,10, 20, 40, 60, 80, 90,100]).enter().append("g").attr("class", "legend")
             .attr("transform", function(d, i) { return "translate(0," + i * 25 + ")"; });

legend.append("text").attr("y", 10).attr("x", width-54).attr("dy", ".345em").style("text-anchor", "end")
      .text(function(data) {
        var number;
        switch(data){
            case 0: number = "0"; break;
            case 10: number = "10"; break;
            case 20: number = "20"; break;
            case 40: number = "40"; break;
            case 60: number = "60"; break;
            case 80: number = "80"; break;
            case 90: number = "90"; break;
            case 100: number = "100"; break;
        }
        if(number == "0"){return "= "+ number;}
        else{return "<="+ number;}
    });

legend.append("rect").attr("x", width - 50).attr("width", 18).attr("height", 18).style("fill", function(d){return legendScale(d)});

var infoViewSegment = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
var svg = d3.select("#geoMapView"), width = +svg.attr("width"), height = +svg.attr("height");
var projection = d3.geoMercator().scale(145).center([0,65]).translate([width / 2, height / 3.5]);

function render(data){
    temp_data = d3.nest().key(function (d){ return d.code;}).entries(data);
}
function type(d){
    d.jan = +d.jan.split('|')[0];
    d.feb = +d.feb.split('|')[0];
    d.mar = +d.mar.split('|')[0];
    d.apr = +d.apr.split('|')[0];
    d.may = +d.may.split('|')[0];
    d.jun = +d.jun.split('|')[0];
    d.jul = +d.jul.split('|')[0];
    d.aug = +d.aug.split('|')[0];
    d.sep = +d.sep.split('|')[0];
    d.oct = +d.oct.split('|')[0];
    d.nov = +d.nov.split('|')[0];
    d.dec = +d.dec.split('|')[0];
    return d;
}
d3.csv("processedData.csv", type, render);
d3.queue().defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").await(ready);

function getGraphData() {
    d3.csv("countryMap.csv",
        function (d) {
            if (d.countryCode == tempCountryCode) {
                return {country: d.country}
            }
        },
        function (data) {
            d3.select("#regionName").append("div").data(data).html(function(data){return "<div id='countryName'>"+data.country+"</div>"})
        });
}
function getWorldMap() {
    d3.select("#graphView").selectAll("*").remove();
    var spacing = {top: 10, right: 30, bottom: 30, left: 60},
        width = 450 - spacing.left - spacing.right,height = 285 - spacing.top - spacing.bottom;
    var y = d3.scaleLinear().range([height, 0]);
    var svg = d3.select("#graphView")
        .append("svg").attr("width", width + spacing.left + spacing.right).attr("height", height + spacing.top + spacing.bottom)
        .append("g").attr("transform","translate(" + spacing.left + "," + spacing.top + ")")
        .on("mouseout",function(d){
            d3.selectAll(".grid line").style('stroke-opacity','0.10');
        })
        .on("mouseover",function(d){
            d3.selectAll(".grid line").style('stroke-opacity','0.35');
        });

    function make_y_gridlines() {
        return d3.axisLeft(y).ticks(5)
    }
    d3.csv("graph.csv",
        function (d) {
            if(d.countryCode==tempCountryCode){
                return {
                    date: d3.timeParse("%Y-%m-%d")(d.date), value: d.males, code: d.countryCode
                }}
        },
        function (data) {
            var y = d3.scaleLinear().domain([0, d3.max(data, function (d) {return +d.value;})]).range([height, 0]);
            var x = d3.scaleTime().domain(d3.extent(data, function (d) {return d.date;})).range([0, width]);
            var line = svg.append('g').attr("clip-path", "url(#clip)")
            var brush = d3.brushX().extent([[0, 0], [width, height]]).on("end", updateGraph)

            xAxis = svg.append("g").attr("transform", "translate(0," + height + ")").attr('stroke-width', 2).attr("class", "xAxis")
                    .transition().duration(850).call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));

            svg.append("text").attr("transform","translate(" + (width/2) + " ," +(height + spacing.top + 20) + ")").style("text-anchor", "middle")
                .style("fill","#050543").style("font","13px Arial").style("font-weight","bold").text("Year 2020");

            svg.append("g").attr("class", "grid").call(make_y_gridlines().tickSize(-width).tickFormat(""))
            yAxis = svg.append("g").call(d3.axisLeft(y)).attr('stroke-width', 2);

            svg.append("text").attr("transform", "rotate(-90)").attr("y", 0 - spacing.left).attr("x",0 - (height / 2))
                .attr("dy", "2em").attr("class","yLabel").style("text-anchor", "middle").style("fill","#050543")
                .style("font","14px Arial").style("font-weight","bold").text("Male to Female Ratio");

            svg.append("defs").append("svg:clipPath").attr("id", "clip").append("svg:rect") .attr("width", width)
                .attr("height", height).attr("x", 0).attr("y", 0);

            line.append("path").datum(data).attr("class", "line").attr("fill", "none").attr("stroke", "#cf5c0f").attr("stroke-width", 2)
                .attr("d", d3.line().x(function (d) {return x(d.date)}).y(function (d) {return y(d.value)}))

            line.append("g").attr("class", "brush").call(brush);

            var countIdle
            function timer() {
                countIdle = null;
            }
            function updateGraph() {
                temp_selection = d3.event.selection
                if (!temp_selection) {
                    if (!countIdle) return countIdle = setTimeout(timer, 350);
                    x.domain([4, 8])
                } else {
                    x.domain([x.invert(temp_selection[0]), x.invert(temp_selection[1])])
                    line.select(".brush").call(brush.move, null) 
                }
                xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d/%m")))
                line.select('.line').transition().duration(1000).attr("d",d3.line().x(function (d){return x(d.date)})
                        .y(function (d){return y(d.value)}))
            }
            svg.on("dblclick", function () {x.domain(d3.extent(data, function (d) {return d.date;}))
                xAxis.transition().call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")))
                line.select('.line').transition().attr("d", d3.line().x(function (d) {return x(d.date)}).y(function (d) {return y(d.value)}))
            });
        })
}

function ready(error, topo) {
    let mouseOver = function(d) {
        d3.selectAll(".Country").transition().duration(200).style("cursor","hand").style("opacity", .5)
        d3.select(this).transition().duration(200).style("opacity", 1).style("stroke", "white")

        var sliderCount = document.getElementById("slider").value;
        var cases;
        function myFunction(data){
            if(data.key==d.id){
                switch (sliderCount) {
                    case "1": cases=data.values[0].jan;
                        break;
                    case "2": cases=data.values[0].feb;
                        break;
                    case "3": cases=data.values[0].mar;
                        break;
                    case "4": cases=data.values[0].apr;
                        break;
                    case "5": cases=data.values[0].may;
                        break;
                    case "6": cases=data.values[0].jun;
                        break;
                    case "7": cases=data.values[0].jul;
                        break;
                    case "8": cases=data.values[0].aug;
                        break;
                    case "9": cases=data.values[0].sep;
                        break;
                    case "10": cases=data.values[0].oct;
                        break;
                    case "11": cases=data.values[0].nov;
                        break;
                    case "12": cases=data.values[0].dec;
                        break;
                }
            }
        }
        temp_data.forEach(myFunction)

        if(cases != undefined || cases != null){
            infoViewSegment.transition().duration(200).style("opacity", .9);
            infoViewSegment.html("<b style='font-size: 16px;font-weight:bolder;'>"+d.properties.name + "</br>"+
            "</b> <span id='casesNum' style='color: #4800ff;font-weight: bold; font-size: 14px' >"+ cases + " M/F Ratio </span>")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 26) + "px");
        }else{
            infoViewSegment.transition().duration(200).style("opacity", .9);
            infoViewSegment.html("<b style='font-size: 16px;font-weight:bolder;'>"+d.properties.name + "</br>"+
            "</b> <span id='casesNum' style='color: #ff0000;font-weight: bold; font-size: 14px' >"+ "NO DATA AVAILABLE </span>")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 26) + "px");
        }
    }

    let click = function(d){
        tempCountryCode = d.id;
        d3.select("#regionName").selectAll("*").remove();
        d3.select("#graphView").selectAll("*").remove();
        getWorldMap();
        getGraphData();
        d3.select(this).transition().duration(200).style("stroke", "transparent")
    }

    let mouseLeave = function(d) {
        d3.selectAll(".Country").transition().duration(350).style("opacity", .8)
        d3.select(this).transition().duration(200).style("stroke", "white")
        d3.select(".tooltip").transition().duration(300).style("opacity", 0);
    }

    svg.append("g").selectAll("#geoMapView path").data(topo.features).enter().append("path").attr("d", d3.geoPath().projection(projection))
        .attr("fill", function (d) {
            var val = 0;
            function myFunction(item){
                if(item.key==d.id){
                    val = item.values[0].mar
                }
            }
            temp_data.forEach(myFunction)
            return legendScale(val);
        })
        .style("stroke", "transparent").attr("class", function(d){return "Country"}).style("opacity", .8)
        .on("mouseover", mouseOver ).on("mouseleave", mouseLeave ).on("click",click);

    d3.select("#slider").on("change", function change() {
        var temp_value = this.value;
        var value;
        d3.selectAll("#geoMapSegment path").style("fill", function(d) {
            function myFunction(data){
                if(data.key==d.id){
                    switch (temp_value) {
                        case "1": value=data.values[0].jan;
                            break;
                        case "2": value=data.values[0].feb;
                            break;
                        case "3": value=data.values[0].mar;
                            break;
                        case "4": value=data.values[0].apr;
                            break;
                        case "5": value=data.values[0].may;
                            break;
                        case "6": value=data.values[0].jun;
                            break;
                        case "7": value=data.values[0].jul;
                            break;
                        case "8": value=data.values[0].aug;
                            break;
                        case "9": value=data.values[0].sep;
                            break;
                        case "10": value=data.values[0].oct;
                            break;
                        case "11": value=data.values[0].nov;
                            break;
                        case "12": value=data.values[0].dec;
                            break;
                    }
                }
            }
            temp_data.forEach(myFunction)
            return legendScale(value);
        })});
}

function barGraphLoad(value) {
    var spacing = {top: 30, right: 30, bottom: 20, left: 60},
          width = 400 - spacing.left - spacing.right,height = 219 - spacing.top - spacing.bottom;
  
    var svg = d3.select("#barGraph")
                .append("svg").attr("width", width + spacing.left + spacing.right).attr("height", height + spacing.top + spacing.bottom)
                .append("g").attr("transform","translate(" + spacing.left + "," + spacing.top + ")").style('pointer-events','all');
  
    var x = d3.scaleBand().range([0, width]).padding(0.2);
    var xAxis = svg.append("g").attr("transform", "translate(0," + height + ")").attr("class", "myXaxis").attr('stroke-width', 2)
    var y = d3.scaleLinear().range([height, 0]);
    var yAxis = svg.append("g").attr("class", "myYaxis").attr('stroke-width', 2)
    svg.append("text").attr("transform", "rotate(-90)").attr("y", 0 - spacing.left).attr("x",0 - (height / 2))
       .attr("dy", "2em").attr("class","yLabel").style("text-anchor", "middle").style("fill","#050543")
       .style("font","14px Arial").style("font-weight","bolder").text("Male to Female %");
  
    var infoViewSegment = d3.select("body").append("div").attr("class", "toolTip");
    update('ratio')
  
    function update(selectedVar) {
        d3.csv("barGraph.csv", function (data) {
            x.domain(data.map(function (d) { return d.virus;}))
            xAxis.transition().duration(850).call(d3.axisBottom(x))
  
            y.domain([0, d3.max(data, function (d) { return +d[selectedVar]})]);
            yAxis.transition().duration(850).call(d3.axisLeft(y));
  
            var bars = svg.selectAll("#barGraph rect").data(data)
            bars.enter().append("rect").merge(bars).on("mouseover",
                function (d){
                      d3.select(this).attr("fill","#84BADA");
                      infoViewSegment
                          .style("left", d3.event.pageX - 50 + "px")
                          .style("top", d3.event.pageY - 70 + "px")
                          .style("display", "inline-block")
                          .html("<b style='font-size: 16px;font-family:sans-serif'>"+(d.virus) + "</br>"+
                              "</b> <span id='casesNum' style='color: #4800ff;font-weight:bold;font-family:sans-seriffont-size: 14px' >"+(d[selectedVar])+"%");
                  })
                .on("mouseout", function(d){ infoViewSegment.style("display", "none");
            
            d3.select(this).attr("fill","#fb6767")}).transition().duration(750).attr("x", function (d) {return x(d.virus);})
              .attr("y", function (d) {return y(d[selectedVar]);}).attr("width", x.bandwidth())
              .attr("height", function (d) {return height - y(d[selectedVar]);}).attr("fill", "#fb6767")
          })
      }
  }