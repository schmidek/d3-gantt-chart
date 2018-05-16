import * as d3 from 'd3';
import tip from 'd3-tip';

let createGanttChart = function (selector) {

    var margin = {
        top: 0,
        right: 10,
        bottom: 20,
        left: 150
    };
    var xAxisSelector = '.wf-gantt-chart-x-axis';
    var chartSelector = '.wf-gantt-chart';
    var timeDomainStart;
    var timeDomainEnd;
    var taskTypes = [];
    var taskStatus = [];
    var width = document.body.clientWidth - margin.right - margin.left - 5;
    var tickFormat = "%H:%M";
    var ticks = 4;
    var minBarHeight = 24;
    var maxBarHeight = 36;
    var onClickBar = null;

    function gantt(tasks) {

        var taskTypes = tasks.map(t => t.taskName);

        var getBarHeight = function() {
            var count = taskTypes.length;
            if (count < 20) {
              return maxBarHeight;
            }
            return minBarHeight;
          }
      
          var getHeight = function () {
            var count = taskTypes.length;
            return count * getBarHeight();
          }
      
          var initTimeDomain = function (tasks) {
              if (tasks === undefined || tasks.length < 1) {
                  timeDomainStart = d3.timeDay.offset(new Date(), -3);
                  timeDomainEnd = d3.timeHour.offset(new Date(), +3);
                  return;
              }
              tasks.sort(function (a, b) { return b.endDate - a.endDate; });
              timeDomainEnd = tasks[0].endDate;
      
              tasks.sort(function (a, b) { return a.startDate - b.startDate; });
              timeDomainStart = tasks[0].startDate;
          };

        var format = d3.timeFormat("%H:%M:%S %d.%m");

        initTimeDomain(tasks);

        var x = d3.scaleTime()
            .domain([timeDomainStart, timeDomainEnd])
            .range([0, width - margin.left - margin.right]);
        var y = d3.scaleBand()
            .domain(taskTypes)
            .range([0, getHeight()])
            .paddingInner(0.2)
            .paddingOuter(0.1);

        var xAxis = d3.axisBottom(x)
                .tickFormat(d3.timeFormat(tickFormat))
                //.tickSubdivide(true)
                .tickSize(-getHeight())
                .ticks(ticks);

        var xAxis_2 = d3.axisTop(x)
                .tickFormat(d3.timeFormat(tickFormat))
                //.tickSubdivide(true)
                .tickSize(-getHeight())
                .ticks(ticks);


        var yAxis = d3.axisLeft(y)
                .tickSize(width)
                .tickPadding(12);

        var keyFunction = function (d) { return d.taskName; };
        var rectTransform = function (d) {
            return "translate(" + x(d.startDate) + "," + (y(d.taskName)) + ")";
        };
        var lookup = function(name){ 
            for(let task of tasks){
                if(task.taskName === name)
                    return task;
            }
        };

        var chart = d3.select(selector)
            //.select(chartSelector)
            .append("svg")
            .attr("class", "chart")
            .attr("width", width)
            .attr("height", getHeight()+margin.bottom);

        var svg = chart.append("g")
            .attr("class", "wf-gantt-chart")
            .attr("width", width)
            .attr("height", getHeight()+margin.bottom)
            .attr("transform", `translate( ${margin.left}, 0)`);

        var yAxisBackground = function(g){
            g.call(yAxis);
            g.select(".domain").remove();
            g.selectAll(".tick text").remove();
            g.selectAll(".tick line").remove();
            g.selectAll(".tick").append("rect")
                .attr("x", -1*margin.left)
                //.attr("y", -1*y.step()/2)
                .attr("width",  width-margin.right)
                .attr("height", y.step());
        }
        svg.append("g")
        .attr("class", "background")
        .attr("transform", `translate(0, ${-1*y.step()/2})`)
        .call(yAxisBackground);

        svg.append("g")
            .attr("class", "wf-gantt-x-axis x axis")
            .attr("transform", `translate(0, ${getHeight()})`)
            .call(xAxis);

        var xAxisSvg = d3.select(xAxisSelector)
            .append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", 20)
            .append("g");


        var xAxisDom = xAxisSvg.selectAll('.x.axis');
        if (xAxisDom.empty()) {
            xAxisDom = xAxisSvg.append("g")
                .attr("class", "wf-gantt-x-axis x axis");
        }
        xAxisDom
          .attr("transform", "translate(" + (margin.left) + "," + -15 + ")")
          .call(xAxis_2);

        var tooltip = tip()
          .attr('class', 'd3-tip')
          .direction('n')
          .offset([-10,0])
          .html(function(d) {
              var t = d.taskName;
              if(d.tooltip){
                  t += "<br/>" + d.tooltip;
              }
              return t; 
          });

        var customYAxis = function(g){
            g.call(yAxis);
            //g.select(".domain").remove();
            g.selectAll(".tick line")
              .attr("x1", -1*margin.left)
              .attr("x2", width-margin.left-margin.right)
              .attr("stroke", "#777")
              .attr("transform", `translate(0,-${y.step()/2})`);
            g.selectAll(".tick text").attr("x", -4).attr("dy", 4);
        }

        svg.append("g")
            .attr("class", "y axis")
            .call(customYAxis);
            //.selectAll("text")
            //.style("text-anchor", "start")
            //.attr("transform", `translate(-25, 0)`);


        svg.append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width - margin.left - margin.right)
            .attr("height", getHeight());

        svg.append("g")
            .attr("class", "gantt-chart-container")
            .attr("clip-path", "url(#clip)");


        //var drw = chart.append("rect")
        //    .attr("class", "pane")
        //    .attr("width", width - margin.left - margin.right)
        //    .attr("height", getHeight(taskTypes.length))
        //    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");


        var ganttChartGroup = svg.select(".gantt-chart-container");

        ganttChartGroup.call(tooltip);

        var e = ganttChartGroup.selectAll("rect")
            .data(tasks, keyFunction)
            .enter();
            e.append("path")
             .attr("d", function(d){
                 if(!d.dependencies)
                    return "";
                 var depData = lookup(d.dependencies[0]);
                 var depY = y(depData.taskName)+y.bandwidth();
                 var depX = x(depData.endDate)-((x(depData.endDate)-x(depData.startDate))/2);
                 var myX = x(d.startDate);
                 var myY = y(d.taskName)+(y.bandwidth()/2);
                 return `M ${depX} ${depY} q ${0} ${myY-depY} ${myX-depX} ${myY-depY}`;
             })
             .attr("data-tasks", function(d){
                if(!d.dependencies)
                    return "";
                return [d.taskName, d.dependencies[0]];
             })
             .attr("stroke", function(d){
                if(!d.dependencies)
                    return "black";
                var depData = lookup(d.dependencies[0]);
                return depData.isOnCriticalPath && d.isOnCriticalPath ? "#B71C1C" : "black";
             })
             .attr("stroke-width", 2)
             .attr("fill", "none");
            e.append("rect")
            .attr("class",
                function (d) {
                    var statusClass = d.percentComplete < 1  ? "pending" : "complete";
                    var clickable = onClickBar ? " clickable" : "";
                    return statusClass + clickable;
                })
            .attr("transform", rectTransform)
            .attr("rx",5)
            .attr("ry",5)
            .attr("data-task", function(d){ return d.taskName; })
            .attr("height", function (d) { return y.bandwidth(); })
            .attr("width", function (d) { return (x(d.endDate) - x(d.startDate)); })
            //.attr("clip-path", "url(#clip)");
            .on('mouseover', function(data){
                ganttChartGroup.selectAll(`rect[data-task="${data.taskName}"]`).classed("hovered",true);
                ganttChartGroup.selectAll(`path[data-tasks*="${data.taskName}"]`).classed("hovered",true);
                tooltip.show.apply(this, arguments);
            })
            .on('mouseout', function(data){
                ganttChartGroup.selectAll(`rect[data-task="${data.taskName}"]`).classed("hovered",false);
                ganttChartGroup.selectAll(`path[data-tasks*="${data.taskName}"]`).classed("hovered",false);
                tooltip.hide.apply(this, arguments);
            })
            .on("click",
                function (data) {
                    if (onClickBar) {
                        onClickBar(data);
                    }
                })
            .filter(function(d){ return d.percentComplete < 1 && d.percentComplete > 0; })
            .each(function(d){
                ganttChartGroup
                    .append("rect")
                    .attr("class", "running")
                    .attr("data-task", d.taskName)
                    .attr("transform", function(){ return rectTransform(d); })
                    .attr("pointer-events", "none")
                    .attr("rx",5)
                    .attr("ry",5)
                    .attr("height", function () { return y.bandwidth(); })
                    .attr("width", function () { return (x(d.endDate) - x(d.startDate)) * d.percentComplete; });
            });

        return gantt;
    };

    gantt.margin = function (value) {
        if (!arguments.length) return margin;
        margin = value;
        return gantt;
    };

    gantt.width = function (value) {
        if (!arguments.length) return width;
        width = +value;
        return gantt;
    };


    gantt.tickFormat = function (value) {
        if (!arguments.length) return tickFormat;
        tickFormat = value;
        return gantt;
    };


    gantt.selector = function (value) {
        if (!arguments.length)
            return selector;
        selector = value;
        return gantt;
    };

    gantt.ticks = function (value) {
        if (!arguments.length)
            return ticks;
        ticks = value;
        return gantt;
    };


    gantt.margins = function (value) {
        if (!arguments.length)
            return margin;
        margin = value;
        return gantt;
    };

    gantt.minBarHeight = function (value) {
        if (!arguments.length)
            return minBarHeight;
        minBarHeight = value;
        return gantt;
    };

    gantt.maxBarHeight = function (value) {
        if (!arguments.length)
            return maxBarHeight;
        maxBarHeight = value;
        return gantt;
    };

    gantt.onClickBar = function (value) {
        if (!arguments.length)
            return onClickBar;
        onClickBar = value;
        return gantt;
    };


    return gantt;
};

export default createGanttChart;