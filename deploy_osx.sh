#!/bin/bash
CLEANCACHE="$1"

sudo hb-service stop
if  [ "" != "$CLEANCACHE" ]
then
    rm -f ~/.homebridge/accessories/cachedAccessories
fi
npm install -g .
sudo hb-service start
tail -f ~/.homebridge/homebridge.log | grep -i rademacher
