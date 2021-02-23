var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherEnvironmentSensorAccessory(log, debug, accessory, sensor, session, inverted) {
	RademacherAccessory.call(this, log, debug, accessory, sensor, session, inverted);
    this.sensor = sensor;
    this.services = [this.service];
    // temperature sensor
    this.currentTemperature=sensor.readings.temperature_primary;
    var temperatureService = this.accessory.getService(global.Service.TemperatureSensor);
    temperatureService.getCharacteristic(global.Characteristic.CurrentTemperature)
		.setProps({minValue: -30.0, maxValue: 80.0})
        .setValue(this.currentTemperature)
		.on('get', this.getCurrentTemperature.bind(this));
    this.services.push(temperatureService);    
    // light sensor
    this.currentAmbientLightLevel=sensor.readings.sun_brightness;
    var lightService = this.accessory.getService(global.Service.LightSensor);
    lightService.getCharacteristic(global.Characteristic.CurrentAmbientLightLevel)
		.setProps({minValue: 0, maxValue: 150000})
        .setValue(this.currentAmbientLightLevel)
		.on('get', this.getCurrentAmbientLightLevel.bind(this));
    this.services.push(lightService);
    // TODO configure interval
    setInterval(this.update.bind(this), 10000);
}

RademacherEnvironmentSensorAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherEnvironmentSensorAccessory.prototype.getCurrentTemperature = function (callback) {
    this.log("%s [%s] - getCurrentTemperature()", this.accessory.displayName, this.sensor.did);
    callback(null, this.currentTemperature);

    var self = this;
    this.session.get("/v4/devices?devtype=Sensor", 30000, function(err, body) {
        if(err) 
        {
            self.log("%s [%s] - getCurrentTemperature(): error=%s", self.accessory.displayName, self.sensor.did,err);
            return;
        }
        body.meters.forEach(function(data) {
            if(data.did == self.sensor.did)
            {
                self.currentTemperature=data.readings.temperature_primary;
                if (self.debug) self.log("%s [%s] - getCurrentTemperature(): temperature=%s", self.accessory.displayName, self.sensor.did, self.currentTemperature);
                var temperatureService = self.accessory.getService(global.Service.TemperatureSensor);
                temperatureService.getCharacteristic(global.Characteristic.CurrentTemperature).updateValue(this.currentTemperature)
            }
        });
    });
};

RademacherEnvironmentSensorAccessory.prototype.getCurrentAmbientLightLevel = function (callback) {
    this.log("%s [%s] - getCurrentAmbientLightLevel()", this.accessory.displayName, this.sensor.did);
    var self = this;
    this.session.get("/v4/devices?devtype=Sensor", 30000, function(err, body) {
        if(err) 
        {
            self.log("%s [%s] - getCurrentAmbientLightLevel(): error=%s", self.accessory.displayName, self.sensor.did,err);
            return;
        }
        body.meters.forEach(function(data) {
            if(data.did == self.sensor.did)
            {
                self.currentAmbientLightLevel=data.readings.sun_brightness;
                if (self.debug) self.log("%s [%s] - getCurrentAmbientLightLevel(): sun_brightness=%s", self.accessory.displayName, self.sensor.did, self.currentAmbientLightLevel);
                var lightService = self.accessory.getService(global.Service.LightSensor);
                lightService.getCharacteristic(global.Characteristic.CurrentAmbientLightLevel).updateValue(self.currentAmbientLightLevel);                        }
        });
        if (!found) callback("not found");
    });
};

RademacherEnvironmentSensorAccessory.prototype.getServices = function () {
    return this.services;
};

RademacherEnvironmentSensorAccessory.prototype.update = function() {
    if (this.debug) this.log(`%s [%s] - update()`, this.accessory.displayName, this.sensor.did);
    var self = this;

    this.getCurrentTemperature(function(err, temperature) {
        if (err)
        {
            self.log(`%s [%s] - update().getCurrentTemperature(): error=%s`, self.accessory.displayName, self.sensor.did, err);
        }
        else if (temperature===null)
        {
            self.log(`%s [%s] - update().getCurrentTemperature(): got null temperature`, self.accessory.displayName, self.sensor.did);
        }
        else
        {
            if (self.debug) self.log(`%s [%s] - update().getCurrentTemperature(): temperature=%s`, self.accessory.displayName, self.sensor.did, temperature);
        }
    }.bind(this));

    this.getCurrentAmbientLightLevel(function(err, level) {
        if (err)
        {
            self.log(`%s [%s] - update().getCurrentAmbientLightLevel(): error=%s`, self.accessory.displayName, self.sensor.did, err);
        }
        else if (level===null)
        {
            self.log(`%s [%s] - update().getCurrentAmbientLightLevel(): got null level`, self.accessory.displayName, self.sensor.did);
        }
        else
        {
            if (self.debug) self.log(`%s [%s] - update().getCurrentAmbientLightLevel(): level=%s`, self.accessory.displayName, self.sensor.did, level);
        }
    }.bind(this));

};

module.exports = RademacherEnvironmentSensorAccessory;