

module.exports = function(RED) {
    function TelldusGatewayNode(n) {
        RED.nodes.createNode(this,n);
        this._ip = n.ip;
    } 

    RED.nodes.registerType("telldus-gateway",TelldusGatewayNode, {
        credentials: {
            accessToken: {type:"text"}
        }
    });
}