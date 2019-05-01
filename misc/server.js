require('../js/utils/constants');
const readline = require('readline');

let WebSocketServer = require('websocket').server;
let http = require('http');

let server = http.createServer(function (request, response) {
});

server.listen(1337, function () {
});

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function (request) {
    let orders = [];
    let state;

    let con = request.accept(null, request.origin);

    con.on('message', function (message) {
        let msg = JSON.parse(message.utf8Data);

        if (msg.type === MSG_TO_SERVER.CONFIG) {
            state = msg.data.state;

            con.sendUTF(JSON.stringify({
                type: MSG_FROM_SERVER.ACK_CONFIG,
                data: {
                    status: ACK_CONFIG_STATUS.OK,
                    mode: msg.data.mode
                }
            }));
        } else if (msg.type === MSG_TO_SERVER.ORDER) {
            if (Math.random() < 0.7) {
                orders.push(msg.data);

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
            } else {
                con.sendUTF(JSON.stringify({
                    type: MSG_FROM_SERVER.ACK_ORDER,
                    data: {
                        status: ACK_ORDER_STATUS.ERROR,
                        msg: "Nah!"
                    }
                }));
            }
        } else if (msg.type === MSG_TO_SERVER.RESUME) {
            console.log("RESUME received");
        } else if (msg.type === MSG_TO_SERVER.PAUSE) {
            console.log("PAUSE received");
        } else if (msg.type === MSG_TO_SERVER.STOP) {
            console.log("STOP received");
        } else if (msg.type === MSG_TO_SERVER.ACK) {
            console.log("ACK received");
        } else if (msg.type === MSG_TO_SERVER.ERROR) {
            console.log("ERROR received");
        }
    });

    con.on('close', function (con) {
    });

    console.log("0: Timestep, 1: Action, 2: Log, 3: Statistics, 4: Send, 5: Clear");

    let ts = undefined;
    let actions = [];
    let logs = [];
    let stats = [];

    // Take my input as orders
    let stdin = process.openStdin();
    stdin.addListener("data", function (d) {
        let i = d.toString().trim().split(" ");

        if (i[0] === "0") {
            ts = parseInt(i[1]);
        } else if (i[0] === "1") {
            let t = parseInt(i[1]);

            if (t === SERVER_ACTIONS.MOVE) {
                actions.push({
                    type: SERVER_ACTIONS.MOVE,
                    data: {
                        robot_id: i[2],
                        robot_row: i[3],
                        robot_col: i[4],
                        robot_new_row: i[5],
                        robot_new_col: i[6]
                    }
                });
            } else if (t === SERVER_ACTIONS.BIND) {
                actions.push({
                    type: SERVER_ACTIONS.BIND,
                    data: {
                        robot_id: i[2],
                        robot_row: i[3],
                        robot_col: i[4],
                        facility_type: i[5],
                        facility_id: i[6]
                    }
                });
            } else if (t === SERVER_ACTIONS.UNBIND) {
                actions.push({
                    type: SERVER_ACTIONS.UNBIND,
                    data: {
                        robot_id: i[2],
                        robot_row: i[3],
                        robot_col: i[4],
                        facility_type: i[5],
                        facility_id: i[6]
                    }
                });
            } else if (t === SERVER_ACTIONS.LOAD) {
                actions.push({
                    type: SERVER_ACTIONS.LOAD,
                    data: {
                        robot_id: i[2],
                        robot_row: i[3],
                        robot_col: i[4],
                        rack_id: i[5],
                        rack_row: i[6],
                        rack_col: i[7]
                    }
                });
            } else if (t === SERVER_ACTIONS.OFFLOAD) {
                actions.push({
                    type: SERVER_ACTIONS.OFFLOAD,
                    data: {
                        robot_id: i[2],
                        robot_row: i[3],
                        robot_col: i[4],
                        rack_id: i[5],
                        rack_row: i[6],
                        rack_col: i[7]
                    }
                });
            }
        } else if (i[0] === "2") {
            let t = parseInt(i[1]);

            if (t === SERVER_LOGS.TASK_ASSIGNED) {
                logs.push({
                    type: SERVER_LOGS.TASK_ASSIGNED,
                    data: {
                        robot_id: i[2],
                        robot_row: i[3],
                        robot_col: i[4],
                        rack_id: i[5],
                        rack_row: i[6],
                        rack_col: i[7]
                    }
                });
            } else if (t === SERVER_LOGS.ITEM_DELIVERED) {
                logs.push({
                    type: SERVER_LOGS.ITEM_DELIVERED,
                    data: {
                        order_id: i[2],
                        item_id: i[3],
                        item_quantity: i[4]
                    }
                });
            } else if (t === SERVER_LOGS.ORDER_FULFILLED) {
                logs.push({
                    type: SERVER_LOGS.ITEM_DELIVERED,
                    data: {
                        order_id: i[2]
                    }
                });
            } else if (t === SERVER_LOGS.RACK_ADJUSTED) {
                logs.push({
                    type: SERVER_LOGS.RACK_ADJUSTED,
                    data: {
                        rack_id: i[2],
                        rack_row: i[3],
                        rack_col: i[4],
                        item_id: i[5],
                        item_quantity: i[6]
                    }
                });
            }
        } else if (i[0] === "3") {
            let k = parseInt(i[1]);
            let v = parseInt(i[2]);

            stats.push({
                key: k,
                value: v
            })
        } else if (i[0] === "4") {
            let m = JSON.stringify({
                type: MSG_FROM_SERVER.UPDATE,
                data: {
                    timestep: ts,
                    actions: actions,
                    logs: logs,
                    statistics: stats
                }
            });

            console.log("Sending:: " + m);

            con.sendUTF(m);

            stats = [];
            logs = [];
            actions = [];
        } else if (i[0] === "5") {
            stats = [];
            logs = [];
            actions = [];
        }
    });
});