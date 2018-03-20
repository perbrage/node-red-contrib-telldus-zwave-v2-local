var http = require('http');
var Promise = require('promise');
const TelldusLocal = require('telldus-local');

module.exports = function(RED) {
    function TelldusGatewayNode(n) {
        RED.nodes.createNode(this,n);
        this._ip = n.ip;
        var node = this;
    } 

    var configurations = {};

    RED.httpAdmin.post("/gateways/:id/:ip/:accessToken", function (request, response) {
        var id = request.params.id;

        var configuration = {
            hostname: request.params.ip,
            accessToken: request.params.accessToken
        };

        configurations[id] = configuration;
        response.json("gateway added");
    });

    RED.httpAdmin.get("/devices/:id", async function (request, response) {
        var id = request.params.id;

        var configuration = configurations[id];

        var telldus = new TelldusLocal(configuration);

        await telldus.getDevices().then(devices => {
            var elements = [];
            devices.forEach(element => {
                if (element._apiData.methods > 0)
                    elements.push({
                        label: element._apiData.name,
                        value: element._apiData.id
                    });
            });

            //Replace with proper sort?!
            var output = elements.sort(function(a, b){
                if (a.label < b.label) return -1;
                if (b.label < a.label) return 1;
                return 0;
            });

            response.json(output);
        });  

        //response.json(configurations[id]);
    });

    // async function getDevices(request, response) {

    //     var configuration = {
    //         hostname: request.params.ip,
    //         accessToken: configNode.credentials.accessToken
    //     };

    //     node._telldusLocal = new TelldusLocal(node._configuration);

    //     await node._telldusLocal.getDevices().then((devices) => {
    //         var elements = [];
    //         devices.forEach(element => {
    //             if (element._apiData.methods > 0)
    //                 elements.push({
    //                     label: element._apiData.name,
    //                     value: element._apiData.id
    //                 });
    //         });

    //         //Replace with proper sort?!
    //         var output = elements.sort(function(a, b){
    //             if (a.label < b.label) return -1;
    //             if (b.label < a.label) return 1;
    //             return 0;
    //         });

    //         response.json(output);
    //     });    
    // };


    RED.httpAdmin.post("/accessToken/:ip/:requestToken", async function(request, response) {
        await getAccessToken(request.params.ip, request.params.requestToken)
                .then(result => response.json(result))
                .catch(error => {
                    response.json(error);
                });
    });

    RED.httpAdmin.post("/requestToken/:ip", async function(request, response) {
        await getRequestToken(request.params.ip)
                .then(result => {
                    result.status = "success";
                    response.json(result);
                })
                .catch(error => {
                    response.json({"status" :"failed"});
                });
    });


    RED.nodes.registerType("telldus-gateway",TelldusGatewayNode, {
        credentials: {
            accessToken: {type:"text"}
        }
    });

    function getAccessToken(ip, token) {
        var content = '';
        var options = {
            host: ip,
            port: 80,
            path: '/api/token?token=' + token,
            method: 'GET',
            headers: {
                'User-Agent' : 'Safari/537.36'
            }
        };

        return new Promise(function(resolve, reject) {

            var request = http.request(options, function(response) {
                response.setEncoding("utf8");
        

                response.on("data", function (chunk) {
                    content += chunk;
                });
                
                response.on("end", function () {
                    resolve(JSON.parse(content));
                });
            });
        
            request.on("error", function (e) {
                var error = new Error("Could not find a Telldus v2 Gateway at configured IP");
                error.code = "ERR_COMMUNICATION_ERROR";
                reject(error);
            });
        
            request.end();
        });
    }

    function getRequestToken(ip) {

        var content = '';
        var formdata = 'app="node-red-contrib-telldus-zwave-v2-local';
        var options = {
            host: ip,
            port: 80,
            path: '/api/token',
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(formdata),
                'User-Agent' : 'Safari/537.36'
            }
        };

        return new Promise(function(resolve, reject) {

            var request = http.request(options, function(response) {
                response.setEncoding("utf8");

                if (response.statusCode != 200) {
                    var error = new Error('Could not communicate with the Telldus v2 Gateway at configured IP');
                    error.code = "ERR_COMMUNICATION_ERROR";
                    reject(error);
                }

                response.on("data", function (chunk) {
                    content += chunk;
                });
                
                response.on("end", function () {
                    resolve(JSON.parse(content));
                });
            });

            request.on('socket', function (socket) {
                socket.setTimeout(800);  
                socket.on('timeout', function() {
                    request.abort();
                    var error = new Error("Could not find a Telldus v2 Gateway at configured IP");
                    error.code = "ERR_COMMUNICATION_ERROR";
                    reject(error);
                });
            });

            request.on("error", function (e) {
                var error = new Error("Could not find a Telldus v2 Gateway at configured IP");
                error.code = "ERR_COMMUNICATION_ERROR";
                reject(error);
            });

            request.write(formdata);
            request.end();

        });

    }
}