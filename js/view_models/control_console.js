require('../utils/constants');
let ko = require('knockout');

let controlConsoleViewModel = function (runningMode, shouter, state, gfxEventHandler, commSender) {
    let self = this;

    self.playing = ko.observable(false);
    self.msg = ko.observable("");
    self.msgType = ko.observable(MSG_INFO);
    self.timer = null;

    self.preSimState = null;

    self.play = function () {
        if (self.playing()) {
            runningMode(RUNNING_MODE.DESIGN);
            self.playing(false);

            // ToDo: set state = preSimState
            state.load(self.preSimState);
            informGFX();
        } else {
            if (!prepare())
                return false;

            sendState();

            runningMode(RUNNING_MODE.SIMULATE);
            self.playing(true);
        }
    };

    self.stop = function () {
        runningMode(RUNNING_MODE.DESIGN);
        self.playing(false);

        // ToDo: set state = preSimState
        state.load(self.preSimState);
        informGFX();
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

        sendState();

        runningMode(RUNNING_MODE.DEPLOY);
        self.playing(true);
    };

    self.handleEsc = function () {
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

        // ToDo: take copy of the state
        self.preSimState = Object.assign({}, state);

        return true;
    };

    let sendState = function () {
        console.log(JSON.stringify(state, null, 2));

        // TODO
        // commSender({
        //     type: SERVER_EVENT_TYPE.INIT,
        //     data: JSON.stringify(state, null, 2)
        // });
    };

    let informGFX = function () {
        // Inform GFX that the map changed
        gfxEventHandler({
            type: GFX_EVENT_TYPE.INIT,
            width: state.map.width,
            height: state.map.height
        });

        // Add objects GFX events
        for (let i = 0; i < state.map.height; i++) {
            for (let j = 0; j < state.map.width; j++) {
                let c = state.map.grid[i][j];

                if (c.robot !== undefined) {
                    gfxEventHandler({
                        type: GFX_EVENT_TYPE.OBJECT_ADD,
                        object: MAP_CELL.ROBOT,
                        row: i,
                        col: j,
                        id: c.robot.id,
                        load_cap: c.robot.loadCap,
                        battery_cap: c.robot.batteryCap,
                        color: c.robot.color,
                        ip: c.robot.ip
                    });
                } else if (c.facility !== undefined) {
                    switch (c.facility.type) {
                        case MAP_CELL.GATE:
                            gfxEventHandler({
                                type: GFX_EVENT_TYPE.OBJECT_ADD,
                                object: MAP_CELL.GATE,
                                row: i,
                                col: j
                            });
                            break;
                        case MAP_CELL.RACK:
                            gfxEventHandler({
                                type: GFX_EVENT_TYPE.OBJECT_ADD,
                                object: MAP_CELL.RACK,
                                row: i,
                                col: j,
                                capacity: c.facility.capacity,
                                items: c.facility.items
                            });
                            break;
                        case MAP_CELL.STATION:
                            gfxEventHandler({
                                type: GFX_EVENT_TYPE.OBJECT_ADD,
                                object: MAP_CELL.STATION,
                                row: i,
                                col: j
                            });
                            break;
                        case MAP_CELL.OBSTACLE:
                            gfxEventHandler({
                                type: GFX_EVENT_TYPE.OBJECT_ADD,
                                object: MAP_CELL.OBSTACLE,
                                row: i,
                                col: j
                            });
                            break;
                    }
                }
            }
        }
    };
};

module.exports = controlConsoleViewModel;