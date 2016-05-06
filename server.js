'use-strict';

const fs = require('fs');
const sys = require('util');
const exec = require('child_process').exec;

let child;
let child1;
let connectCounter = 0;

const INTERVAL = process.env.INTERVAL = 500;
const PORT = process.env.PORT || 3000;

const app = require('http')
  .createServer(serverHandler)
  .listen(PORT, '0.0.0.0');

const io = require('socket.io')
  .listen(app);

app.listen(PORT, function() {
  console.log(`Monitoring tool running on port: ${PORT}`)
});

function serverHandler(req, res) {
	fs.readFile(__dirname + '/index.html', function(err, data) {
		if (err) {
			console.log(err);
			res.writeHead(500);
			return res.end('Error loading index.html');
		}

		res.writeHead(200);
		res.end(data);
	});
}

io.sockets.on('connection', (socket) => {
  let memTotal; 
  let memUsed = 0; 
  let memFree = 0;
  let memBuffered = 0;
  let memCached = 0;
  let sendData = 1;
  let percentBuffered;
  let percentCached; 
  let percentUsed; 
  let percentFree;
  
  let address = socket.handshake.address;

  console.log(`New connection from ${address.address}:${address.port}`);
  console.log(`+++ Connection numbers: ${connectCounter++}`);

  socket.on('disconnect', () => console.log(`--- Connection numbers: ${connectCounter--}`));

  child = exec(`egrep --color 'MemTotal' /proc/meminfo | egrep '[0-9.]{4,}' -o`, (error, stdout, stderr) => {
    if (error !== null) {
      console.log(`[ERROR]: ${error}`);
    } 
    else {
      memTotal = stdout;
      socket.emit('memoryTotal', stdout); 
    }
  });

  child = exec('hostname', (error, stdout, stderr) => {
    if (error !== null) {
      console.log(`[ERROR]: ${error}`);
    } 
    else {
      socket.emit('hostname', stdout); 
    }
  });

  child = exec(`uptime | tail -n 1 | awk '{print $1}'`, (error, stdout, stderr) => {
    if (error !== null) {
      console.log(`[ERROR]: ${error}`);
    } 
    else {
      socket.emit('uptime', stdout); 
    }
  });

  child = exec(`uname -r`, (error, stdout, stderr) => {
    if (error !== null) {
      console.log(`[ERROR]: ${error}`);
    } 
    else {
      socket.emit('kernel', stdout); 
    }
  });

  child = exec(`top -d 0.5 -b -n2 | tail -n 10 | awk '{print $12}'`, (error, stdout, stderr) => {
    if (error !== null) {
      console.log(`[ERROR]: ${error}`);
    } 
    else {
      socket.emit('toplist', stdout); 
    }
  });

  setInterval(() => {
    child1 = exec(`egrep --color 'MemFree' /proc/meminfo | egrep '[0-9.]{4,}' -o`, (error, stdout, stderr) => {
      if (error !== null) {
        sendData = 0;
        console.log(`[ERROR]: ${error}`);
      } 
      else {
        memFree = stdout;
        memUsed = parseInt(memTotal) - parseInt(memFree);
        percentUsed = Math.round(parseInt(memUsed) * 100 / parseInt(memTotal));
        percentFree = 100 - percentUsed;
      }
    });

    child1 = exec(`egrep --color 'Buffers' /proc/meminfo | egrep '[0-9.]{4,}' -o`, (error, stdout, stderr) => {
      if (error !== null) {

      } 
      else {
        memBuffered = stdout;
        percentBuffered = Math.round(parseInt(memBuffered) * 100/ parseInt(memTotal));
      }
    });

    child1 = exec(`egrep --color 'Cached' /proc/meminfo | egrep '[0-9.]{4,}' -o`, (error, stdout, stderr) => {
      if (error !== null) {
        sendData = 0;
        console.log(`[ERROR]: ${error}`);
      }
      else {
        memCached = stdout;
        percentCached = Math.round(parseInt(memCached)*100/parseInt(memTotal));
      }
    });

    if (sendData === 1) {
      socket.emit('memoryUpdate', percentFree, percentUsed, percentBuffered, percentCached); 
    } 
    else {
      sendData = 1;
    }
  }, INTERVAL);

  setInterval(() => {
    child = exec(`cat /sys/class/thermal/thermal_zone0/temp`, (error, stdout, stderr) => {
      if (error !== null) {
        console.log(`[ERROR]: ${error}`);
      } 
      else {
        let date = new Date().getTime();
        let temp = parseFloat(stdout) / 1000;

        socket.emit('temperatureUpdate', date, temp); 
      }
    });
  }, INTERVAL);

  setInterval(() => {
    child = exec(`top -d 0.5 -b -n2 | grep 'Cpu(s)'|tail -n 1 | awk '{print $2 + $4}'`, (error, stdout, stderr) => {
      if (error !== null) {
        console.log(`[ERROR]: ${error}`);
      } 
      else {
        let date = new Date().getTime();
        socket.emit('cpuUsageUpdate', date, parseFloat(stdout)); 
      }
    });
  }, INTERVAL * 2);

  setInterval(() => {
    child = exec(`uptime | tail -n 1 | awk '{print $3 $4 $5}'`, (error, stdout, stderr) => {
      if (error !== null) {
        console.log(`[ERROR]: ${error}`);
      } 
      else {
        socket.emit('uptime', stdout); 
      }
    });
  }, 60000);

  setInterval(() => {
    child = exec(`ps aux --width 30 --sort -rss --no-headers | head  | awk '{print $11}'`, (error, stdout, stderr) => {
      if (error !== null) {
        console.log(`[ERROR]: ${error}`);
      } 
      else {
        socket.emit('toplist', stdout); 
      }
    });
  }, 10000);

});
