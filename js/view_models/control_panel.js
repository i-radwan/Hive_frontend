require('../utils/constants');
let $ = require('jquery');
let ko = require('knockout');

let controlConsoleViewModel = function (runningMode, shouter, state, gfxEventHandler, comm, logger) {
    let self = this;

    self.settingsVisible = ko.observable(false);
    self.playing = ko.observable(false);
    self.msg = ko.observable("");
    self.msgType = ko.observable(MSG_INFO);
    self.timer = null;

    self.ip = ko.observable("");
    self.port = ko.observable("");

    self.preSimState = null;

    self.play = function () {
        if (self.playing()) {
            comm.send({
                type: MSG_TO_SERVER.PAUSE,
                data: {
                    mode: runningMode() === RUNNING_MODE.SIMULATE ? CONFIG_MODE.SIMULATE : CONFIG_MODE.DEPLOY
                }
            });

            logger({
                level: LOG_LEVEL_INFO,
                object: LOG_OBJECT_SIMULATION,
                msg: "Simulation Paused"
            });

            gfxEventHandler({
                type: EVENT_TO_GFX.SIMULATION_PAUSE
            });

            runningMode(RUNNING_MODE.PAUSE);
            self.playing(false);
        } else {
            sendStateToServer(CONFIG_MODE.SIMULATE);

            // ToDo: loading animation
        }
    };

    self.stop = function () {
        comm.send({
            type: MSG_TO_SERVER.STOP
        });

        logger({
            level: LOG_LEVEL_INFO,
            object: LOG_OBJECT_SIMULATION,
            msg: "Simulation Stopped"
        });

        gfxEventHandler({
            type: EVENT_TO_GFX.SIMULATION_STOP
        });

        runningMode(RUNNING_MODE.DESIGN);
        self.playing(false);

        state.load(self.preSimState);
        shouter.notifySubscribers({}, SHOUT_STATE_UPDATED);
    };

    self.deploy = function () {
        if (!prepare())
            return false;

        for (let i = 0; i < state.map.height; ++i) {
            for (let j = 0; j < state.map.width; ++j) {
                let c = state.map.grid[i][j];

                if (c.robot !== undefined && !c.robot.ip.match(REG_IP)) {
                    shouter.notifySubscribers({
                        text: "Robot at (" + (i + 1) + ", " + (j + 1) + ") doesn't have an IP!",
                        type: MSG_ERROR
                    }, SHOUT_MSG);

                    return false;
                }
            }
        }

        sendStateToServer(CONFIG_MODE.DEPLOY);
    };

    self.handleEsc = function () {
    };

    self.connect = function () {
        // ToDo connect to the server

        if (self.ip().length === 0 || !self.ip().match(REG_IP)) {
            shouter.notifySubscribers({text: "Invalid IP address!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.port().length === 0 || isNaN(self.port())) {
            shouter.notifySubscribers({text: "Invalid port!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        try {
            let d = comm.connect(self.ip(), self.port());

            if (d) {
                shouter.notifySubscribers({text: "Connected to server!", type: MSG_INFO}, SHOUT_MSG);

                return true;
            }
        } catch (e) {}

        shouter.notifySubscribers({text: "Couldn't connect to the server!", type: MSG_ERROR}, SHOUT_MSG);

        return false;
    };

    self.handleServerMsg = function (msg) {
        if (msg.type === MSG_FROM_SERVER.ACK_CONFIG) {
            let data = msg.data;

            if (data.status === ACK_CONFIG_STATUS.OK) {
                prepare();

                runningMode(data.mode);
                self.playing(true);

                logger({
                    level: LOG_LEVEL_INFO,
                    object: LOG_OBJECT_SIMULATION,
                    msg: "Simulation Started"
                });

                gfxEventHandler({
                    type: EVENT_TO_GFX.SIMULATION_START
                });

                // ToDo: hide the loading animation
            } else if (data.status === ACK_CONFIG_STATUS.ERROR) {
                shouter.notifySubscribers({text: data.msg, type: MSG_ERROR}, SHOUT_MSG);
            }
        } else if (msg.type === MSG_FROM_SERVER.ACK_RESUME) {
            let data = msg.data;

            if (data.status === ACK_RESUME_STATUS.OK) {
                runningMode(data.mode);
                self.playing(true);

                logger({
                    level: LOG_LEVEL_INFO,
                    object: LOG_OBJECT_SIMULATION,
                    msg: "Simulation Resumed"
                });

                gfxEventHandler({
                    type: EVENT_TO_GFX.SIMULATION_RESUME
                });

                // ToDo: hide the loading animation
            } else if (data.status === ACK_RESUME_STATUS.ERROR) {
                shouter.notifySubscribers({text: data.msg, type: MSG_ERROR}, SHOUT_MSG);
            }
        }
    };

    shouter.subscribe(function (msg) {
        self.msg(msg.text);
        self.msgType(msg.type);

        // Timer to auto-hide the message
        clearTimeout(self.timer);
        self.timer = setTimeout(() => {
            self.msg("")
        }, MSG_TIMEOUT);
    }, self, SHOUT_MSG);

    runningMode.subscribe(function (newRunningMode) {
    });

    let prepare = function () {
        // Fill the stock before simulation
        for (let i = 0; i < state.map.height; ++i) {
            for (let j = 0; j < state.map.width; ++j) {
                let c = state.map.grid[i][j].facility;

                if (c !== undefined && c.type === MAP_CELL.RACK) {
                    for (let i = 0; i < c.items.length; ++i) {
                        let it = c.items[i];

                        if (state.stock[it.id] === undefined) {
                            state.stock[it.id] = it.quantity;
                        } else {
                            state.stock[it.id] += it.quantity;
                        }
                    }
                }
            }
        }

        self.preSimState = Object.assign({}, state);
    };

    let sendStateToServer = function (mode) {
        if (!comm.connected) {
            shouter.notifySubscribers({text: "Connect to a server first!", type: MSG_ERROR}, SHOUT_MSG);
            
            return;
        }

        console.log(JSON.stringify(state, null, 2));

        if (runningMode() === RUNNING_MODE.DESIGN) {
            comm.send({
                type: MSG_TO_SERVER.CONFIG,
                data: {
                    mode: mode,
                    state: JSON.stringify(state, null, 2)
                }
            });
        } else if (runningMode() === RUNNING_MODE.PAUSE) {
            comm.send({
                type: MSG_TO_SERVER.RESUME
            });
        }
    };
};

module.exports = controlConsoleViewModel;