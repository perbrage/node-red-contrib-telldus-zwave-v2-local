const TelldusLocal = require('telldus-local');
var path = require('path');

module.exports = function(RED) {

    function MetricSensorNode(config) {
        RED.nodes.createNode(this, config);
        this._localId = config.localId;
        this._name = config.name;
        this._interval = config.interval;
        //this._active = (config.active === null || typeof config.active === "undefined") || config.active;
        // this._active = true;
        this._gateway = RED.nodes.getNode(config.gateway);
        this._filter = config.filter;
        var node = this;

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

    MetricSensorNode.prototype.close = function() {
        if (this._intervalObj != null) {
            clearInterval(this._intervalObj);
        }
    };

    async function checkData(node, sensor) {

        // if (!node._active)
        //     return;

        await sensor.getInfo()
            .then(info => {

                var metrics = [];
                if (node._filter != "") {
                    var filters = node._filter.split(';');

                    info._apiData.data.forEach(metric => {
                        if (filters.indexOf(metric.name) > -1)
                            metrics.push(metric);
                        }); 

                } else {
                    metrics = info._apiData.data;
                }
                 
                var payload = {
                    "localId": node._localId,
                    "name": node._name,
                    "metrics" : metrics
                }

                node.send({"payload": payload});
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
    RED.nodes.registerType("telldus-metricsensor",MetricSensorNode);

	RED.httpAdmin.get('/telldus-local/common', function(request, response) {
        var filename = path.join(__dirname, 'telldus-common.js');
        response.sendFile(filename);
	});

    // RED.httpAdmin.post("/sensors/:id/:state", function(request, response) {
    //     var node = RED.nodes.getNode(request.params.id);
    //     var state = request.params.state;
    //     if (node !== null && typeof node !== "undefined" ) {
    //         if (state === "enable") {
    //             node._active = true;
    //         } else if (state === "disable") {
    //             node._active = false;
    //         }
    //         response.sendStatus(200);
    //     }
    //     else
    //         response.sendStatus(400);
    // });

    RED.httpAdmin.get("/metricSensors/:ip/:accessToken", async function(request, response) {

        var configuration = {
            hostname: request.params.ip,
            accessToken: request.params.accessToken
        };

        var telldusGateway = new TelldusLocal(configuration);

        await telldusGateway.getSensors().then(sensors => {
            var elements = [];

            sensors.forEach(element => {
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

