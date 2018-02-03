

module.exports = function(RED) {
    function TelldusGatewayNode(n) {
        RED.nodes.createNode(this,n);
        this.ip = n.ip;
        this.accessKey = n.accessKey;
    } 
    RED.nodes.registerType("telldus-gateway",TelldusGatewayNode);
}