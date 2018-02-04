

module.exports = function(RED) {
    function TelldusGatewayNode(n) {
        RED.nodes.createNode(this,n);
        this._ip = n.ip;
        this._accessToken = n.accessToken;
    } 
    RED.nodes.registerType("telldus-gateway",TelldusGatewayNode);
}