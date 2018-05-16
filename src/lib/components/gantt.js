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
    var width = document.body.clientWidth;
    var tickFormat = null;
    var ticks = 4;
    var minBarHeight = 24;
    var maxBarHeight = 36;
    var onClickBar = null;

    function gantt(tasks) {

        var chartWidth = width - margin.right - margin.left - 5;

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
            .range([0, chartWidth]);
        var y = d3.scaleBand()
            .domain(taskTypes)
            .range([0, getHeight()])
            .paddingInner(0.2)
            .paddingOuter(0.1);

        var xAxis = d3.axisBottom(x)
                .tickSize(-getHeight())
                .ticks(ticks);
        if(tickFormat)
          xAxis.tickFormat(d3.timeFormat(tickFormat));

        var xAxis_2 = d3.axisTop(x)
                .tickSize(-getHeight())
                .ticks(ticks);
        if(tickFormat)
            xAxis_2.tickFormat(d3.timeFormat(tickFormat));
      

        var yAxis = d3.axisLeft(y)
                .tickSize(chartWidth)
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
            .attr("width", chartWidth)
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
            .attr("width", width)
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

        var mouseoverBar = function(taskName){
            ganttChartGroup.selectAll(`rect[data-task="${taskName}"]`).classed("hovered",true);
            ganttChartGroup.selectAll(`path[data-tasks*=",${taskName},"]`).classed("hovered",true);
            let node = ganttChartGroup.select(`rect[data-task="${taskName}"]`).node();
            tooltip.show.apply(node, [lookup(taskName)]);
        }
        var mouseoutBar = function(taskName){
            ganttChartGroup.selectAll(`rect[data-task="${taskName}"]`).classed("hovered",false);
            ganttChartGroup.selectAll(`path[data-tasks*=",${taskName},"]`).classed("hovered",false);
            let node = ganttChartGroup.select(`rect[data-task="${taskName}"]`).node();
            tooltip.hide.apply(node, [lookup(taskName)]);
        }

        var customYAxis = function(g){
            g.call(yAxis);
            g.selectAll(".tick line")
              .attr("x1", -1*margin.left)
              .attr("x2", chartWidth)
              .attr("stroke", "#777")
              .attr("transform", `translate(0,-${y.step()/2})`);
            g.selectAll(".tick text")
              .attr("x", -4)
              .attr("dy", 4)
              .on('mouseover', mouseoverBar)
              .on('mouseout', mouseoutBar);
        }

        svg.append("g")
            .attr("class", "y axis")
            .call(customYAxis);

        svg.append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", chartWidth)
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
            e.each(function(d){
                if(!d.dependencies)
                    return;
                for(let depName of d.dependencies){
                    var depData = lookup(depName);
                    var depY = y(depData.taskName)+y.bandwidth();
                    var depX = x(depData.endDate)-((x(depData.endDate)-x(depData.startDate))/2);
                    var myX = x(d.startDate);
                    var myY = y(d.taskName)+(y.bandwidth()/2);
                    ganttChartGroup
                      .append("path")
                      .attr("d", `M ${depX} ${depY} q ${0} ${myY-depY} ${myX-depX} ${myY-depY}`)
                      .attr("data-tasks", ","+[d.taskName, depName].join(",")+",")
                      .attr("stroke", depData.isOnCriticalPath && d.isOnCriticalPath ? "#B71C1C" : "black")
                      .attr("stroke-width", 2)
                      .attr("fill", "none");
                }
            });
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
            .attr("width", function (d) { return Math.max(x(d.endDate) - x(d.startDate),5); })
            //.attr("clip-path", "url(#clip)");
            .on('mouseover', function(data){
                mouseoverBar(data.taskName);
            })
            .on('mouseout', function(data){
                mouseoutBar(data.taskName);
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