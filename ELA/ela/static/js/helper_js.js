function addArrowIcon(mainID, compID, defID, circleID){

    var bc = d3.select("#"+mainID).node().getBoundingClientRect(),
        bc_width = bc.width-10
    bc_height = bc.height-10;

    var svgLeft = d3.select("#"+compID)
        .append("svg")
        .attr("width", bc_width)
        .attr("height", 24)
        .attr("stroke", "currentColor")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", "2")
        .attr("viewBox", "0 0 24 24");

    var arrEnter = svgLeft
        .append("defs")
        .append("g")
        .attr("id", defID);

    arrEnter.append("line")
        .attr("x1", "5")
        .attr("x2", "19")
        .attr("y1", "12")
        .attr("y2", "12");

    arrEnter.append("polyline")
        .attr("points", "12 5 19 12 12 19");

    arrEnter.append("circle")
        .attr("id",circleID)
        .attr("cx", "12")
        .attr("cy", "12")
        .attr("r", "10")
        .style("fill", "none")
        .style("pointer-events","visible")


}


function addMultiArrowIcon(compID, defID){

    
    var svgLeft = d3.select("#"+compID)
        .append("g")

    var arrEnter = svgLeft
        .append("defs")
        .append("g")
        .attr("id", defID);

    arrEnter.append("polygon")
        .attr("fill", "#231F20")
        .attr("points", "2.049,0.58 -0.035,2.664 10.801,13.5 -0.035,24.336 2.049,26.42 14.969,13.5  ");

    arrEnter.append("polygon")
        .attr("fill", "#231F20")
        .attr("points", "13.049,0.58 10.965,2.664 21.801,13.5 10.965,24.336 13.049,26.42 25.969,13.5  ");


}

function appendMUltiSelect(divID, selectID, bc_width, nodelist){

    d3.select("#"+divID).append("select")
        .attr("id",selectID)
        .style("width", (bc_width+10)+"px")
        .style("height", "220px")
        .attr("multiple", '')
        .selectAll("option")
        .data(nodelist)
        .enter()
        .append("option")
        .attr("value", function(d){
            return d;
        })
        .text(function(d){
            return d;
        });
}

function appendJobLines(g, data){

    g.selectAll(".job-stops-line")
        .data(data)
        .enter().append("line")
        .attr("class", "job-stops-line")
        .attr("id", function(d){ return d;})
        .attr("x1",function(d){ return x(parseDate(d))})
        .attr("y1",function(_){ return 0})
        .attr("x2",function(d){ return x(parseDate(d))})
        .attr("y2",function(_){ return height})
        .style("stroke", "red")
        .style("fill", "none");

};

