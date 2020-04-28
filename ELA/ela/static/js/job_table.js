function addJobTable(jobData){

    var firstClick = false;
    var bc = d3.select("#table-lc-33").node().getBoundingClientRect(),
        bc_width = bc.width-10,
        bc_height = bc.height-10;

    addArrowIcon("table-lc-33", "text-node-names-button", "arrow-enter", "select-nodes");

    
    jobMonths
        .append("select")
        .selectAll("option")
        .data(months)
        .enter()
        .append("option")
        .attr("value", function(d){
            return d;
        })
        .text(function(d){
            return d;
        }).property("selected", function(d){ return d === defaultJobName; });

    jobYears
        .append("select")
        .selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .attr("value", function(d){
            return d;
        })
        .text(function(d){
            return d;
        });

    // adding node multiselection
    function appendMultiSelectNodes(nodelist){
        //set visibility of button and node
        d3.select("#text-node-names")
            .style("visibility", "visible");

        d3.select("#job-node-list select").remove();
        d3.select("#job-node-list")
            .append("select")
            .attr("id","node-multiselect")
            .style("width", (bc_width+10)+"px")
            .style("height", "220px")
            .attr("multiple", '')
            .selectAll("option")
            .data(nodelist)
            .enter()
            .append("option")
            .style("border-width", "2px")
            .attr("value", function(d){
                return d;
            })
            .text(function(d){
                return d;
            });
    };

    // adding job table based on selection
    var jname = "",
    jmonth = "";
    var nodelist_main = [];

    function changeJobtable(jMonth){

        jmonth = jMonth;

        d3.select("#job-selection-table table").remove();

        var sortAscending = true;
        var table = d3.select('#job-selection-table')
                .append('table')
                .style("height", "850px")
                .append("transform", "translate(0,0)");
        var titles = ['JOB_NAME','EXIT_STATUS', 'NODES_USED', 'START_TIMESTAMP',  'END_TIMESTAMP',
            'QUEUE_NAME',
            'WALLTIME_SECONDS', 'RUNTIME_SECONDS',  'NODES_REQUESTED', 'MODE',
            'CAPABILITY'];

        var headers = table.append('thead').append('tr')
            .selectAll('th')
            .data(titles).enter()
            .append('th')
            .text(function (d) {
                return d;
            })
            .on('click', function (d) {

                headers.attr('class', 'header');

                if (sortAscending) {
                    rows.sort(function(a, b) { return b[d] < a[d]; });
                    sortAscending = false;
                    this.className = 'aes';
                } else {
                    rows.sort(function(a, b) { return b[d] > a[d]; });
                    sortAscending = true;
                    this.className = 'des';
                }

            });
        var ori_container = {"element": "",
        "background": ""}

        var rows = table.append('tbody').selectAll('tr')
            .data(jobData).enter()
            .append('tr')
            .on("click", function(d){

                if(!firstClick){
                    d3.select("#text-node-names-button svg").append("g")
                        .attr("transform","translate("+((bc_width/2)-5)+",0) scale(0.7)")
                        .append("use")
                        .attr("id", "node-enter-use")
                        .attr("xlink:href","#arrow-enter")
                        .attr("fill","black")
                        .attr("stroke","black")
                        .attr("stroke-width",2);

                }

                firstClick = true;

                ori_container['element'] = d3.select(this);
                ori_container['background'] = d3.select(this).style("background");

                d3.select(this).style("background", "#FF7F50")
                jname = d['JOB_NAME']
                var nodelist1 = d['COMPONENT_NAME'].slice(1, -1).split(",");
                var nodelist = nodelist1.map(d => d.split(' ').join('').slice(1,-1));
                nodelist_main = [...new Set(nodelist)];
                appendMultiSelectNodes(nodelist);

            });
        rows.selectAll('td')
            .data(function (d) {
                return titles.map(function (k) {
                    return { 'value': d[k], 'name': k};
                });
            }).enter()
            .append('td')
            .attr('data-th', function (d) {
                return d.name;
            })
            .text(function (d) {
                return d.value;
            });


    };



    changeJobtable(defaultJobName);

    d3.select("#select-nodes")
        .on("click", function(d){



            d3.select("#node-enter-use")
                .attr("fill", "#FAD06C")
                .attr("stroke", "red")


            var selected_nodes = d3.select("#job-node-list select")
                .selectAll("option")
                .filter(function () {
                    return this.selected;
                })['_groups']['0']
                .map(x => x['value']);
            
            Sijax.request('get_clouds', [jmonth, jname, selected_nodes]);


        });


    jobMonths.on('change', function(){
        var selectedJob = d3.select(this)
            .select("select")
            .property("value");

        Sijax.request("get_jobs", ["./ela/static/job_data/dfJ_"+selectedJob+".csv", selectedJob.toString()])
        Sijax.request("getJobSE")
    });




};