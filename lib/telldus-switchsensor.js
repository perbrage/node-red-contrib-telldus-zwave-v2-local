const TelldusLocal = require('telldus-local');

module.exports = function(RED) {

    function SwitchSensorNode(config) {
        RED.nodes.createNode(this, config);
        this._localId = config.localId;
        this._name = config.name;
        this._interval = config.interval;
        this._gateway = RED.nodes.getNode(config.gateway);
        var node = this;

        RED.httpAdmin.post("/" + node.id + "/gateway/:nodeId", function(request, response) {
            var configNode = RED.nodes.getNode(request.params.nodeId);
            node._configuration = {
                hostname: configNode._ip,
                accessToken: configNode.credentials.accessToken
            };
            response.json(node.id);
        });
    
        RED.httpAdmin.get("/" + node.id + "/sensors", async function(request, response) {
            node._telldusLocal = new TelldusLocal(node._configuration);

            await node._telldusLocal.getDevices().then(devices => {
                var elements = [];
                devices.forEach(element => {
                    if (element._apiData.methods == 0)
                        elements.push({
                            label: element._apiData.name,
                            value: element._apiData.id
                        });
                });

            //     //Replace with proper sort?!
            //     // var output = elements.sort(function(a, b){
            //     //     if (a.label < b.label) return -1;
            //     //     if (b.label < a.label) return 1;
            //     //     return 0;
            //     // });
            //     //output = elements;
                response.json(elements);
             })
             .catch(error => {
                 response.json(error);
             });
        });

        if (!validateConfig(node, config))
            return;
            
        node._configuration = {
                hostname: node._gateway._ip,
                accessToken: node._gateway.credentials.accessToken
            };

        node._telldusLocal = new TelldusLocal(node._configuration);

        node._telldusLocal.getSensor(node._localId)
            .then(sensor => {
                node.status({fill:"green", shape:"ring", text:"Connected"});
                node._intervalObj = setInterval(checkData.bind(null, node, sensor), node._interval * 1000);
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

    async function checkData(node, sensor) {

        await sensor.getInfo()
            .then(info => {
                node.send({"payload": info._apiData.data});
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
}

