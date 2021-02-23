var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherSunSensorAccessory(log, debug, accessory, sensor, session) 
{
    RademacherAccessory.call(this, log, debug, accessory, sensor, session);
    this.sensor = sensor;
    this.services = [];
    // Light sensor
    this.currentSunState=this.sensor.readings.sun_detected ? 100000 : 0.0001;
    var lightSensorService = this.accessory.getService(global.Service.LightSensor);
    lightSensorService.getCharacteristic(global.Characteristic.CurrentAmbientLightLevel)
        .setProps({ minValue: 0.0001, maxValue: 100000 })
        .setValue(this.currentSunState)
        .on("get", this.getCurrentSunState.bind(this));
    this.services.push(lightSensorService);
    // Switch (ambient light level characteristic of light sensor cannot yet be used as trigger in HomeKit)
    var switchService = this.accessory.getService(global.Service.Switch);
    switchService.getCharacteristic(global.Characteristic.On)
        .setValue(this.sensor.readings.sun_detected ? true : false)
    this.services.push(switchService);
    setInterval(this.update.bind(this), 10000);
}

RademacherSunSensorAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherSunSensorAccessory.prototype.getCurrentSunState = function(callback) 
{
    if (this.debug) this.log("%s [%s] - getCurrentSunState()", this.accessory.displayName, this.sensor.did);
    callback(null,this.currentSunState);
    var self = this;
    this.session.get("/v4/devices?devtype=Sensor", 30000, function (err,body) {
        if(err) 
        {
            self.log("%s [%s] - getCurrentSunState(): error=%s", self.accessory.displayName, self.sensor.did,err);
            return;
        }
        body.meters.forEach(function (data) {
            if (data.did == self.sensor.did) {
                const sun_detected=data.readings.sun_detected
                self.currentSunState = sun_detected? 100000 : 0.0001;
                if (self.debug) self.log("%s [%s] - getCurrentSunState(): sun_detected=%s, state=%s", self.accessory.displayName, self.sensor.did, sun_detected,self.currentSunState);
                // Update LightSensor state
                var lightSensorService = self.accessory.getService(global.Service.LightSensor);
                lightSensorService.getCharacteristic(global.Characteristic.CurrentAmbientLightLevel).updateValue(self.currentSunState);
                // Update Switch state
                var switchService = self.accessory.getService(global.Service.Switch);
                switchService.getCharacteristic(global.Characteristic.On).updateValue(sun_detected);
            }
        });
    });
};

RademacherSunSensorAccessory.prototype.update = function() {
    this.getCurrentSunState(function(err, sun_detected) {
        if (err)
        {
            self.log(`%s [%s] - update().getCurrentSunState(): error=%s`, self.accessory.displayName, self.sensor.did, err);
        }
        else if (sun_detected===null)
        {
            self.log(`%s [%s] - update().getCurrentSunState(): got null state`, self.accessory.displayName, self.sensor.did);
        }
        else
        {
            if (self.debug) self.log(`%s [%s] - update().getCurrentSunState(): state=%s`, self.accessory.displayName, self.sensor.did, sun_detected);
        }
    }.bind(this));
};

RademacherSunSensorAccessory.prototype.getServices = function() 
{
    return this.services;
};

module.exports = RademacherSunSensorAccessory;
