/*
*Primary file for API
*
*/

var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');

var httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});

httpServer.listen(config.port, function () {
    console.log("Server is listening on port " + config.port + " in " + config.envName + " mode")
});

var unifiedServer = function (req, res) {
    var parsedUrl = url.parse(req.url, true);
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');
    var queryStringObject = parsedUrl.query;
    var method = req.method.toLowerCase();
    var headers = req.headers;
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', function (data) {
        buffer += decoder.write(data);
    });
    req.on('end', function () {
        buffer += decoder.end();

        //Choose the handler this request should do
        var choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        //Construct data object to send to the handler
        var data = {
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            method: method,
            headers: headers,
            payload: buffer
        };

        //Route the request to the handler specified in the router
        choosenHandler(data, function (statusCode, payload) {
            //Use the status code defined by handler, or default 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            //Use the payload defined by the handler or default empty object
            payload = typeof(payload) == 'object' ? payload : {};

            //Convert payload to string
            var payloadString = JSON.stringify(payload);

            //Return response
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            //Log the request
            console.log('Returning this response: ', statusCode, payloadString);
        });
    });
};

var handlers = {};

handlers.hello = function(data, callback) {
    console.log(data);
    callback(200, {
        message: "Hi!!! This is Node.js Server!!!",
        trimmedPath: data.trimmedPath,
        method: data.method,
        requestHeaders: data.headers,
        requestQuery: data.queryStringObject,
        requestPayload: data.payload
    });
};

// Not found handler
handlers.notFound = function (data, callback) {
    callback(404, {message: "Hey!!! this route wasn't found, please use '/hello'"})
};

// Define a request routing
var router = {
    'hello': handlers.hello
};
