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

        if (msg.type === MSG_TO_SERVER.START) {
            state = msg.data.state;

            con.sendUTF(JSON.stringify({
                type: MSG_FROM_SERVER.ACK_START,
                data: {
                    status: ACK_START_STATUS.OK
                }
            }));
        } else if (msg.type === MSG_TO_SERVER.ORDER) {
            if (Math.random() < 0.7) {
                orders.push(msg.data);

                con.sendUTF(JSON.stringify({
                    type: MSG_FROM_SERVER.ACK_ORDER,
                    data: {
                        status: ACK_ORDER_STATUS.OK,
                    }
                }));

                console.log(JSON.stringify({
                    type: MSG_FROM_SERVER.ACK_ORDER,
                    data: {
                        status: ACK_ORDER_STATUS.OK,
                        order: {
                            id: msg.data.id,
                            type: msg.data.type,
                            gate_id: msg.data.gate_id,
                            rack_id: msg.data.rack_id,
                            items: msg.data.items,
                            start_timestep: msg.data.start_timestep,
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
            con.sendUTF(JSON.stringify({
                type: MSG_FROM_SERVER.ACK_RESUME,
                data: {
                    status: ACK_RESUME_STATUS.OK,
                    msg: "Nah!"
                }
            }));
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

    console.log("0: Timestep, 1: Action, 2: Log, 3: Statistics, 4: Send, 5: Clear, 6: Msg");

    let ts = 0;
    let actions = [];
    let logs = [];
    let stats = [];

    // Take my input as orders
    let stdin = process.openStdin();
    stdin.addListener("data", function (d) {
        let i = d.toString().trim().split(" ");

        if (parseInt(i[0]) === 0) {
            ts = parseInt(i[1]);
        } else if (parseInt(i[0]) === 1) {
            let t = parseInt(i[1]);

            if (t === SERVER_ACTIONS.MOVE) {
                actions.push({
                    type: SERVER_ACTIONS.MOVE,
                    data: {
                        id: parseInt(i[2])
                    }
                });
            } else if (t === SERVER_ACTIONS.ROTATE_RIGHT) {
                actions.push({
                    type: SERVER_ACTIONS.ROTATE_RIGHT,
                    data: {
                        id: parseInt(i[2])
                    }
                });
            } else if (t === SERVER_ACTIONS.ROTATE_LEFT) {
                actions.push({
                    type: SERVER_ACTIONS.ROTATE_LEFT,
                    data: {
                        id: parseInt(i[2])
                    }
                });
            } else if (t === SERVER_ACTIONS.RETREAT) {
                actions.push({
                    type: SERVER_ACTIONS.RETREAT,
                    data: {
                        id: parseInt(i[2])
                    }
                });
            } else if (t === SERVER_ACTIONS.BIND) {
                actions.push({
                    type: SERVER_ACTIONS.BIND,
                    data: {
                        id: parseInt(i[2])
                    }
                });
            } else if (t === SERVER_ACTIONS.UNBIND) {
                actions.push({
                    type: SERVER_ACTIONS.UNBIND,
                    data: {
                        id: parseInt(i[2])
                    }
                });
            } else if (t === SERVER_ACTIONS.LOAD) {
                actions.push({
                    type: SERVER_ACTIONS.LOAD,
                    data: {
                        id: parseInt(i[2])
                    }
                });
            } else if (t === SERVER_ACTIONS.OFFLOAD) {
                actions.push({
                    type: SERVER_ACTIONS.OFFLOAD,
                    data: {
                        id: parseInt(i[2])
                    }
                });
            }
        } else if (parseInt(i[0]) === 2) {
            let t = parseInt(i[1]);

            if (t === SERVER_LOGS.TASK_ASSIGNED) {
                logs.push({
                    type: SERVER_LOGS.TASK_ASSIGNED,
                    data: {
                        robot_id: parseInt(i[2]),
                        rack_id: parseInt(i[3]),
                    }
                });
            } else if (t === SERVER_LOGS.TASK_COMPLETED) {
                logs.push({
                    type: SERVER_LOGS.TASK_COMPLETED,
                    data: {
                        order_id: parseInt(i[2]),
                        rack_id: parseInt(i[3]),
                        items: [{
                            id: parseInt(i[4]),
                            quantity: parseInt(i[5])
                        }]
                    }
                });
            } else if (t === SERVER_LOGS.ORDER_FULFILLED) {
                logs.push({
                    type: SERVER_LOGS.ORDER_FULFILLED,
                    data: {
                        id: parseInt(i[2])
                    }
                });
            } else if (t === SERVER_LOGS.ORDER_ISSUED) {
                logs.push({
                    type: SERVER_LOGS.ORDER_ISSUED,
                    data: {
                        id: parseInt(i[2])
                    }
                });
            } else if (t === SERVER_LOGS.BATTERY_UPDATED) {
                logs.push({
                    type: SERVER_LOGS.ORDER_ISSUED,
                    data: {
                        id: parseInt(i[2]),
                        battery: parseFloat(i[3])
                    }
                });
            }
        } else if (parseInt(i[0]) === 3) {
            let k = i[1];
            let v = parseFloat(i[2]);

            stats.push({
                key: k,
                value: v
            })
        } else if (parseInt(i[0]) === 4) {
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
        } else if (parseInt(i[0]) === 5) {
            stats = [];
            logs = [];
            actions = [];
        } else if (parseInt(i[0]) === 6) {
            let t = parseInt(i[1]);

            let m = "";

            for (let j = 2; j < i.length; ++j) {
                m += i[j] + " ";
            }

            con.sendUTF(JSON.stringify({
                type: MSG_FROM_SERVER.MSG,
                data: {
                    type: t,
                    text: m
                }
            }));
        }
    });
});