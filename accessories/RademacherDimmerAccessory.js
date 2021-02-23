var request = require("request");
var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherDimmerAccessory(log, debug, accessory, dimmer, session) {
    RademacherAccessory.call(this, log, debug, accessory, dimmer, session);
    var self = this;
    this.dimmer = dimmer;
    var position=0;
    if (this.dimmer.hasOwnProperty("statusesMap") && this.dimmer.statusesMap.hasOwnProperty("Position"))
    {
        position=this.dimmer.statusesMap.Position;
    }
    else
    {
        this.log("RademacherDimmerAccessory(): no position in dimmer object %o", dimmer)
    }
    if (this.debug) this.log("%s [%s] - RademacherDimmerAccessory(): initial position=%s", accessory.displayName, dimmer.did,position);
    this.lastBrightness = position;
    this.currentBrightness = this.lastBrightness;
    this.currentStatus = position>0?true:false;
    this.lastStatus = this.currentStatus;
    this.service = this.accessory.getService(global.Service.Lightbulb);
    this.service.getCharacteristic(global.Characteristic.On)
        .on('get', this.getStatus.bind(this))
        .on('set', this.setStatus.bind(this));
    this.service.getCharacteristic(global.Characteristic.Brightness)
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));
    // TODO configure interval
    setInterval(this.update.bind(this), 30000);
}

RademacherDimmerAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherDimmerAccessory.prototype.getStatus = function(callback) {
    if (this.debug) this.log("%s [%s] - getStatus()", this.accessory.displayName, this.dimmer.did);
    callback(null,this.currentStatus);
    var self = this;
    this.getDevice(function(err, data) {
        if(err)
        {
            self.log(`%s [%s] - error in getStatus(): %s`, self.accessory.displayName, self.dimmer.did, err);
            return;
        } 
        var pos = data.statusesMap.Position;
        if (self.debug) self.log(`%s [%s] - getStatus(): brightness=%s`, self.accessory.displayName, self.dimmer.did, pos);
        self.currentStatus=(pos>0?true:false);
        self.lastStatus=self.currentStatus;
        self.service.getCharacteristic(Characteristic.On).updateValue(self.currentStatus);
    });
};

RademacherDimmerAccessory.prototype.setStatus = function(status, callback, context) {
    if (this.debug) this.log("%s [%s] - setStatus(%s)", this.accessory.displayName, this.dimmer.did, status);
    callback(null);
    var self = this;
    var changed = (status != this.lastStatus);
    if (this.debug) this.log("%s [%s] - setStatus(): dimmer changed=%s", this.accessory.displayName,self.dimmer.did,changed);
    if (changed)
    {            
        this.log("%s [%s] - setStatus(): changed from %s to %s", this.accessory.displayName,self.dimmer.did,this.lastStatus,status);
        var params = {name: this.lastStatus?"TURN_OFF_CMD":"TURN_ON_CMD"};
        this.session.put("/devices/"+this.dimmer.did, params, 30000, function(err) {
            if(err)
            {
                self.log(`%s [%s] - setStatus(): error=%s`, self.accessory.displayName, self.dimmer.did, err);
                return;
            } 
            self.currentStatus = status;
            self.lastStatus = self.currentStatus;
            self.service.getCharacteristic(Characteristic.On).updateValue(self.currentStatus);
        });
    }
};

RademacherDimmerAccessory.prototype.getBrightness = function(callback) {
    if (this.debug) this.log("%s [%s] - getBrightness()", this.accessory.displayName, this.dimmer.did);
    callback(null,this.currentBrightness);
    var self = this;
    this.getDevice(function(err, data) {
        if(err)
        {
            self.log(`%s [%s] - getBrightness(): error=%s`, self.accessory.displayName, self.dimmer.did, err);
            return;
        } 
        var pos = data.statusesMap.Position;
        if (self.debug) self.log(`%s [%s] - getBrightness(): brightness=%s`, self.accessory.displayName, self.dimmer.did, pos);        
        self.currentBrightness=pos;
        self.lastBirhgtness=self.currentBrightness;
        self.service.getCharacteristic(Characteristic.Brightness).updateValue(self.currentBrightness);
    });
};

RademacherDimmerAccessory.prototype.setBrightness = function(brightness, callback, context) {
    if (this.debug) this.log("%s [%s] - setBrightness(%s)", this.accessory.displayName, this.dimmer.did, brightness);
    callback(null);
    if (context) {
        var self = this;
        var changed = (brightness != this.lastBrightness);
        if (changed)
        {
            this.log("%s  [%s] - setBrightness(): brightness changed from %s to %s", this.accessory.displayName,self.dimmer.did,this.lastBrightness,brightness);
            var params = {name: "GOTO_POS_CMD", value: brightness};
            this.session.put("/devices/"+this.dimmer.did, params, 30000, function(e) {
                if(e) return callback(new Error("Request failed: "+e), null);
                self.currentBrightness = brightness;
                self.lastBrightness = self.currentBrightness;
                self.service.getCharacteristic(Characteristic.Brightness).updateValue(self.currentBrightness);
            });
        }
    }
};

RademacherDimmerAccessory.prototype.update = function() {
    if (this.debug) this.log(`%s [%s] - update()`, this.accessory.displayName, this.dimmer.did);
    var self = this;

    // Status
    this.getStatus(function(err, status) {
        if (err)
        {
            self.log(`%s [%s] update().getStatus(): error=%s`, this.accessory.displayName, this.dimmer.did,err);
        }
        else if (status===null)
        {
            self.log(`%s [%s] update().getStatus(): got null`, this.accessory.displayName, this.dimmer.did);
        }
        else
        {
            if (self.debug) self.log(`%s [%s] - update().getStatus(): new status=%s`, self.accessory.displayName, self.dimmer.did, status);
        }
    }.bind(this)); 

    // Brightness
    this.getBrightness(function(err, brightness) {
        if (err)
        {
            self.log(`%s [%s] update().getBrightness(): error=%s`, this.accessory.displayName, this.dimmer.did,err);
        }
        else if (brightness===null)
        {
            self.log(`%s [%s] update().getBrightness(): got null`, this.accessory.displayName, this.dimmer.did);
        }
        else
        {
            if (self.debug) self.log(`%s [%s] - update().getBrightness(): new brightness=%s`, self.accessory.displayName, self.dimmer.did, brightness);
        }
    }.bind(this));
};

RademacherDimmerAccessory.prototype.getServices = function() {
    return [this.service];
};

module.exports = RademacherDimmerAccessory;
