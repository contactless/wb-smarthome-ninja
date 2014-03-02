var stream = require('stream')
  , util = require('util');

// Give our device a stream interface
util.inherits(Device,stream);

// Export it
module.exports=Device;


var exec = require('child_process').exec;

/**
 * Creates a new Device Object
 *
 * @property {Boolean} readable Whether the device emits data
 * @property {Boolean} writable Whether the data can be actuated
 *
 * @property {Number} G - the channel of this device
 * @property {Number} V - the vendor ID of this device
 * @property {Number} D - the device ID of this device
 *
 * @property {Function} write Called when data is received from the Ninja Platform
 *
 * @fires data - Emit this when you wish to send data to the Ninja Platform
 */
function Device(gpio, name) {

  var self = this;

  // This device will emit data
  this.readable = true;
  // This device can be actuated
  this.writeable = true;

  this.V = 0;
  this.D = 238;  // Device ID 238 is "relay" -- ID 206 is "switch actuator"
  this.G = "gpioOut"+gpio;//"switch_" + gpio;
  this.name = name + "(" + gpio + ")";

  this._gpio = gpio;

  process.nextTick(function() {
    setGpioOut(gpio);
    self.read();
  });


  setInterval(function() {self.read();},  30000);

};

function setGpioOut(gpio) {
    exec("echo " + gpio + " > /sys/class/gpio/export");
    exec("echo out > /sys/class/gpio/gpio" + gpio + "/direction");

    console.log("blah!");
};


function outputGpio(gpio, value) {
    exec("echo " + gpio + " > /sys/class/gpio/export");
    exec("echo " + value + " > /sys/class/gpio/gpio" + gpio + "/value");

    console.log("out value " + value);
};


/**
 * Called whenever there is data from the Ninja Platform
 * This is required if Device.writable = true
 *
 * @param  {String} data The data received
 */
Device.prototype.write = function(data) {
  var self = this;
  var value = 0;
  if (data == "1") {
      value = 1;
  }
  outputGpio(this._gpio, value);

  // I'm being actuated with data!
  console.log(data);
  //~ setTimeout( function() {self.read();}, 1000);
};

Device.prototype.read = function() {
    var fname = "/sys/class/gpio/gpio" + this._gpio + "/value";

    fs.readFile(fname, 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }

      var value = parseInt(data) ? 1 : 0;
      this.emit('data', value);

    }.bind(this));


};





