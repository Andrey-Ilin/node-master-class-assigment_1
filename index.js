/*
*Primary file for API
*
*/

const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');

const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

httpServer.listen(config.port, () => {
    console.log(`Server is listening on port ${config.port} in ${config.envName} mode`)
});

const unifiedServer = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');
    const queryStringObject = parsedUrl.query;
    const method = req.method.toLowerCase();
    const headers = req.headers;
    const decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();

        //Choose the handler this request should do
        const choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        //Construct data object to send to the handler
        const data = {
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            method: method,
            headers: headers,
            payload: buffer
        };

        //Route the request to the handler specified in the router
        choosenHandler(data, (statusCode, payload) => {
            //Use the status code defined by handler, or default 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            //Use the payload defined by the handler or default empty object
            payload = typeof(payload) == 'object' ? payload : {};

            //Convert payload to string
            const payloadString = JSON.stringify(payload);

            //Return response
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            //Log the request
            console.log('Returning this response: ', statusCode, payloadString);
        });
    });
};

const handlers = {};

handlers.hello = (data, callback) => {
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
const router = {
    'hello': handlers.hello
};
