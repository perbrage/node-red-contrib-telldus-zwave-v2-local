const TelldusLocal = require('telldus-local');
var path = require('path');

module.exports = function(RED) {

    function SwitchSensorNode(config) {
        RED.nodes.createNode(this, config);
        this._localId = config.localId;
        this._name = config.name;
        this._interval = config.interval;
        this._gateway = RED.nodes.getNode(config.gateway);
        // this._active = (config.active === null || typeof config.active === "undefined") || config.active;
        this._onlyStateChange = config.onlyStateChange;
        this._currentState = -1;
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
                node._intervalObj = setInterval(checkData.bind(null, node, device), node._interval * 1000);
            })
            .catch(error => {
                node.status({fill:"red", shape:"ring", text:"Could not connect"});
            });
    }

    SwitchSensorNode.prototype.close = function() {
        if (this._intervalObj != null) {
            clearInterval(this._intervalObj);
        }
    };

    async function checkData(node, device) {

        // if (!node._active)
        //     return;

        await device.getInfo()
            .then(info => {

                if (node._currentState == -1)
                {
                    node._currentState = info._apiData.state;
                    return;
                }
    
                if (node._onlyStateChange) {
                    if (node._currentState != info._apiData.state)
                    {
                        node._currentState = info._apiData.state;
    
                        var toState = '';
                        var fromState = '';
        
                        if (node._currentState == 2) {
                            toState = 'off';
                            fromState = 'on';
                        } else {
                            toState = 'on';
                            fromState = 'off';
                        }
    
                        var payload = { 
                            "localId": node.id,
                            "name": node.name,
                            "fromState": fromState,
                            "toState": toState
                        }
    
                        node.send({"payload": payload});
                    }
                } else {

                    node._currentState = info._apiData.state;

                    var state = '';
                    
                    if (info._apiData.state == 2) {
                        state = 'off';
                    } else {
                        state = 'on';
                    }

                    payload = { 
                        "localId": node._localId,
                        "name": node._name,
                        "state": state,
                    }

                    node.send({"payload": payload});
                }

            })
            .catch(error => {
                node.send({"payload": "Error retreiving sensor data"});
            });
    }

    function validateConfig(node, config) {

        node.status({fill:"red", shape:"ring", text:"Not configured"});

        if ((node._localId == undefined || !node._localId.trim()) ||
            (node._gateway == undefined) || 
            (node._gateway._ip == undefined || !node._gateway._ip.trim()) || 
            (node._interval == undefined || !node._interval.trim()) || 
            (node._gateway.credentials.accessToken == undefined || !node._gateway.credentials.accessToken.trim()))
        {
            node.status({fill:"red", shape:"ring", text:"Not configured"});
            return false;
        }

        node.status({fill:"red", shape:"ring", text:"Disconnected"});

        return true;
    }

    RED.nodes.registerType("telldus-switchsensor", SwitchSensorNode);

	RED.httpAdmin.get('/telldus-local/common', function(request, response) {
        var filename = path.join(__dirname, 'telldus-common.js');
        response.sendFile(filename);
	});

    RED.httpAdmin.get("/switchSensors/:ip/:accessToken", async function(request, response) {

        var configuration = {
            hostname: request.params.ip,
            accessToken: request.params.accessToken
        };

        var telldusGateway = new TelldusLocal(configuration);

        await telldusGateway.getDevices().then(devices => {
            var elements = [];
            devices.forEach(element => {
                if (element._apiData.methods == 0)
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
             response.json(error);
         });
    });

}

