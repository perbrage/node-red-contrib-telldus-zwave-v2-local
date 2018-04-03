# node-red-contrib-telldus-zwave-v2-local

## Information
A Telldus contrib that adds three different nodes to your palette to either control or retreive information from your different z-wave devices, using the local API of Telldus z-wave v2. This package adds 3 nodes, a device node, a metric sensor node and a switch sensor node, together with a configuration node to share the configuration between all your nodes.

## Compatibility
These nodes might work for other Telldus gateway devices, but that has not been confirmed.

## Installation
Either search the palette in NodeRED, or use

```bash
npm install node-red-contrib-telldus-zwave-v2-local
```
## Nodes

![Usage screenshot](https://raw.githubusercontent.com/perbrage/node-red-contrib-telldus-zwave-v2-local/master/screenshots/usage-screenshot.png "Example usage of the nodes")

**Device node**
Control Telldus devices by sending payloads with commands. Supported commands as of now for the Device node are 'on', 'off', 'up', 'down', 'bell' and 'stop'.

![Device configuration screenshot](https://raw.githubusercontent.com/perbrage/node-red-contrib-telldus-zwave-v2-local/master/screenshots/device-screenshot.png "Device configuration")

**Metric Sensor node**
The metric sensor outputs metrics from you sensors or multi sensors. Such as temperature or uv.

![Metric Sensor configuration screenshot](https://raw.githubusercontent.com/perbrage/node-red-contrib-telldus-zwave-v2-local/master/screenshots/metric-screenshot.png "Metric Sensor configuration")

**Switch Sensor node**
The switch sensor outputs the state of a on/off sensor. For example a window or door sensor. This node can also be setup to only output messages when the state change.

![Switch Sensor configuration screenshot](https://raw.githubusercontent.com/perbrage/node-red-contrib-telldus-zwave-v2-local/master/screenshots/switch-screenshot.png "Switch Sensor configuration")

## Configuration
The nodes share a gateway configuration that needs to be configured before any of the nodes can be used. You can either use the built in access token wizard that automates the process of retreiving an access token, or you can follow the the instruction on this page to enter them manually: [Get Access Token](http://api.telldus.net/localapi/api/authentication.html#step-1-request-a-request-token)

![Configuration screenshot](https://raw.githubusercontent.com/perbrage/node-red-contrib-telldus-zwave-v2-local/master/screenshots/config-screenshot.png "Access token wizard, or use the manual configuration at the bottom")