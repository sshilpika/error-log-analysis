function addSEDCplot(resultSedc, se, ee){
       
        addLine(resultSedc, se, ee);
        d3.select("#text-node-main-sedc").style("visibility", "visible");

}


function addLine(resultSedc, se, ee){

        d3.select("#table-rc33-up svg").remove();
        var colorSedc = ['#e92f71', '#ffd700', '#5201cf', '#2fe94a', '#3399ff'];

        var svg = d3.select("#table-rc33-up")
            .append("svg")
            .attr("width", sedcWidth)
            .attr("height", sedcHeight)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        svg.append("g")
            .attr("class", "xaxis--sedc")
            .attr("transform", "translate(0," + height_line + ")")
            .call(d3.axisBottom(x));


        svg.append("defs").append("clipPath")
            .attr("id", "clipSedc")
            .append("rect")
            .attr("width", width)
            .attr("height", sedcHeight)
            .attr("transform", "translate(0,0)");

           var clipped = svg.append("g")
            .attr('clip-path', 'url(#clipSedc)');


        svg.append("g")
            .attr("class", "y axis sedc")
            .call(d3.axisLeft(yScaleSedc));

        var path_list = clipped.append("g")
            .attr("class", "sedc-container");

        var legend = svg.append("g")
            .attr("class","legend")
            .attr("id","sedc-legend")
            .attr("transform","translate("+(width)+","+margin.top+")");

    d3.select("#job-sedc-list select").remove();

        var sedcSelect = d3.select("#job-sedc-list")
            .append("select")
            .attr("id","sedc-multiselect")
            .style("width", (bc_width+10)+"px")
            .style("height", "220px")
            .attr("multiple", '');

        resultSedc.forEach(function(data1){

                var data = data1.cluster_mean.map(function(d, i) {
                        return {
                                "date" : parseDate(data1.cluster_group_time[i]),
                                "mean": +d,
                                "name": data1.cluster_name.toString()
                        }
                });

                sedcSelect
                    .selectAll(".option"+data1.cluster_name)
                    .data(data1.measurements)
                    .enter()
                    .append("option")
                    .attr("class", "option"+data1.cluster_name)
                    .style("border-width", "2px")
                    .attr("value", function(d){
                            return d;
                    })
                    .text(function(d){
                            return d;
                    })
                    .style("color", function(d){ return colorSedc[data1.cluster_name]});

                path_list.append("path")
                    .datum(data)
                    .attr("class", "sedc-line")
                    .attr("selected", "")
                    .attr("id", "cluster-path-"+data1.cluster_name.toString())
                    .attr("d", sedcLine)
                    .attr("data-legend",function(d) { return data1.cluster_name.toString()})
                    .style("fill", "none")
                    .style("stroke", function(d){ return colorSedc[data1.cluster_name]})
                    .style("stroke-width", "2")
                    .style("opacity", "0.8")
                    .on('click', function(d){

                            var selectedSEDCID = d3.select(this).attr("id").split("cluster-path-")[1];

                            var updatedMultiSelectData = resultSedc.filter(x => x.cluster_name.toString() === selectedSEDCID)[0]

                            d3.select("#job-sedc-list select").remove();
                            d3.select("#job-sedc-list")
                                .append("select")
                                .attr("id","sedc-multiselect")
                                .style("width", (bc_width+10)+"px")
                                .style("height", "200px")
                                .attr("multiple", '')
                                .selectAll(".option"+selectedSEDCID)
                                .data(updatedMultiSelectData.measurements)
                                .enter()
                                .append("option")
                                .attr("class", "option"+selectedSEDCID)
                                .attr("value", function(d){
                                        return d;
                                })
                                .text(function(d){
                                        return d;
                                })
                                .style("color", function(d){ return colorSedc[selectedSEDCID]});


                    });

                legend.append('circle')
                    .attr("class", 'circle-'+data1.cluster_name.toString())
                    .attr("r", 5)
                    .attr("cx", 10)
                    .attr("cy", (data1.cluster_name * 14))
                    .attr("width", 11)
                    .attr("height", 11)
                    .style("fill", function (d, i) {
                            return colorSedc[data1.cluster_name]
                    })
                    .on("click", function(d){
                            var selectedID = d3.select(this).attr("class").split("circle-")[1];

                            var all_op_selected = true;
                            d3.selectAll(".sedc-line").each(function(_){
                                    all_op_selected = all_op_selected & d3.select(this).style("opacity")==="0.8"
                            });
                            var opFlag = 0;
                            d3.selectAll(".sedc-line").each(function(_){

                                    var lineID = d3.select(this).attr("id").split("cluster-path-")[1];
                                    var curr_opacity = d3.select(this).style("opacity");

                                    if(lineID === selectedID) {
                                            
                                            opFlag = (curr_opacity==="0.8")? (all_op_selected)?1:d3.select(this).style("opacity", "0.1") :d3.select(this).style("opacity", "0.8")

                                    }else if(opFlag === 1){
                                         d3.select(this).style("opacity", "0.1");   

                                    }

                            });
                    });

                legend.append('text')
                    .attr("x", 20)
                    .attr("y", (data1.cluster_name * 14 + 4))
                    .text("C_"+data1.cluster_name.toString())
                    .attr("class", "textselected")
                    .style("text-anchor", "start")
                    .style("font-size", 12)

        });


    d3.select("#text-sedc-names-button svg g").style("visibility", "visible")

    d3.select("#select-sedc")
            .on("click", function(d){

                d3.selectAll(".sedc-line-all").remove()

                d3.select("#sedc-enter-use")
                    .attr("fill", "#FAD06C")
                    .attr("stroke", "red")

                var selected_sedc = d3.select("#job-sedc-list select")
                    .selectAll("option")
                    .filter(function () {
                        return this.selected;
                    })['_groups']['0']
                    .map(x => {
                        return { "cluster":+(x['className'].split("option")[1]),
                                 "value": x['value']
                             }
                         });

                var clusterReadings = [];

                selected_sedc.forEach(function(sedcD){

                    resultSedc.forEach(function(resSedc){
                        if(resSedc.cluster_name === sedcD.cluster){
                            var cGroup = resSedc.cluster_group[resSedc.measurements.indexOf(sedcD.value)],
                                cTime = resSedc.cluster_group_time;
                            
                            var sedcSelected = d3.transpose([cGroup, cTime]).map(x => {return {
                                "date": parseDate(x[1]),
                                "mean": x[0]
                            }})

                            clusterReadings.push({
                                "name": sedcD.value,
                                "data": sedcSelected
                            });
                        }
                    });

                });

                clusterReadings.forEach(function(datapath){

                    path_list.append("path")
                    .datum(datapath.data)
                    .attr("class", "sedc-line-all")
                    .attr("id", datapath.name)
                    .attr("d", sedcLine)
                    .style("fill", "none")
                    .style("stroke", "black")
                    .style("stroke-width", "1")
                    .style("opacity", "0.5")
                    .on("mouseover", function(_){
                    })

                });


                d3.select("#sedc-enter-use")
                    .attr("fill", "black")
                    .attr("stroke", "black")

                
               

            });

    d3.select("#change-rnn")
            .on("click", function(_){

                d3.select("#rnn-enter-use")
                    .attr("fill", "#FAD06C")
                    .attr("stroke", "red")

                var value = d3.select("#rnn-selected-status div div")['_groups'][0][0].innerHTML.replace("-&gt;", "->");

                var rnn_options = d3.selectAll(".option-rnn")

                
                var rnn_list = [];
                rnn_options.each(rw => {
                    rw_value = rw.replace("-&gt;", "->");
                                        
                    if(rw_value.split(" -")[0].toLowerCase() === value.split(" -")[0].toLowerCase()){
                        d3.select(this).property('value', value);
                        rnn_list.push(value.toLowerCase())
                    }
                    else 
                        rnn_list.push(rw_value)
                })


                appendRnnData(5, rnn_list, true);

                var job_exit_status_value = d3.select("#job-selected-status div div")['_groups'][0][0].innerHTML.split("=")[1]
                
                Sijax.request("includeJobFeedback", [job_exit_status_value]);

                d3.select("#rnn-enter-use")
                    .attr("fill", "black")
                    .attr("stroke", "black")
            });


}