function appendRnnData(n_topics, rnn_words, isUpdate){

    d3.select("#rnn-pred-div").style("visibility", "visible");

    d3.select("#rnn-multiselect").remove();

    var rnnSelect = d3.select("#rnn-pred-list")
            .append("select")
            .attr("id","rnn-multiselect")
            .style("width", (bc_width+10)+"px")
            .style("height", "220px")
            .attr("multiple", '');

    var rnn_selectOption = d3.select("#rnn-multiselect")
        .selectAll(".option-rnn")
        .data(rnn_words)
        .enter()
        .append("option")
        .attr("class", "option-rnn")
        .style("border-width", "2px")
        .attr("value", function(d){
                return d.toUpperCase();
        })
        .text(function(d){
                return d.toUpperCase();
        });

        rnn_selectOption.on("click", function(d){

            var selected_rnn = d;
            var rnn_list = selected_rnn.split(" -> [")[1].split("]")[0];
            var rnn_formatted = rnn_list.replace(/, /gi, " -> ");

            rnn_formatted = rnn_formatted.replace(/'/gi,"");

            d3.select("#rnn-selected-status").remove();

            d3.select("#j-text-status")
            .append("foreignObject")
            .attr("id", "rnn-selected-status")
            .attr("y", 20)
            .attr("x", -12)
            .attr("width", "80%")
            .attr("height", "30px")
            .append('xhtml:div')
            .append('div')
            .attr("contentEditable", true)
            .text(selected_rnn.toUpperCase())
            .style("font-size", "13px")
            .style("font-family", "Georgia Serif")
            .style("font-weight", "bold")
            .style("font-style", "oblique");
        });


        Sijax.request("get_job_exit_status");
    
    if(!isUpdate){

        Sijax.request("getJobSE");
    }
    

};

function add_rnn_clouds(n_topics, rnn_words){

    

    var svg = d3.select("#table-rc33 svg");
    rnn_words = rnn_words.slice(-10).map(x => {return x.split('error')[0]+"error"})
    

    var txtArrLength = rnn_words.map(x => { return x.length})
    var maxTextLength = Math.max(...txtArrLength)
    var rectWidth = 1208 - (margin.left+width+margin_slider.left+5*margin.right);
    var rnnHeight = 495;

    var mlContainer = svg.append("g")
        .attr("id","ml-text-rnn" )
        .attr("class", "ml-container")
        .attr("transform", "translate(" + (margin.left) + "," + rnnHeight + ")");


    addMultiArrowIcon("ml-text-rnn","arr-rnn")


    var textPadding = 10;
    mlContainer.append("text")
        .attr("id", "ml-text-header")
        .attr("x", 0)
        .attr("y", textPadding)
        .text(rnn_words.length.toString()+" Predicted Errors:")
        .attr("font-size", "15px")
        .attr("font-family", "Andale Mono")
        .attr("transform", "translate(0,0)");

    var rect_group = mlContainer.selectAll(".ml-rect")
        .data(rnn_words);


    var fontSize = 12;

    rnn_words.slice(0,-1).forEach(function(x, i){

        mlContainer.append("g")
        .attr("transform","translate("+(-30+(i+1)*(x.length)*(fontSize))+",40) scale(0.5)")
        .append("use")
        .attr("xlink:href","#arr-rnn")

    });

    

    

    var text_group = mlContainer.selectAll(".ml-text")
        .data(rnn_words);

    text_group.enter()
        .append("text")
        .attr("class", 'ml-text')
        .attr("y", 0)
        .attr("x", function(d,i){
            return (i)*(maxTextLength*fontSize);
        })
        .text(function(d){
            return d.toUpperCase()
        })
        .attr("font-size", fontSize+"px")
        .attr("font-family", "Andale Mono")
        .attr("font-style", "italic")
        .attr("font-weight", "bold")
        .attr("transform", "translate(0,50)");
    

    Sijax.request("get_job_exit_status");
    Sijax.request("getJobSE");


};

function appendJobStatus(jStatus1, jStatus2, jname){

    d3.select("#job-selected-status").remove();

    var jtext = "";
    if(jStatus1 == "0"){
        jtext = "Job will likely pass else it will fail with exit code ="+jStatus2.toString();
    }
    else{
        jtext = "Job will likely fail with exit code ="+jStatus2.toString();
    }

    var jstat_margin_bottom = +svg.attr("height") + 30;
    var jContainer = d3.select("#table-rc33 svg").append("g")
        .attr("id","j-text-status" )
        .attr("class", "j-container")
        .attr("transform", "translate(" + (margin.left) + "," + jstat_margin_bottom + ")");


    d3.select("#j-text-status")
        .append("foreignObject")
        .attr("id", "job-selected-status")
        .attr("y", 0)
        .attr("x", -12)
        .attr("width", "80%")
        .attr("height", "30px")
        .append('xhtml:div')
        .append('div')
        .attr("contentEditable", true)
        .text(jtext)
        .style("font-size", "13px")
        .style("font-family", "Georgia Serif")
        .style("font-weight", "bold")
        .style("font-style", "oblique");

}

function appendJobSELines(se, ee){

    var w_container = d3.select("#word-container");
    appendJobLines(w_container, [se, ee]);


}

function appendWordClouds(par, data, color, pri=false, cloudid=null){
    var gId = par["g"],
        width = par["width"],
        height = par["height"],
        y_dom = par["y_domain"];


    function drawWords(words1, wordcloud, cloudid) {

        wordcloud.selectAll(".word.t" + words1[0].topic)
            .data(words1)
            .enter().append("text")
            .attr('class', 'word t' + words1[0].topic)
            .style("fill", color)//function (d) {return colorWc(d.topic);})
            .style("font-size", function (d) {
                var score = (d.score < 0.1? 0: d.score < 0.5 ? 9 * 0.5 : d.score < 0.7 ?10 * d.score: 14 * d.score);
                return score.toString() + "px";
            })
            .style("font-family", function (d) {return d.font;})
            .attr("text-anchor", "middle")
            .attr("transform", function (d, i) {
                return "translate(" + [d.x, d.y] +  ")rotate(" + d.rotate + ")";
            })
            .text(function (d) {
                return d.twords;
            });

        return words1;

    };

    var sliderVals = sliderRange.value();

    d3.range(par["num_topics"]).forEach(function (t) {
        
        var cloudid = "#wordCloud"+gId+"t"+par['top']+"-"+t.toString(); 
        var wordsPerTopic = data.filter(x => {
            return (x.topic.toString() === t.toString())
        });

        var wordcloud = d3.select(cloudid)

        function drawOne(words) {
            wordcloud.selectAll("text")
                .data(words)
                .enter().append("text")
                .attr('class','word')
                .style("font-size", function(d) { 
                    
                    return d.size + "px"; 
                })
                .attr("text-anchor", "middle")
                .attr("transform", function(d) { 
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
                .text(function(d) { return d.twords; });
            };


        const wordScale = d3.scaleLinear()
              .domain([0,11])
              .range([1,15])

        d3.layout.cloud()
            .size([300,100])
            .timeInterval(20)
            .words(wordsPerTopic)
            .rotate(0)
            .fontSize(d=>{
                var score = (d.score <= 0.0? 0.0: d.score < 0.5 ? 5 * d.score : d.score < 0.7 ?7 * d.score: 9 * d.score);
                return wordScale(score);
            })
            .fontWeight(["bold"])
            .text(function(d) { return d.twords; })
            .spiral("archimedean")
            .on("end", drawOne)
            .start();


    });


}

function appendCircles(g,data, top, par){

    par['width'] = width/4;
    par['height'] = height/par["num_topics"];
    par["top"] = top;



    var parList = [];
    var  wc_g = g.selectAll(".wordcloud.t"+top.toString())

    d3.range(par["num_topics"]).forEach(n => {

        wc_g
        .data(data)
        .enter().append("g")
        .attr("class", "wordcloud t"+top.toString())
        .attr("id", function(d,i){
            return "wordCloud"+d.index+"t"+top.toString()+"-"+n
        })
        .attr("transform", function(d){
            return "translate(" + x(d.datetime) + "," + y(n) + ")"; //y(+d.topic-0.3)
        })
        .each(function(d,i){
            var par_tmp = {};
            par_tmp["top"] = top,
                par_tmp["num_topics"] = par["num_topics"],
                par_tmp["g"] = d.index,
                par_tmp["g_id"] = "wordCloud"+d.index+"t"+top.toString()+"-"+n.toString(),
                par_tmp["y_domain"] = y,
                par_tmp["link"] = d.link,
                par_tmp["score"] = d.topic,
                par_tmp['width'] = 10,
                par_tmp['height'] = par['height'],
                par_tmp['datetime'] = d.datetime,
                par_tmp['x_axis'] = x;
            parList.push(par_tmp)
        });


    });

    


    return parList;


}

function appendWC(values, color="#000"){
    var data4File = values['wcFile'],
        par = values['par'];

    data4File.then(function(data4){
        appendWordClouds(par, data4, color)


    });



}