const TelldusLocal = require('telldus-local');

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

        node._telldusLocal = new TelldusLocal(this._configuration);
        node._telldusLocal.getDevice(node._localId)
            .then(device => {
                node.status({fill:"green", shape:"ring", text:"Connected"});
            })
            .catch(error => {
                node.status({fill:"red", shape:"ring", text:"Could not connect"});
            });

        node.on('input', function(msg) {

            node._telldusLocal.getDevice(node._localId).then((device) => {
                if (msg.payload == 'off') {
                    device.turnOff();
                } else if (msg.payload == 'on') {
                    device.turnOn();
                }
            }).catch(error => {
                node.status({fill:"red", shape:"ring", text:"Could not change device"});
            });

        });
    }

    function validateConfig(node, config) {

        if ((node._localId == undefined || !node._localId.trim()) || 
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
}
