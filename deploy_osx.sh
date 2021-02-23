#!/bin/bash
CLEANCACHE="$1"

launchctl unload ~/Library/LaunchAgents/com.homebridge.server.plist
if  [ "" != "$CLEANCACHE" ]
then
    rm -f ~/.homebridge/accessories/cachedAccessories
fi
npm install -g .
launchctl load ~/Library/LaunchAgents/com.homebridge.server.plist
tail -f ~/.homebridge/homebridge.log
