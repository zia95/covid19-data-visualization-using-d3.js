


/*
 * OUR GLOBALS VARS
 */
// world data..... 
var _world;
// covid data.....
var _covid;

/*
 *  Load all our data and boot up the ui.....
 */
Promise.all(
    [
        d3.json("./data/world/worldgeo.json"),
        d3.csv("./data/covid/owid-covid-data.csv")
    ]).then(function (data) {

        // set all globals....
        _world = data[0];
        _covid = data[1];

        // begin draw... map
        do_draw();
    }).catch(function (error) {
        console.log(error);
        alert("ERROR, CHECK CONSOLE LOG?");
    });


/*
 * Custom function for helping with data.............
 */

function get_covid_country_data(id)
{
    let c_data = null;
    for (let i = 0; i < _covid.length; i++)
    {
        if (_covid[i].iso_code == id) {
            if (c_data == null) {
                c_data = [];
            }

            c_data.push(_covid[i]);
        }
    }
    
    return c_data;
}
function get_covid_date_last(data_array)
{
    if (data_array == null)
        return null;
    
    let last = null;
    for (let i = 0; i < data_array.length; i++)
    {
        if (last == null) {
            last = data_array[i];
            continue;
        }

        let dt_last = new Date(last.date);
        let dt = new Date(data_array[i].date);

        if (dt_last.getTime() < dt.getTime()) {
            last = data_array[i];
        }
    }
    
    return last;
}
function get_covid_country_date_last(id) {
    return get_covid_date_last(get_covid_country_data(id));
}
function get_covid_countries_date_last() {
    let c_data = null;
    let last = null;
    for (let i = 0; i < _covid.length; i++)
    {
        let curr = _covid[i];

        if (last != null && curr.iso_code == last.iso_code)
            continue;

        curr = get_covid_country_date_last(curr.iso_code);

        if (c_data == null) {
            c_data = [];
        }
        if (curr != null && curr.location != "World") {
            c_data.push(curr);
        }
        last = curr;
    }
    
    return c_data;
}
function sort_covid_data_ascending_date(data_array) {
    if (data_array == null)
        return null;
    return data_array.sort(function (a, b) { return new Date(a.date).getTime() - new Date(b.date).getTime() });
}
function sort_covid_data_descending_date(data_array) {
    if (data_array == null)
        return null;
    data_array.sort(function (a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime() });
}

/*
 * Entry point..... called when all the data was loaded and .... ready to draw all the charts and map.....
 */
function do_draw() {
    // draw the world map.............
    do_map();


    let my_data = get_covid_countries_date_last();
    
    my_data = sort_covid_data_ascending_date(my_data);
    //console.log(my_data);
    
    //pie colors.............
    var color = d3.scaleOrdinal(d3.schemePaired);
    
    //draw pie.............
    draw_pie("#pie_tcases", my_data, 0);
    draw_pie("#pie_ncases", my_data, 1);
    draw_pie("#pie_ndeaths", my_data, 2);
    
    //draw bar.............
    draw_bar("#bar_tcases", my_data, 0);
    draw_bar("#bar_tdeaths", my_data, 1);
}


