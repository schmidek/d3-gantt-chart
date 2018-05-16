import React from 'react';
import gantt from './gantt.js'
import './Example.css';

class GanttChart extends React.Component {
  constructor(props){
    super(props)
    this.createBarChart = this.createBarChart.bind(this)
  }
  componentDidMount() {
      this.createBarChart()
  }
  componentDidUpdate() {
      this.createBarChart()
  }
  createBarChart() {
    var tasks = [
      {"startDate":new Date("Sun Dec 09 01:36:45 EST 2012"),"endDate":new Date("Sun Dec 09 02:36:45 EST 2012"),"taskName":"E Job","percentComplete":1.0, "tooltip":"Ran for 2h", "isOnCriticalPath":true},
      {"startDate":new Date("Sun Dec 09 04:02:45 EST 2012"),"endDate":new Date("Sun Dec 09 04:48:56 EST 2012"),"taskName":"N Job","percentComplete":1.0,"dependencies":["E Job"], "isOnCriticalPath":true},
      {"startDate":new Date("Sun Dec 09 04:56:32 EST 2012"),"endDate":new Date("Sun Dec 09 06:35:47 EST 2012"),"taskName":"A Job","percentComplete":0.5,"dependencies":["N Job"], "isOnCriticalPath":true},
      {"startDate":new Date("Sun Dec 09 05:35:21 EST 2012"),"endDate":new Date("Sun Dec 09 06:21:22 EST 2012"),"taskName":"P Job","percentComplete":0.2,"dependencies":["N Job"]},
      {"startDate":new Date("Sun Dec 09 06:29:53 EST 2012"),"endDate":new Date("Sun Dec 09 06:34:04 EST 2012"),"taskName":"D Job","percentComplete":0.0,"dependencies":["P Job","N Job"]}      
    ];
      
    var taskNames = [ "E Job", "N Job", "A Job", "P Job", "D Job" ];

    tasks.sort(function(a, b) {
        return a.endDate - b.endDate;
    });
    var maxDate = tasks[tasks.length - 1].endDate;
    tasks.sort(function(a, b) {
        return a.startDate - b.startDate;
    });
    var minDate = tasks[0].startDate;

    var format = "%H:%M";

    var ganttChart = gantt(this.node)
      .tickFormat(format)
      .margins({
        top: 0,
        right: 10,
        bottom: 20,
        left: 50
      });
    ganttChart(tasks);
  }
  render(){
    return (
      <div style={{marginTop:200}} ref={node => this.node = node}>
      </div>);
  }
}

export default GanttChart;
