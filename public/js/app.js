var socket = io.connect('http://' + location.host);
var chart, chartCPU, chartMem, memTotal;

chart = new Highcharts.StockChart({
  chart: {
    renderTo: 'chart', 
    defaultSeriesType: 'spline',
    events: {
      load: function() {
        socket.on('temperatureUpdate', function (time, data) {
          var series = chart.series[0];
          series.addPoint([time, data]);
        });
      }
    }
  },
  rangeSelector : {
    selected : 100
  },
  title: {
    text: 'CPU Temperature Raspberry Pi'
  },
  xAxis: {
    type: 'datetime',
    tickPixelInterval: 150,
    maxZoom: 20 * 1000
  },
  yAxis: {
    minPadding: 0.2,
    maxPadding: 0.2,
    title: {
      text: 'Temperature ºC',
      margin: 10
    }
  },
  series: [{
    name: 'Temperature',
    data: []
  }],
  credits: {
    enabled: false
  }
});

chartCPU = new Highcharts.StockChart({
  chart: {
    renderTo: 'cpu_usage', 
    defaultSeriesType: 'spline',
    events: {
      load: function() {
        socket.on('cpuUsageUpdate', function (time, data) {
          var series = chartCPU.series[0];
          series.addPoint([time, data]);
        });
      }
    }
  },
  rangeSelector : {
    selected : 100
  },
  title: {
    text: 'CPU Load Raspberry Pi'
  },
  xAxis: {
    type: 'datetime',
    tickPixelInterval: 150,
    maxZoom: 20 * 1000
  },
  yAxis: {
    minPadding: 0.2,
    maxPadding: 0.2,
    title: {
      text: 'CPU Load (%)',
      margin: 10
    }
  },
  series: [{
    name: 'CPU Load',
    data: []
  }],
  credits: {
    enabled: false
  }
});

chartMem = new Highcharts.Chart({
  chart: {
    renderTo: 'chartMemory',
    type: 'bar',
    events: {
      load: function() {
        socket.on('memoryUpdate', function (free, used, buffered, cached) {
          chartMem.series[0].setData([
            { y: used, color: 'red' }, 
            { y: free, color: 'green' }, 
            { y: buffered, color: 'blue' }, 
            { y: cached, color: 'orange' }]
            );
        });
      }
    }
  },
  title: {
    text: 'Memory'
  },
  xAxis: {
    categories: ['Used', 'Free', 'Buffered', 'Cached'],
    title: {
      text: null
    }
  },
  yAxis: {
    min: 0,
    title: {
      text: 'Percentage',
      align: 'high'
    },
    labels: {
      overflow: 'justify'
    }
  },
  tooltip: {
    valueSuffix: ' %'
  },
  plotOptions: {
    bar: {
      dataLabels: {
        enabled: true
      }
    }
  },            
  credits: {
    enabled: false
  },
  series: [{
    name: 'Memory',
    data: [{y: 0, color: 'red'}, {y: 0, color: 'green'}, {y: 0, color: 'blue'}, {y: 0, color: 'orange'}]
  }]
});

socket.on('hostname', function (hname) {
  var elements = document.getElementsByClassName('host-name');
  $.each(elements, function(index, element) { 
    element.innerHTML = hname;
  });
});

socket.on('kernel', function (ker) {
  document.getElementById('p_kernel').innerHTML='<b>Kernel:</b> '+ker;
}); 

socket.on('uptime', function (uptime) {
  document.getElementById('p_uptime').innerHTML='<b>Up time:</b> '+ uptime;
}); 

socket.on('toplist', function (toplist) {
  var res = toplist.split('\n');
  var result = '';
  for (r in res) {
    if (res[r]) {
      result = result + '<li>' + res[r] + '</li>'
    }
  }
  document.getElementById('toplist').innerHTML=result;
});

socket.on('memoryTotal', function (mem) {
  chartMem.setTitle({ text: 'Memory: ' + mem + ' KB' });
  memTotal = mem;
});