// function for drawing different types of pie or donut charts.....
function draw_pie(svg_id, data, content_id, custom_color_ordinal_scale = null) {
    // set the dimensions and margins of the graph

    var svg = d3.select(svg_id),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    
    /*
    // append the svg object to the div called 'my_dataviz'
    var svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    */
    // Create dummy data

    //var data = { a: 9, b: 20, c: 30, d: 8, e: 12 }
    
    // set the color scale
    var color = d3.scaleOrdinal(d3.schemePaired);
    if(custom_color_ordinal_scale != undefined || custom_color_ordinal_scale != null)
    {
        color = custom_color_ordinal_scale;
    }
    // Compute the position of each group on the pie:
    var pie = d3.pie()
        .value(function (d)
        {
            let amnt;
            if (content_id == 0)
                amnt = d.value.total_cases;
            if (content_id == 1)
                amnt = d.value.new_cases;
            else if (content_id == 2)
                amnt = d.value.new_deaths;

            //console.log("amnt: " + amnt);

            return +amnt;
        })
    var data_ready = pie(d3.entries(data))

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    
    svg.selectAll()
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', d3.arc()
            .innerRadius(width / 2)
            .outerRadius((width/2)-60)
        )
        .attr('fill', function (d) { return (color(d.data.key)) })
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
        // simple focus effect
        .attr("class", "pie_part")
        .style("opacity", .8)
        .on("mouseover", function (d) {

            d3.selectAll(".pie_part")
                .transition()
                .style("opacity", .5);

            d3.select(this)
                .transition()
                .style("opacity", 1);
        })
        .on("mouseleave", function (d) {

            d3.selectAll(".pie_part")
                .transition()
                .style("opacity", .8);
        })
        //toooooooooooooool tiiiiiiiiiiiip
        .append("title").text(function (d) {
            //console.log(d);
            //console.log(d.data.value.total_tests);
            return `${d.data.value.location}\nTotal:${d.data.value.total_cases}\nDeaths:${d.data.value.new_cases}\nTests:${d.data.value.new_deaths}`;
        });

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .text(function (d)
        {
            let txt = "????";
            if (content_id == 0)
                txt = "Total Cases";
            if (content_id == 1)
                txt = "New Cases";
            else if (content_id == 2)
                txt = "New Deaths";
            return txt;
        })
        .attr("text-anchor", "middle")
        .style("font-size", 16)
        .style("fill", "black");
}

// function for drawing different bar charts.......
function draw_bar(div_id, _data, content_id){
    
    // get correct data value
    let get_val = d => content_id == 0 ? d.total_cases : d.total_deaths;
    // sort the array in correct order
    const display_only = 10;
    const data = _data.sort(function (a, b) { return get_val(b) - get_val(a); }).slice(0, display_only);;
    // set the dimensions and margins of the graph
    var margin = {top: 30, right: 30, bottom: 70, left: 60},
    width = 800 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select(div_id)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    /* DRAW SVG................ OUR BAR CHART */
    
    var x = d3.scaleBand()
        .range([ 0, width ])
        .domain(data.map(function(d) { return d.location; }))
        .padding(0.2);
    
    
    
    const data_biggest = data[0];
    const max_val = get_val(data_biggest);
    
    //console.log(data);
    //console.log(data_biggest);
    
    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, max_val])
        .range([ height, 0]);
    
    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

    
    svg.append("g")
    .call(d3.axisLeft(y));

    // Bars
    svg.selectAll("mybar")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function(d) { return x(d.location); })
    .attr("y", function(d) { return y(get_val(d)); })
    .attr("width", x.bandwidth())
    .attr("height", function(d) { return height - y(get_val(d)); })
    .attr("fill", "darkred")
}



/*
 * Function for displaying world map in addition to that ready country specific data display......
 */


