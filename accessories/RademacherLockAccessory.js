var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherLockAccessory(log, debug, accessory, lock, session) {
    RademacherAccessory.call(this, log, debug, accessory, lock, session);
    this.log = log;
    this.lock = lock;
    this.session = session;
    this.accessory = accessory;
    this.lockservice = accessory.getService(global.Service.LockMechanism);
    
    this.currentState=lock.statusesMap.Position==0?global.Characteristic.LockCurrentState.SECURED:global.Characteristic.LockCurrentState.UNSECURED;
    if (this.debug) this.log("%s [%s] - RademacherLockAccessory(): initial state=%s", this.accessory.displayName, this.lock.did, this.currentState)

    this.lockservice
        .getCharacteristic(global.Characteristic.LockCurrentState)
        .setValue(this.currentState)
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
    if (this.debug) this.log("%s [%s] - getState()", this.accessory.displayName, this.lock.did)
    callback(null,this.currentState);
    var self = this;
    this.getDevice(function(err, data) {
        if(err) 
        {
            self.log("%s [%s] - getState(): error=%s", self.accessory.displayName, self.lock.did,err);
            return; 
        }
        const position=data.statusesMap.Position;
        self.currentState=position==0?global.Characteristic.LockCurrentState.SECURED:global.Characteristic.LockCurrentState.UNSECURED;
        if (self.debug) self.log("%s [%s] - getState(): position=%s, state=%s", self.accessory.displayName, self.lock.did, position,self.currentState);
        self.lockservice.getCharacteristic(global.Characteristic.LockCurrentState).updateValue(self.currentState);
        self.lockservice.getCharacteristic(global.Characteristic.LockTargetState).updateValue(self.currentState);
    });
}

RademacherLockAccessory.prototype.setState = function (state, callback) {
    this.log("%s [%s] - setState(%s)", this.accessory.displayName, this.lock.did, state)
    callback(null);
    var self=this;
    self.lockservice.getCharacteristic(global.Characteristic.LockCurrentState).updateValue(global.Characteristic.LockCurrentState.UNSECURED);
    self.lockservice.getCharacteristic(global.Characteristic.LockTargetState).updateValue(global.Characteristic.LockTargetState.UNSECURED);
    var params = {name: "TURN_ON_CMD"};
    this.session.put("/devices/"+this.lock.did, params, 30000, function (err) {
        // alway unlock
        self.lockservice.getCharacteristic(global.Characteristic.LockCurrentState).updateValue(global.Characteristic.LockCurrentState.SECURED);
        self.lockservice.getCharacteristic(global.Characteristic.LockTargetState).updateValue(global.Characteristic.LockTargetState.SECURED);
        if(err) 
        {
            self.log("%s [%s] - setState(): error=%s", self.accessory.displayName, self.lock.did,err);
            return; 
        }
    });
}

RademacherLockAccessory.prototype.update = function() {
    if (this.debug) this.log(`%s [%s] - update()`, this.accessory.displayName, this.lock.did);
    var self = this;

    // lockitch state
    this.getState(function(err, state) {
        if (err)
        {
            self.log(`%s [%s] - update().getState(): error=%s`, self.accessory.displayName, self.lock.did, err);
        }
        else if (state===null)
        {
            self.log(`%s [%s] - update().getState(): got null state`, self.accessory.displayName, self.lock.did);
        }
        else
        {
            if (self.debug) self.log(`%s [%s] - update().getState(): state=%s`, self.accessory.displayName, self.lock.did, state);
        }
    }.bind(this));
};

RademacherLockAccessory.prototype.getServices = function() {
    return [this.lockservice];
}

module.exports =  RademacherLockAccessory;