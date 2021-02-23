var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherSwitchAccessory(log, debug, accessory, sw, session) {
    RademacherAccessory.call(this, log, debug, accessory, sw, session);
    this.sw = sw;
    this.lastState = this.sw.statusesMap.Position==100?true:false;
    this.currentState = this.sw.statusesMap.Position==100?true:false;
    if (this.debug) this.log("%s [%s] - RademacherSwitchAccessory(): initial state=%s", this.accessory.displayName, this.sw.did, this.currentState)
    this.service = this.accessory.getService(global.Service.Switch);
    this.service
        .getCharacteristic(global.Characteristic.On)
        .setValue(this.currentState)
        .on('set', this.setCurrentState.bind(this))
        .on('get', this.getCurrentState.bind(this));
    // TODO configure interval
    setInterval(this.update.bind(this), 10000);
}

RademacherSwitchAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherSwitchAccessory.prototype.getCurrentState = function(callback) {
    if (this.debug) this.log("%s [%s] - getCurrentState()", this.accessory.displayName, this.sw.did);
    callback(null,this.currentState);
    var self = this;
    this.getDevice(function(err, data) {
        if(err) 
        {
            self.log("%s [%s] - getCurrentState(): error=%s", self.accessory.displayName, self.sw.did,err);
            return; 
        }
        const position=data?data.statusesMap.Position:0;
        self.currentState=position==100?true:false;
        if (self.debug) self.log("%s [%s] - getCurrentState(): position=%s, state=%s", self.accessory.displayName, self.sw.did, position, self.currentState);
        self.service.getCharacteristic(global.Characteristic.On).updateValue(self.currentState);
    });
};

RademacherSwitchAccessory.prototype.setCurrentState = function(value, callback) {
    if (this.debug) this.log("%s [%s] - setCurrentState(%s)", this.accessory.displayName, this.sw.did,value);
    callback(null);
    var self = this;
    var changed = (value != this.lastState);
    if (this.debug) this.log("%s [%s] - setCurrentState(): switch changed=%s, lastState=%s", this.accessory.displayName, this.sw.did,changed, this.lastState);
    if (changed)
    {
        var params = {name: this.lastState?"TURN_OFF_CMD":"TURN_ON_CMD"};
        this.session.put("/devices/"+this.sw.did, params, 30000, function (err) {
            if(err) 
            {
                self.log("%s [%s] - setCurrentState(): error=%s", self.accessory.displayName, self.sw.did,err);
                return; 
            }
            self.currentState=value;
            self.lastState = self.currentState;
            self.service.getCharacteristic(Characteristic.On).updateValue(self.currentState);   
        });
    }
};

RademacherSwitchAccessory.prototype.update = function() {
    if (this.debug) this.log(`%s [%s] - update()`, this.accessory.displayName, this.sw.did);
    var self = this;
    // Switch state
    this.getCurrentState(function(err, state) {
        if (err)  
        { 
            self.log(`%s [%s] - update().getCurrentState(): error=%s`, self.accessory.displayName, self.sw.did, err);
        }
        else if (state===null)
        {
            self.log(`%s [%s] - update().getCurrentState(): got null state`, self.accessory.displayName, self.sw.did);
        }
        else
        {
            if (self.debug) self.log(`%s [%s] - update().getCurrentState(): state=%s`, self.accessory.displayName, self.sw.did, state);
        }
    }.bind(this));
};

module.exports = RademacherSwitchAccessory;