// function for drawing whole world map and call country method on country selection..........
function do_map()
{
    // The svg
    var svg = d3.select("#map"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    // Map and projection
    var projection = d3.geoMercator()
        .scale(120)
        .center([0, 20])
        .translate([width / 2, height / 2]);

    var path = d3.geoPath().projection(projection)

    // Data and color scale
    
    var colorScale = d3.scaleThreshold()
        .domain([1000 * 1, 1000 * 5, 1000 * 10, 1000 * 15, 1000 * 20, 1000 * 25])
        .range(d3.schemeReds[9]);


    /* OLD METHOD
    // setup map data i.e. align info with country code. which will help us get the info quickly later on.
    var map_data = new Map();
    for (let i = 0; i < _covid.length; i++) {
        let prev = map_data.get(_covid[i].iso_code);

        if (prev != undefined) {
            let dt_prev = new Date(prev.date);
            let dt = new Date(_covid[i].date);

            if (dt_prev.getTime() < dt.getTime()) {
                map_data.set(_covid[i].iso_code, _covid[i]);
            }
        }
        else {
            map_data.set(_covid[i].iso_code, _covid[i]);
        }

        //console.log(_covid[i]);
    }
    */

    /*
     ==============================================================================
     DRAWING ALLL OUR SVG ETC.....
     ==============================================================================
    */



    // Draw our map
    svg.append("g")
        .selectAll("path")
        .data(_world.features)
        .enter()
        .append("path")
        // draw each country
        .attr("d", path)
        // set the color of each country
        .attr("fill", function (d) {
            let cdta = get_covid_country_date_last(d.id); //map_data.get(d.id);
            //console.log(map_data);
            let ded = 0;
            if (cdta != undefined) {
                ded = cdta.total_cases;
            }
            else {
                //console.log("No covid data found for:" + d.id);
            }

            return colorScale(ded);
        })
        .style("stroke", "black")
        .style("stroke-width", ".5px")
        .attr("class", function (d) { return "country" })
        .style("opacity", .8)
        .on("mouseover", function (d) {

            d3.selectAll(".country")
                .transition()
                .style("opacity", .5);

            d3.select(this)
                .transition()
                .style("opacity", 1);
            //.style("stroke", "black")
        })
        .on("mouseleave", function (d) {

            d3.selectAll(".country")
                .transition()
                .style("opacity", .8);

            //d3.select(this)
            //    .transition()
            //    .style("stroke", "transparent");
        })
        .on("click", function (d) {

            do_country(d);
        })
        // set up simple tool tip....
        .append("title").text(function (d) {

            let cdta = get_covid_country_date_last(d.id);//map_data.get(d.id);
            //console.log(map_data);
            let detail = "NO DATA FOUND";
            if (cdta != undefined) {
                detail = `${d.properties.name}\nDate:${cdta.date}\nTotal:${cdta.total_cases}\nDead:${cdta.total_deaths}`;
            }
            else {
                //console.log(d);
                detail = `${d.properties.name}\nNO DATA FOUND TO DISPLAY`;
            }
            return detail;
        });

    /*
    // Add the labels
    svg.append("g")
        .selectAll("labels")
        .data(_world.features)
        .enter()
        .append("text")
        .attr("x", function (d) { return path.centroid(d)[0] })
        .attr("y", function (d) { return path.centroid(d)[1] })
        .text(function (d) { return d.properties.name; })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .style("font-size", 6)
        .style("fill", "black");
    */
}

// this function is called when a country is selected in world map.....
// parameter is country data. which can be used to get other information about country
function do_country(d)
{
    let c_data_all = get_covid_country_data(d.id);
    let c_data_last = get_covid_date_last(c_data_all);

    let detail = document.getElementById("detail");
    //iso_code,continent,location,date,total_cases,new_cases,total_deaths,new_deaths,
    //total_cases_per_million, new_cases_per_million, total_deaths_per_million, new_deaths_per_million, 
    //total_tests, new_tests, 
    //total_tests_per_thousand, new_tests_per_thousand, 
    //new_tests_smoothed, new_tests_smoothed_per_thousand, tests_units, stringency_index, 
    //population, population_density, 
    //median_age, aged_65_older, aged_70_older, 
    //gdp_per_capita, extreme_poverty, cvd_death_rate, diabetes_prevalence, female_smokers, male_smokers, handwashing_facilities, 
    //hospital_beds_per_thousand, life_expectancy


    /*
     * DISPLAY______________DETAILS===========================================
     */
    detail.innerHTML  =`<h3> Details about ${d.properties.name} </h3>`;
    if (c_data_last == null) {
        detail.innerHTML +=`<p> Location: ${d.properties.name} </p>`;
        detail.innerHTML +=`<p> No covid19 data was found to display. </p>`;
        // clean up old data if or if it not exist........
        /* OLD Method....
        for(let e in document.getElementsByName("row_c_details"))
        {
            if(e != detail)
            {
                e.innerHTML = "";
                console.log("clearing...");;
            }
        }
        */
       d3.select("#line_cases").html("");
       d3.select("#line_deaths").html("");
        return;
    }

    detail.innerHTML += `<p> Location:              ${c_data_last.location}             </p>`;
    detail.innerHTML += `<p> Continent:             ${c_data_last.continent}            </p>`;
    detail.innerHTML += `<p> Code:                  ${c_data_last.iso_code}             </p>`;
    detail.innerHTML += `<p> LastUpdated:           ${c_data_last.date}                 </p>`;
    detail.innerHTML += `<p> TotalCases:            ${c_data_last.total_cases}          </p>`;
    detail.innerHTML += `<p> NewCases:              ${c_data_last.new_cases}            </p>`;
    detail.innerHTML += `<p> TotalDeaths:           ${c_data_last.total_deaths}         </p>`;
    detail.innerHTML += `<p> NewDeaths:             ${c_data_last.new_deaths}           </p>`;
    detail.innerHTML += `<p> TotalTests:            ${c_data_last.total_tests}          </p>`;
    detail.innerHTML += `<p> NewTests:              ${c_data_last.new_tests}            </p>`;
    detail.innerHTML += `<p> Population:            ${c_data_last.population}           </p>`;
    detail.innerHTML += `<p> PopulationDensity:     ${c_data_last.population_density}   </p>`;
    
    //draw line chart to display time line
    draw_line_chart("#line_cases", c_data_all, 0);
    draw_line_chart("#line_deaths", c_data_all, 1);
}

//function for drawing line charts for country specific data.......
function draw_line_chart(div_id, data, content_id) {
    //var svg = d3.select("#line");
    //let width = +svg.attr("width");//aline
    //let height = +svg.attr("height");

    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;
    
    // append the svg object to the body of the page
    var svg = d3.select(div_id).html("")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    
    var track_line = svg
        .append('g')
            .append('line')
                .style("fill", "none")
                .attr("stroke", "black")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", 0)
                .attr("y2", height + margin.top + margin.bottom)
                .attr("width", 5)
                .style("opacity", 0);
    
    //data
    const detail_text = content_id == 0 ? "Total Cases" : "Total Deaths";
    let get_date = d => new Date(d.date).getTime();
    let get_val = d => content_id == 0 ? d.total_cases : d.total_deaths;
    
    // Add X axis --> it is a date format
    var x = d3.scaleTime()
        .domain(d3.extent(data, function (d) {  return get_date(d); }))
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
        
        
     //console.log("max is: " + d3.max(data, function (d) {  return get_val(d); }));
     //console.log("actual max is: " + data[data.length-1].total_deaths);
     //console.log(data);
    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, get_val(data[data.length-1])])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));


    //var res = sumstat.map(function (d) {  return d.iso_code; }) // list of group names
    //var color = d3.scaleOrdinal(d3.schemePaired);.domain(res);
    
    //var color = d3.scaleOrdinal(["red", "yellow", "blue", "orange", "green"]).domain([data[0][0].iso_code, data[1][0].iso_code, data[2][0].iso_code, data[3][0].iso_code, data[4][0].iso_code]);

    //console.log(data);
    var dt_txt = svg.append("text")
                        .attr("x", width / 2)
                        .attr("y", height / 2)
                        .text(detail_text)
                        .attr("text-anchor", "middle")
                        .style("font-size", 16)
                        .style("fill", "black");
    // Add the line
    svg.append("path")
        .data([data])
        .attr("fill", "none")
        .attr("stroke", function (d) { return "red"; })
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function (d) { return x(get_date(d)); })
            .y(function (d) { return y(get_val(d)); })
    );
    
    
    // SETUP TRACKER................
    
    // Create a rect on top of the svg area: this rectangle recovers mouse position
    svg
        .append('rect')
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr('width', width)
            .attr('height', height)
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);
    
    // What happens when the mouse move -> show the annotations at the right positions.
    function mouseover() {
        track_line.style("opacity", 1)
    }
    function mouseout() {
        track_line.style("opacity", 0)
        dt_txt.text(detail_text);
    }
    function mousemove() {
        // recover coordinate we need
        const coord = d3.mouse(this);
        const seldate = x.invert(coord[0]);
        
        // find the closest x index
        const bisect = d3.bisector(function(d) { return get_date(d); }).left;
        const i = bisect(data, seldate, 1);
        
        const cdata = data[i];
        
        const _val = get_val(cdata);
        
        const pos = coord[0];
        
        track_line.attr("x1", pos).attr("x2", pos);
        
        // display info
        dt_txt.text(`Date: ${cdata.date}, ${detail_text}: ${_val}`);
    }
}