require('../js/utils/constants');

let WebSocketServer = require('websocket').server;
let http = require('http');

let server = http.createServer(function (request, response) {
    // process HTTP request. Since we're writing just WebSockets
    // server we don't have to implement anything.
});
server.listen(1337, function () {
});

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function (request) {
    let con = request.accept(null, request.origin);

    con.on('open', function () {
        console.log("Hello!");
    });

    con.on('message', function (message) {
        let msg = JSON.parse(message.utf8Data);

        if (msg.type === MSG_TO_SERVER.CONFIG) {
            con.sendUTF(JSON.stringify({
                type: MSG_FROM_SERVER.ACK_CONFIG,
                data: {
                    status: ACK_CONFIG_STATUS.OK,
                    mode: msg.data.mode
                }
            }));
        } else if (msg.type === MSG_TO_SERVER.ORDER) {
            con.sendUTF(JSON.stringify({
                type: MSG_FROM_SERVER.ACK_ORDER,
                data: {
                    status: ACK_ORDER_STATUS.OK,
                    order: {
                        id: msg.data.id,
                        gate_id: msg.data.gate_id,
                        items: msg.data.items,
                        start_time: msg.data.start_time,
                        mode: msg.data.mode
                    }
                }
            }));
        }
    });

    con.on('close', function (con) {
    });
});