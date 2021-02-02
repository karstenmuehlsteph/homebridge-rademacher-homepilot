
var request = require("request");
var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherDimmerAccessory(log, debug, accessory, dimmer, session) {
    RademacherAccessory.call(this, log, debug, accessory, dimmer, session);
    var self = this;

    this.dimmer = dimmer;
    this.lastBrightness = this.dimmer.brightness;
    this.currentBrightness = 2;
    this.currentStatus = 100;

    this.service = this.accessory.getService(global.Service.Lightbulb);

    this.service.getCharacteristic(global.Characteristic.On)
        .on('get', this.getStatus.bind(this))
        .on('set', this.setStatus.bind(this));

    this.service.getCharacteristic(global.Characteristic.Brightness)
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));

    // TODO configure interval
    setInterval(this.update.bind(this), 60000);
}

RademacherDimmerAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherDimmerAccessory.prototype.getStatus = function(callback) {
    if (this.debug) this.log("%s [%s] - Getting current state", this.accessory.displayName, this.dimmer.did);

    var self = this;

    this.getDevice(function(e, d) {
        if(e) return callback(e, null);
        var pos = d.statusesMap.Position;
        callback(null, (pos>0?true:false));
    });
};

RademacherDimmerAccessory.prototype.setStatus = function(status, callback, context) {
    if (context) {
        this.on = status;
        if (this.debug) this.log("%s  [%s] - Setting dimmer: %s", this.accessory.displayName, this.dimmer.did, status);

        var self = this;
        this.currentState = status;
        var changed = (this.currentState != this.lastState);
        if (this.debug) this.log("%s  [%s] - dimmer changed=%s", this.accessory.displayName,self.dimmer.did,changed);
        if (changed)
        {            
            this.log("%s  [%s] - dimmer changed from %s to %s", this.accessory.displayName,self.dimmer.did,this.currentState,this.lastState);
            var params = {name: this.lastState?"TURN_OFF_CMD":"TURN_ON_CMD"};
            this.session.put("/devices/"+this.dimmer.did, params, 5000, function(e) {
                if(e) return callback(new Error("Request failed: "+e), null);
                self.lastState = self.currentState;
                callback(null, self.currentState);
            });
        }
        else
        {
            return callback(null,this.currentState);
        }
    }
};

RademacherDimmerAccessory.prototype.getBrightness = function(callback) {
    if (this.debug) this.log("%s [%s] - Getting current brightness", this.accessory.displayName, this.dimmer.did);

    var self = this;
    this.getDevice(function(e, d) {
        if(e) return callback(e, null);
        var pos = d.statusesMap.Position;
        callback(null, pos);
    });
};

RademacherDimmerAccessory.prototype.setBrightness = function(brightness, callback, context) {
    if (context) {
        if (this.debug) this.log("%s [%s] - Setting target brightness: %s", this.accessory.displayName, this.dimmer.did, brightness);
        var self = this;
        this.currentBrightness = brightness;
        this.service.setCharacteristic(Characteristic.Brightness,brightness);
        var params = {name: "GOTO_POS_CMD", value: brightness};
        this.session.put("/devices/"+this.dimmer.did, params, 5000, function(e) {
            if(e) return callback(new Error("Request failed: "+e), null);
            callback(null, self.currentBrightness);
        });
}
};

RademacherDimmerAccessory.prototype.update = function() {
    if (this.debug) this.log(`%s [%s] - updating`, this.accessory.displayName, this.dimmer.did);
    var self = this;

    // Status
    this.getStatus(function(err, state) {
        if (err)
        {
            self.log(`%s [%s] error getting state: %s`, this.accessory.displayName, this.dimmer.did,err);
        }
        else if (state===null)
        {
            self.log(`%s [%s] got null state`, this.accessory.displayName, this.dimmer.did);
        }
        else
        {
            if (self.debug) self.log(`%s [%s] - updating state to %s`, self.accessory.displayName, self.dimmer.did, state);
            self.service.getCharacteristic(Characteristic.On).setValue(state, undefined, self.accessory.context);
        }
    }.bind(this));

    // Brightness
    this.getBrightness(function(err, brightness) {
        if (err)
        {
            self.log(`%s [%s] error getting brightness: %s`, this.accessory.displayName, this.dimmer.did,err);
        }
        else if (brightness===null)
        {
            self.log(`%s [%s] got null brightness`, this.accessory.displayName, this.dimmer.did);
        }
        else
        {
            if (self.debug) self.log(`%s [%s] - updating brightness to %s`, self.accessory.displayName, self.dimmer.did, brightness);
            self.service.getCharacteristic(Characteristic.Brightness).setValue(brightness, undefined, self.accessory.context);            
        }
    }.bind(this));


};

RademacherDimmerAccessory.prototype.getServices = function() {
    return [this.service];
};

module.exports = RademacherDimmerAccessory;
