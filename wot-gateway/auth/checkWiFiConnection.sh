#!/bin/bash

echo "Hello"
CONNECTIONS=$(nmcli dev)
# echo "${CONNECTIONS}"
if [[ "$CONNECTIONS" =~ "disconnected" ]]; then
    echo "disconnected, running changeWiFiDongleToHotspot.sh"
    exec "/root/WoT/gateway/wot-gateway/auth/changeWiFiDongleToHotspot.sh"
elif [[ "$CONNECTIONS" =~ "connected" ]]; then
    echo "connected"
else    
    echo "error, neither connected nor disconnected!"
fi
echo "Bye Bye"