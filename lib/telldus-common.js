

function enableOrDisableForm(value, type) {
    if (value == '_ADD_') {
        $("#node-input-name").attr('disabled', 'disabled');
        $("#node-input-localId").attr('disabled', 'disabled');
        $("#node-lookup-localId").attr('disabled', 'disabled');
        $("#node-lookup-localId-icon").attr('disabled', 'disabled');
        if (type == "sensor")
            $("#node-input-interval").attr('disabled', 'disabled');
    } else {
        $("#node-input-name").removeAttr('disabled');
        $("#node-input-localId").removeAttr('disabled');
        $("#node-lookup-localId").removeAttr('disabled');
        $("#node-lookup-localId-icon").removeAttr('disabled');
        if (type == "sensor")
            $("#node-input-interval").removeAttr('disabled');
    }
}

function search(configNodeId, searchDelegate) {
    $("#node-lookup-localId-icon").removeClass('fa-search');
    $("#node-lookup-localId-icon").addClass('spinner');
    $("#node-lookup-localId").addClass('disabled');
    var configNode = RED.nodes.node(configNodeId);
    if (configNode.credentials) {
        searchDelegate({ "ip": configNode.ip, "accessToken": configNode.credentials.accessToken});
    }
    else {
        $.getJSON('gateway/' + configNodeId, function(response) {
            searchDelegate(response);
        })
        .error(function (error) {
            alert("Could not connected to gateway, check your gateway configuration!");
        });
    }
}

try {
    module.exports = {
        enableOrDisableForm: enableOrDisableForm,
        search: search
    };
}
catch (error) {}

try {
    telldusCommon = {
        enableOrDisableForm: enableOrDisableForm,
        search: search
    };
}
catch (error) {}


