var stream = require('stream')
  , util = require('util');

// Give our device a stream interface
util.inherits(NoolightDevice,stream);

// Export it
module.exports=NoolightDevice;


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
function NoolightDevice(addr) {

  var self = this;

  // This device will emit data
  this.readable = true;
  // This device can be actuated
  this.writeable = true;

  this.V = 3;
  this.D = 1 ;  // Device ID 238 is "relay" -- ID 206 is "switch actuator"
  this.G = addr;
  this.name = 'Noolite 0x' + addr ;

  this._addr = addr;

  process.nextTick(function() {
    self.emit('data','Hello World');
  });
};


/**
 * Called whenever there is data from the Ninja Platform
 * This is required if Device.writable = true
 *
 * @param  {String} data The data received
 */
NoolightDevice.prototype.sendCmd = function(params) {
    var cmd = 'echo "noo addr=' + this._addr + " " + params +  '" |  busybox nc 127.0.0.1 58149';
    exec(cmd);
}




NoolightDevice.prototype.write = function(data) {
  var value = 0;
  if (data == "1") {
      this.sendCmd("cmd=2");
  } else if (data == "0") {
      this.sendCmd("cmd=0");
  }

  //~ outputGpio(this._gpio, value);

  // I'm being actuated with data!
  console.log(data);
};








