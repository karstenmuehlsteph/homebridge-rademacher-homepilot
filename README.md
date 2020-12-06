# homebridge-rademacher-homepilot
Homebridge plugin for Rademacher Homepilot.

# Installation
Follow the instruction in [homebridge](https://www.npmjs.com/package/homebridge) for the homebridge server installation.
The plugin is published through [npm](https://www.npmjs.com/package/homebridge-rademacher-homepilot) and should be installed "globally" by typing:
```
npm install -g homebridge-rademacher-homepilot
```
Update your config.json file. See config.json in this repository for a sample.

# Configuration

Configuration sample:
```
  "platforms": [
      {
        "platform": "RademacherHomePilot",
        "name": "RademacherHomePilot",
        "url": "http://192.168.0.1",
        "password": "",
        "password_hashed": "false",
        "scenes_as_switch":"false",
        "debug": "false",
	      "did_list_usage": "none",
	      "did_list: []
      }
    ]
```

* `url`: address of HomePilot's web interface in your local network,
* `password`: password to HomePilot (if enabled in its web interface)
* `password_hashed`: password to HomePilot is alerady hashed with sha256 (if enabled in its web interface)
* `scenes_as_switch`: if "true", all scenes are added as switch to HomeKit, otherwise scenes are not added at all 
* `debug`: if "true", debugging is activated
* `did_list_usage`: if "include" you can choose what Devices are mirrored to HomeKit, you have to enter matching DIDs below, if "exclude" you can exclude a list of DIDs, default is "none"
* `did_list`: enter the Device IDs (DIDs) you want to be shown in HomeKit. You can find them in the Status Screen of HomeBridge if you enable "did_list_usage" and insert at least one fake DID
          Example: "did_list": [1010101,1010102,1010133]

# Community

The official Homebridge Discord server and Reddit community are where users can discuss Homebridge and ask for help.

<span align="center">

[![Homebridge Discord](https://discordapp.com/api/guilds/432663330281226270/widget.png?style=banner2)](https://discord.gg/kqNCe2D) [![Homebridge Reddit](images/homebridge-reddit.svg?sanitize=true)](https://www.reddit.com/r/homebridge/)

</span>

HomeKit communities can also be found on both [Discord](https://discord.gg/RcV7fa8) and [Reddit](https://www.reddit.com/r/homekit).
