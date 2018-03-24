const TelldusLocal = require('telldus-local');

module.exports = function(RED) {

    function SwitchSensorNode(config) {
        RED.nodes.createNode(this, config);
        this._localId = config.localId;
        this._name = config.name;
        this._interval = config.interval;
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

        await device.getInfo()
            .then(info => {
                var status = '';

                if (info._apiData.state == 2)
                    status = 'on';
                else 
                    status = 'off';

                node.send({"payload": status});
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

