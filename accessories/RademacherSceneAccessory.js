var tools = require("./tools.js");
var RademacherAccessory = require("./RademacherAccessory.js");

function RademacherSceneAccessory(log, debug, accessory, scene, session) {
    RademacherAccessory.call(this, log, debug, accessory, scene, session);

    this.scene = scene;

    this.debug=true;

    this.service = this.accessory.getService(global.Service.Switch);

    this.service
        .getCharacteristic(global.Characteristic.On).setValue(false)
        .on('set', this.setCurrentState.bind(this))
        .on('get', this.getCurrentState.bind(this));
}

RademacherSceneAccessory.prototype = Object.create(RademacherAccessory.prototype);

RademacherSceneAccessory.prototype.getCurrentState = function(callback) {
    callback(null, false);
};

RademacherSceneAccessory.prototype.setCurrentState = function(value, callback) {
    this.log("%s [%s] - setCurrentState(%s)", this.accessory.displayName, this.scene.sid,value);
    callback(null);
    var self = this;
    if (value)
    {
        var params = {request_type:"EXECUTESCENE",trigger_event:"TRIGGER_SCENE_MANUALLY_EVT"}
        this.log(`%s [%s] - executing scene`, this.accessory.displayName, this.scene.sid);
        this.service.getCharacteristic(global.Characteristic.On).updateValue(true);
        this.session.post("/scenes/"+this.scene.sid+"/actions", params, 30000, function (err) {
            self.service.getCharacteristic(global.Characteristic.On).updateValue(false);
            if(err) 
            {
                self.log("%s [%s] - setCurrentState(): error=%s", self.accessory.displayName, self.scene.did,err);
                return; 
            }
        });
    }
};

RademacherSceneAccessory.prototype.update = function() {
    var self = this;

    // Switch state
    this.getCurrentState(function(err, state) {
        if (err)
        {
            self.log(`%s [%s] - update().getCurrentState(): error=%s`, self.accessory.displayName, self.scene.sid, err);
        }
        else if (state===null)
        {
            self.log(`%s [%s] - update().getCurrentState(): null state`, self.accessory.displayName, self.scene.sid);
        }
        else
        {
            if (self.debug) self.log(`%s [%s] - update().getCurrentState(): new state=%s`, self.accessory.displayName, self.scene.sid, state);
        }
    }.bind(this));
};

module.exports = RademacherSceneAccessory;