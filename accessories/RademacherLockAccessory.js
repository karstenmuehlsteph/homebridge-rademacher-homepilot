var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherLockAccessory(log, debug, accessory, sw, session) {
    RademacherAccessory.call(this, log, debug, accessory, sw, session);
    this.log = log;
    this.sw = sw;
    this.session = session;
    this.accessory = accessory;
    this.lockservice = accessory.getService(global.Service.LockMechanism);
    
    this.lockservice
        .getCharacteristic(global.Characteristic.LockCurrentState)
        .on('get', this.getState.bind(this));
    
    this.lockservice
        .getCharacteristic(global.Characteristic.LockTargetState)
        .on('get', this.getState.bind(this))
        .on('set', this.setState.bind(this));

    // TODO configure interval
    setInterval(this.update.bind(this), 60000);
}

RademacherLockAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherLockAccessory.prototype.getState =function (callback) {
    if (this.debug) this.log("%s [%s] - get lock state (always true)", this.accessory.displayName, this.sw.did)
    var self = this;
    this.getDevice(function(e, d) {
        if(e) return callback(e, null);
        var pos = d?d.statusesMap.Position:0;
        if (self.debug) self.log("%s [%s] - current state: %s", self.accessory.displayName, self.sw.did, pos);
        callback(null, (pos==0?true:false));
    });
}

RademacherLockAccessory.prototype.setState = function (state, callback) {
    var self=this;
    this.log("%s [%s] - unlock", this.accessory.displayName, this.sw.did)

    var params = {name: "TURN_ON_CMD"};
    this.session.put("/devices/"+this.sw.did, params, 5000, function (e) {
            if(e) return callback(new Error("Request failed: "+e), null);
            // alway unlock
            self.lockservice.setCharacteristic(global.Characteristic.LockCurrentState, global.Characteristic.LockCurrentState.UNSECURED);
            self.lockservice.setCharacteristic(global.Characteristic.LockCurrentState, global.Characteristic.LockCurrentState.SECURED)
            return callback(null, true);
    });
}

RademacherLockAccessory.prototype.update = function() {
    if (this.debug) this.log(`%s - [%s] updating`, this.accessory.displayName, this.sw.did);
    var self = this;

    // Switch state
    this.getState(function(err, state) {
        if (err)
        {
            self.log(`%s [%s] - error updating lock:  %s`, self.accessory.displayName, self.sw.did, err);
        }
        else if (state===null)
        {
            self.log(`%s [%s] - got null state`, self.accessory.displayName, self.sw.did);
        }
        else
        {
            if (self.debug) self.log(`%s [%s] - updating to %s`, self.accessory.displayName, self.sw.did, state);
            self.lockservice.getCharacteristic(Characteristic.On).setValue(state, undefined, self.accessory.context);    
        }
    }.bind(this));
};

RademacherLockAccessory.prototype.getServices = function() {
    return [this.lockservice];
}

module.exports =  RademacherLockAccessory;