const TelldusLocal = require('telldus-local');
var path = require('path');

module.exports = function(RED) {

    function DeviceNode(config) {
        RED.nodes.createNode(this, config);
        this._localId = config.localId;
        this._name = config.name;
        this._gateway = RED.nodes.getNode(config.gateway);
        var node = this;

        if (!validateConfig(node, config))
            return;
            
        node._configuration = {
                hostname: node._gateway._ip,
                accessToken: node._gateway.credentials.accessToken
            };

        node._telldusLocal = new TelldusLocal(node._configuration);

        node._telldusLocal.getDevice(node._localId)
            .then(device => {
                node.status({fill:"green", shape:"ring", text:"Connected"});
            })
            .catch(error => {
                node.status({fill:"red", shape:"ring", text:"Could not connect"});
            });

        node.on('input', function(msg) {

            node._telldusLocal.getDevice(node._localId).then((device) => {

                switch (msg.payload) {
                    case 'off':
                        device.turnOff();
                        break;  
                    case 'on':
                        device.turnOn();
                        break;
                    case 'up':
                        device.up();
                        break;
                    case 'down':
                        device.down();
                        break;
                    case 'bell':
                        device.bell();
                        break;
                    case 'stop':
                        device.stop();
                        break;
                    default:
                        var command = msg.payload.substring(0,3);

                        if (command == "dim") {
                            var valueStart = msg.payload.indexOf('(');
                            var valueEnd = msg.payload.indexOf(')');
                            if (valueStart == -1 || valueEnd == -1) {
                                node.status({fill:"red", shape:"ring", text:"Bad dim format, use dim(<value>)"});
                                return;
                            }
                            var value = msg.payload.substring(valueStart+1, valueEnd);
                            var parsedValue = parseInt(value);
                            if (isNaN(parsedValue)) {
                                node.status({fill:"red", shape:"ring", text:"Bad dim format, use dim(<value>)"});
                                return;
                            }

                            device.dim(value);
                            return;
                        }

                        node.status({fill:"red", shape:"ring", text:"Unknown command"});
                }
            }).catch(error => {
                node.status({fill:"red", shape:"ring", text:"Could not change device"});
            });

        });
    }

    function validateConfig(node, config) {

        node.status({fill:"red", shape:"ring", text:"Not configured"});

        if ((node._localId == undefined || !node._localId.trim()) ||
            (node._gateway == undefined) || 
            (node._gateway._ip == undefined || !node._gateway._ip.trim()) || 
            (node._gateway.credentials.accessToken == undefined || !node._gateway.credentials.accessToken.trim()))
        {
            node.status({fill:"red", shape:"ring", text:"Not configured"});
            return false;
        }

        node.status({fill:"red", shape:"ring", text:"Disconnected"});

        return true;
    }

    RED.nodes.registerType("telldus-device",DeviceNode);

	RED.httpAdmin.get('/telldus-local/common', function(request, response) {
        var filename = path.join(__dirname, 'telldus-common.js');
        response.sendFile(filename);
	});

    RED.httpAdmin.get("/devices/:ip/:accessToken", async function(request, response) {

        try {
            var configuration = {
                hostname: request.params.ip,
                accessToken: request.params.accessToken
            };

            var telldusGateway = new TelldusLocal(configuration);

            await telldusGateway.getDevices().then(devices => {
                var elements = [];
                devices.forEach(element => {
                    if (element._apiData.methods > 0)
                        elements.push({
                            label: element._apiData.name,
                            value: element._apiData.id
                        });
                });

                var output = elements.sort(function(a, b){
                    if (a.label < b.label) return -1;
                    if (b.label < a.label) return 1;
                    return 0;
                });

                response.json(output);
            })
            .catch(error => {
                response.status(500).send('Something went wrong');
            });   
        }
        catch (error) {
            response.status(500).send('Something went wrong');
        }
 
    });    
}

