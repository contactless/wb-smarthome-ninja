var stream = require('stream')
  , util = require('util');

var net = require('net');
var HOST = '127.0.0.1';
var PORT = 58149;

// Give our device a stream interface
util.inherits(RadioDevice,stream);
util.inherits(RadioListener,stream);

// Export it
module.exports=RadioListener;


var exec = require('child_process').exec;

function RadioDevice(V, D, G, name) {

  var self = this;

  // This device will emit data
  this.readable = true;
  // This device can be actuated
  this.writeable = false;

  this.V = V;
  this.D = D;
  this.G = G;
  this.name = name;


};

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

function guid(device) {
	return [device.G,device.V,device.D].join('_');
};


function RadioListener(opts, app, driver) {
    var self = this;
    self.driver = driver;
    console.log("blah");


    this.registeredDevices = {};
    this.nooliteRemoteStates = {};

    process.nextTick(function() {
        self.reconnect();
    });
};

RadioListener.prototype.registerDevice = function(deviceG, deviceV, deviceD, deviceName) {

	var device = new RadioDevice(deviceV, deviceD, deviceG, deviceName);
	// If we already have a device for this guid, bail.
	if (this.registeredDevices[guid(device)]) return device;


	this.driver.emit('register', device);
	this.registeredDevices[guid(device)] = device;
	return device;
}

RadioListener.prototype.sendData = function(deviceObj) {
	if(!deviceObj) { return; }
	var device = this.registeredDevices[guid(deviceObj)];
	if (!device) {
		device = this.registerDevice(deviceObj.G, deviceObj.V, deviceObj.D, deviceObj.name);
	}
    //~ console.log("device=" + device);
	device.emit('data', deviceObj.DA);
};


RadioListener.prototype.processData = function(data) {
    var self = this;
    //~ console.log("got data: " + data);
    var parts = data.split(/\s+/);

    if (parts.length >= 3) {
        var kw = {};

        for (var i = 3; i < parts.length; i++) {
            var kwparts = parts[i].split("=");
            kw[kwparts[0]] = kwparts[1];
        }

        if (parts[2] == "noo") {
            console.log("got noolite command: " + kw);

            var cmd = parseInt(kw.cmd);
            if (cmd == 0 || cmd == 1 ) {
                self.nooliteRemoteStates[kw.addr] = 0;
            } else if (cmd == 2 || cmd == 3 ) {
                self.nooliteRemoteStates[kw.addr] = 1;
            } else if (cmd == 4 || cmd == 7) {
                self.nooliteRemoteStates[kw.addr] = self.nooliteRemoteStates[kw.addr] ? 0 : 1;
            }


            self.sendData( { 'V' : 0, 'D' : 200, 'G' : kw.addr, 'name' : "NooLite Remote " + kw.addr, 'DA': self.nooliteRemoteStates[kw.addr] });



        } else if (parts[2] == "oregon") {
            console.log("got oregon data: " + kw);
            self.sendData( { 'V' : 0, 'D' : 202, 'G' : kw.code + "C" + kw.channel, 'name' : "Oregon " + kw.code + "@" + kw.channel + ' temp', 'DA':  parseFloat(kw.temp) });
            self.sendData( { 'V' : 0, 'D' : 203, 'G' : kw.code + "C" + kw.channel, 'name' : "Oregon " + kw.code + "@" + kw.channel + ' humidity', 'DA':  parseFloat(kw.humidity) });



        }
    }

};


function emitLines (stream) {
    var backlog = ''
    stream.on('data', function (data) {
        backlog += data;
        var n = backlog.indexOf('\n');
        // got a \n? emit one or more 'line' events
        while (~n) {
            console.log("stream=" + stream);
            stream.emit('line', backlog.substring(0, n));
            backlog = backlog.substring(n + 1);
            n = backlog.indexOf('\n');
        }
    })
    stream.on('end', function () {
        if (backlog) {
            stream.emit('line', backlog);
        }
    })
}


RadioListener.prototype.reconnect = function() {
    var self = this;

    console.log("connecting to radio...");

    var client = new net.Socket();
    client.setEncoding("utf-8");
    client.connect(PORT, HOST, function() {
        console.log('CONNECTED TO: ' + HOST + ':' + PORT);

    });



    emitLines(client);
    client.on('line', function(data) {
        //~ console.log('DATA: ' + data);
        setTimeout(function (){self.processData(data);}, 0);
    });

    // Add a 'close' event handler for the client socket
    client.on('close', function() {
        console.log('Connection to radio server closed');
        setTimeout(function() {self.reconnect();}, 3000);
    });
}






