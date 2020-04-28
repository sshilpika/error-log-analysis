

function zoomTimeLine(n_topics, display_percent=100){
    var par = {};
    par["num_topics"] = n_topics;

    d3.select("#table-rc33 svg").remove();

    var xAxis = d3.axisBottom(x),
        xAxis2 = d3.axisBottom(x2),
        yAxis = d3.axisLeft(y);


    var svg = d3.select("#table-rc33")
        .append("svg") 
        .attr("width", svg_width + 50)
        .attr("height", svg_height +80);

    var brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on("brush end", brushed_ts);

    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);


    svg.append("defs").append("clipPath")
        .attr("id", "clipT")
        .append("rect")
        .attr("width", width+margin.right)
        .attr("height", height)

    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + (margin.left+width-100) + "," + (margin2.top+padding.bottom+40) + ")");

    var slider_container = slider.append("g")
        .attr("class", "slider-container")
        .attr("transform", "translate(0,0)");

    var sliderText = slider
        .append("text")
        .attr("id","value-range")
        .style("font-size", "12px")
        .attr("transform", "translate(" +(padding.left) + ",-5) ");


    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + (margin2.top-padding.bottom) + ")");

    var clipped = focus.append("g")
        .attr('clip-path', 'url(#clipT)');

    var g = clipped
        .append("g")
        .attr("class", "word-container")
        .attr("id", "word-container");

    var lines = d3.line()
        .x(function(d, i) { return x(d["datetime"]); });


    var parList = [];
    var new_d1 = [];
    var slider_data = [];

    // ./static/data_tot/topic_doc_first_test.csv contains the topic clouds infprmation generated in the file tot_gen_files.py
    d3.csv("./static/data_tot/topic_doc_first_test.csv"+"?"+Math.floor(Math.random()*1000), type).then(function(data) {

        if(display_percent!=100)
            data = data.filter((d, i) => {
                
                return Math.trunc(i%(100/display_percent))===0
            })

        var duration = d3.extent(data, function(d) { return d.datetime; });
        var duration1 =[duration[0].setMinutes(duration[0].getMinutes()-10),
            duration[1].setMinutes(duration[1].getMinutes()+30)];
                
        x.domain([new Date(duration1[0]), new Date(duration1[1])]);
        y.domain([-0.5, n_topics-0.5]);

        x2.domain(x.domain());
        y2.domain(y.domain());

        Sijax.request('getSEDC');

        focus.append("g")
            .attr("class", "axis axis--xwc")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        var tickVals = d3.range(n_topics);

        var yticks = y.ticks().map(function (v) {
            return tickVals.includes(v) ? v : 0
        });

        focus.append("g")
            .attr("class", "axis axis--ywc")
            .call(yAxis.tickValues(y.ticks())
                .tickFormat((d, i) => { return (d>=0 && d< 5 && d%1 === 0)? "Topic-"+d:""; }));
           
        context.append("g")
            .attr("class", "axis axis--xwc")
            .attr("transform", "translate(0," + height2 + ")")
            .call(xAxis2);

        context.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, x.range());

        svg.append("rect")
            .attr("class", "zoom")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoom);


        sliderRange
            .min(0)
            .max(1)
            .width(100)
            .tickFormat(d3.format('.2'))
            .ticks(5)
            .default([0.7, 1.0])
            .fill('#777')
            .on('onchange', val => {
                sliderText.text("Score Range "+val.map(d3.format('.2')).join('-'))
                    .style("fill", "#000");

            })
            .on("end", val => {
                sliderChanges(val, new_d1);
            });

        slider_container.call(sliderRange);

        sliderText.text(
            "Score Range "+sliderRange
                .value()
                .map(d3.format('.2'))
                .join('-')
        );
        d3.selectAll(".slider-container .axis .tick text")
        .each(function(d){
            d3.select(this).attr("dy", "0.0em")
        })

        data2 =  data;
        slider_data = data2;
        var stacked_params ={};
        stacked_params['svg'] = svg;
        stacked_params['height'] = height;
        stacked_params['width'] =  width;
        stacked_params['margin'] = margin;
        stacked_params['padding'] = padding;

        Promise.all([
            appendCircles(g,data2, 120, par),
            appendTopicLines(g)]) 
            .then(function(data3){

                parList = data3[0];

                var num = parList.length/max_topic_clouds;
                var newParList = [];

                parList.forEach(function(wcFilename,i){

                    newParList.push( {
                        "wcFile":  d3.csv("./static/"+wcFilename['link']+"?"+Math.floor(Math.random()*1000)),
                        "par": wcFilename
                    })

                });


                return Promise.all(newParList);

            }).then(function(wcFiles){
            return Promise.all(wcFiles.map(function(value){
                return appendWC(value)
            }))
        }).then(function(_){
            var doc = parseInt(data[data.length-1]['doc'])+1,
                d1 = new Date(duration1[1])
                datetime = new Date(d1.setMinutes(d1.getMinutes()-30));


            Sijax.request("get_rnn_clouds", [doc, datetime.toString(), n_topics])
        
        }).catch(function(error){
            throw error;
        })




    }).catch(function(error){
        throw error;
    });


    function appendTopicLines(g){

        g.selectAll(".topic-lines")
            .data(d3.range(-0.5,n_topics,1))
            .enter().append("line")
            .attr("class", "topic-lines")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", function(d){
              
                return y(d);})
            .attr("y2", function(d){return y(d);})
            .style("stroke", "#000")
            .style("opacity", 0.4)
            .style("fill", "none");


        g.selectAll(".topic-contour")
            .data(d3.range((0.5), (n_topics+0.5)))
            .enter().append("rect")
            .attr("class", "topic-contour")
            .attr("width", width)
            .attr("height", height/(n_topics))
            .attr("x", 0)
            .attr("y", d => y(d))
            .style("fill", d => {
                return colorWc(d);
            })
            .style("opacity", 0.3)

    }


    function sliderChanges(sliderVal){

        globSliderVal = sliderVal;

        d3.selectAll(".wordcloud.t120 text").each((x, i, n) =>{

            if((x.score >= sliderVal[0]) ? ( (x.score <= sliderVal[1]) ? 0:1) : 1)
                d3.select(n[i]).style("opacity", 0);
            else
                d3.select(n[i]).style("opacity", 1);
        });
    }






    function brushed_ts() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || x2.range();

        x.domain(s.map(x2.invert, x2));
      

        d3.select("#word-container").selectAll(".wordcloud")
            .attr("transform", function(d){
                var str = d3.select(this).attr("transform");
                var translate = str.substring(str.indexOf("(")+1, str.indexOf(")")).split(",");
                return "translate(" + x(d.datetime) + "," +  translate[1]  + ")";
            });

        d3.select(".line-contour").attr("d", lines.x(function(d) { return x(d.datetime); }));

        d3.selectAll(".sedc-line").attr("d", sedcLine.x(function(d){ return x(d.date); }))

        d3.selectAll(".job-stops-line")
            .attr("x1", function(d){return  x(parseDate(d3.select(this).attr("id")))})
            .attr("x2", function(d){return  x(parseDate(d3.select(this).attr("id")))});


        focus.select(".axis--xwc").call(xAxis);
        focus.select(".axis--ywc").call(yAxis);

        d3.select(".xaxis--sedc").call(d3.axisBottom(x));

        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));
    }

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        x.domain(t.rescaleX(x2).domain());
        

        d3.select("#word-container").selectAll(".wordcloud")
            .attr("transform", function(d){
                var str = d3.select(this).attr("transform");
                var translate = str.substring(str.indexOf("(")+1, str.indexOf(")")).split(",");
                return "translate(" + x(d.datetime) + "," + translate[1] + ")";});
        d3.select(".line-contour").attr("d", lines.x(function(d) { return x(d.datetime); }));


        d3.selectAll(".sedc-line").attr("d", sedcLine.x(function(d){ return x(d.date); }))

        d3.selectAll(".job-stops-line")
            .attr("x1", function(d){return  x(parseDate(d3.select(this).attr("id")))})
            .attr("x2", function(d){return  x(parseDate(d3.select(this).attr("id")))});

        focus.select(".axis--xwc").call(xAxis);

        d3.select(".xaxis--sedc").call(d3.axisBottom(x));
        
        context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
    }

    d3.select("#node-enter-use")
        .attr("fill", "black")
        .attr("stroke", "black")

    function type(d) {
        d.datetime = parseDate(d.datetime);
        return d;
    }
};




