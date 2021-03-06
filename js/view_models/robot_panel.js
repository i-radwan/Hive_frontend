const $ = require('jquery');
require('bootstrap');
require('bootstrap-colorpicker');

require('../utils/constants');
require('../utils/strings');
const ko = require('knockout');

/**
 * Robot view model.
 *
 * @param runningMode
 * @param shouter
 * @param state
 * @param gfxEventHandler
 * @param sendToServer
 * @param logger
 */
let robotPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer, logger) {
    let self = this;

    self.id = ko.observable(1);
    self.color = ko.observable("#FF0000");
    self.loadCap = ko.observable(ROBOT_INIT_LOAD_CAP);
    self.ip = ko.observable("");
    self.port = ko.observable("");
    self.deactivated = ko.observable(false);

    self.editing = ko.observable(false);
    self.activeRobotRow = -1;
    self.activeRobotCol = -1;

    self.showable = ko.observable(false); // In simulation mode, when robot is clicked
    self.active = ko.computed(function () {
        return self.showable() || runningMode() === RUNNING_MODE.DESIGN;
    });

    self.add = function (r, c) {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        let isRobotFree = state.map.isRobotFree(r, c);

        if (self.editing()) {
            if (isRobotFree) {
                shouter.notifySubscribers({}, SHOUT.ESC);
            }

            return;
        }

        if (isRobotFree) {
            if (!check()) {
                return;
            }

            let id = parseInt(self.id());

            state.map.addObject(r, c, {
                type: MAP_CELL.ROBOT,
                id: id,
                color: self.color(),
                direction: ROBOT_DIR.RIGHT,
                load_cap: parseInt(self.loadCap()),
                ip: self.ip(),
                port: self.port(),
                deactivated: false
            });

            let nextID = Math.max(state.nextIDs.robot, id + 1);

            self.id(nextID);
            state.nextIDs.robot = nextID;

            shouter.notifySubscribers({
                text: STR[1000](["Robot"]),
                type: MSG_TYPE.INFO,
                volatile: true
            }, SHOUT.MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_ADD,
                data: {
                    type: MAP_CELL.ROBOT,
                    id: id,
                    row: r,
                    col: c,
                    load_cap: parseInt(self.loadCap()),
                    color: self.color(),
                    ip: self.ip(),
                    port: self.port()
                }
            });
        } else {
            shouter.notifySubscribers({
                text: STR[2000]([r + 1, c + 1]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);
        }
    };

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (srcRow === dstRow && srcCol === dstCol)
            return;

        let rob = state.map.getRobot(srcRow, srcCol);

        if (state.map.isFree(dstRow, dstCol)) {
            state.map.moveObject(srcRow, srcCol, dstRow, dstCol, rob);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.ROBOT,
                    id: rob.id,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: dstRow,
                    dst_col: dstCol
                }
            });
        } else {
            shouter.notifySubscribers({
                text: STR[2000]([dstRow + 1, dstCol + 1]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.ROBOT,
                    id: rob.id,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: srcRow,
                    dst_col: srcCol
                }
            });
        }
    };

    self.delete = function (r, c) {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        let rob = state.map.getRobot(r, c);

        state.map.deleteObject(r, c, rob);

        unselect();
        clear();

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_DELETE,
            data: {
                type: MAP_CELL.ROBOT,
                id: rob.id,
                row: r,
                col: c
            }
        });

        return true;
    };

    self.fill = function (r, c) {
        let rob = state.map.getRobot(r, c); // Note: doesn't work well if there're multiple robots in a cell.

        if (rob === undefined)
            return;

        self.activeRobotRow = r;
        self.activeRobotCol = c;
        self.showable(true);

        self.id(rob.id);
        self.color(rob.color);
        self.loadCap(rob.load_cap);
        self.ip(rob.ip);
        self.port(rob.port);
        self.deactivated(rob.deactivated);

        $('.robot-color-preview').css("background", rob.color);

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HIGHLIGHT,
            data: {
                type: MAP_CELL.ROBOT,
                id: rob.id,
                row: r,
                col: c
            }
        });
    };

    self.edit = function (r, c) {
        self.editing(true);

        self.fill(r, c);
    };

    self.update = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        if (!check())
            return false;

        let rob = state.map.getRobot(self.activeRobotRow, self.activeRobotCol);

        let id = rob.id;

        state.map.updateObject(self.activeRobotRow, self.activeRobotCol, {
            type: MAP_CELL.ROBOT,
            id: id,
            color: self.color(),
            load_cap: parseInt(self.loadCap()),
            ip: self.ip(),
            port: self.port(),
            direction: ROBOT_DIR.RIGHT,
            deactivated: false
        });

        shouter.notifySubscribers({
            text: STR[1001](["Robot"]),
            type: MSG_TYPE.INFO,
            volatile: true
        }, SHOUT.MSG);

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_COLORIZE,
            data: {
                type: MAP_CELL.ROBOT,
                id: id,
                row: self.activeRobotRow,
                col: self.activeRobotCol,
                color: self.color()
            }
        });
    };

    self.move = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let rob = state.map.getSpecificRobot(r, c, id);

        rob.moving = true;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_MOVE,
            data: {
                id: id,
                row: r,
                col: c
            }
        });

        console.log("Robot #" + id + " moving started");
    };

    self.rotateRight = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_ROTATE_RIGHT,
            data: {
                id: id,
                row: r,
                col: c
            }
        });

        console.log("Robot #" + id + " rotating right started");
    };

    self.rotateLeft = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_ROTATE_LEFT,
            data: {
                id: id,
                row: r,
                col: c
            }
        });

        console.log("Robot #" + id + " rotating left started");
    };

    self.retreat = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_RETREAT,
            data: {
                id: id,
                row: r,
                col: c
            }
        });

        console.log("Robot #" + id + " retreating started");
    };

    self.bind = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let fac = state.map.getBindableFacility(r, c);
        let rob = state.map.getSpecificRobot(r, c, id);

        if (fac === undefined) {
            throw "Error: there should be facility here!";
        }

        fac.bound = true;
        fac.bound_to_id = id;

        rob.bound = true;
        rob.bound_to = fac.id;
        rob.bound_to_type = fac.type;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_BIND,
            data: {
                type: MAP_CELL.ROBOT,
                id: id,
                object_type: fac.type,
                object_id: fac.id,
                row: r,
                col: c
            }
        });

        if (fac.type === MAP_CELL.GATE) {
            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_COLORIZE,
                data: {
                    type: fac.type,
                    id: fac.id,
                    row: r,
                    col: c,
                    color: GFX_COLORS.GATE_BIND_COLOR
                }
            });

            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ROBOT,
                color: rob.color,
                msg: STR[3007]([rob.id, fac.id])
            });
        } else if (fac.type === MAP_CELL.STATION) {
            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_COLORIZE,
                data: {
                    type: fac.type,
                    id: fac.id,
                    row: r,
                    col: c,
                    color: GFX_COLORS.STATION_BIND_COLOR
                }
            });

            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ROBOT,
                color: rob.color,
                msg: STR[3009]([rob.id, fac.id])
            });
        }

        console.log("Robot #" + id + " bound to facility: " + fac.id);
    };

    self.unbind = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let fac = state.map.getBoundFacility(r, c);
        let rob = state.map.getSpecificRobot(r, c, id);

        if (fac === undefined) {
            throw "Error: there should be facility here!";
        }

        fac.bound = false;
        fac.bound_to_id = undefined;

        rob.bound = false;
        rob.bound_to = undefined;
        rob.bound_to_type = undefined;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_UNBIND,
            data: {
                type: MAP_CELL.ROBOT,
                id: id,
                object_type: fac.type,
                object_id: fac.id,
                row: r,
                col: c
            }
        });

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_DECOLORIZE,
            data: {
                type: fac.type,
                id: fac.id,
                row: r,
                col: c
            }
        });

        if (fac.type === MAP_CELL.GATE) {
            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ROBOT,
                color: rob.color,
                msg: STR[3008]([rob.id, fac.id])
            });
        } else if (fac.type === MAP_CELL.STATION) {
            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ROBOT,
                color: rob.color,
                msg: STR[3010]([rob.id, fac.id])
            });
        }

        console.log("Robot #" + id + " unbound from facility: " + fac.id);
    };

    self.load = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let fac = state.map.getSpecificFacility(r, c, MAP_CELL.RACK);
        let rob = state.map.getSpecificRobot(r, c, id);

        if (fac === undefined) {
            throw "Error: there should be facility here!";
        }

        fac.loaded = true;
        fac.robot_id = id;

        rob.loaded = true;
        rob.loaded_rack_id = fac.id;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_LOAD,
            data: {
                type: MAP_CELL.ROBOT,
                id: rob.id,
                object_type: fac.type,
                object_id: fac.id,
                row: r,
                col: c
            }
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: STR[3011]([rob.id, fac.id])
        });

        console.log("Robot #" + id + " loaded rack: " + fac.id);
    };

    self.offload = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let fac = state.map.getSpecificFacility(r, c, MAP_CELL.RACK);
        let rob = state.map.getSpecificRobot(r, c, id);

        if (fac === undefined) {
            throw "Error: there should be facility here!";
        }

        fac.loaded = false;
        fac.robot_id = undefined;

        rob.loaded = false;
        rob.loaded_rack_id = undefined;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_OFFLOAD,
            data: {
                type: MAP_CELL.ROBOT,
                id: rob.id,
                object_type: fac.type,
                object_id: fac.id,
                row: r,
                col: c
            }
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: STR[3012]([rob.id, fac.id])
        });

        console.log("Robot #" + id + " offloaded rack: " + fac.id);
    };

    self.assignTask = function (robotID, rackID, orderID) {
        let robPos = state.map.getObjectPos(robotID, MAP_CELL.ROBOT);

        let robR = robPos[0];
        let robC = robPos[1];

        let rob = state.map.getSpecificRobot(robR, robC, robotID);

        rob.assignedTask = true;

        let rackPos = state.map.getObjectPos(rackID, MAP_CELL.RACK);

        let rackR = rackPos[0];
        let rackC = rackPos[1];

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_COLORIZE,
            data: {
                type: MAP_CELL.RACK,
                id: rackID,
                row: rackR,
                col: rackC,
                color: rob.color
            }
        });

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_LED_COLORIZE,
            data: {
                type: MAP_CELL.ROBOT,
                id: robotID,
                row: robR,
                col: robC,
                mode: LED_COLOR_MODE.FLASH,
                color: GFX_COLORS.LED_BLUE_COLOR
            }
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: STR[3013]([robotID, rackID, orderID])
        });

        console.log("Robot #" + robotID + " assigned a task with rack: " + rackID + " for order: " + orderID);
    };

    self.completeTask = function (robotID, rackID) {
        let robPos = state.map.getObjectPos(robotID, MAP_CELL.ROBOT);

        let robR = robPos[0];
        let robC = robPos[1];

        let rob = state.map.getSpecificRobot(robR, robC, robotID);

        rob.assignedTask = false;

        let rackPos = state.map.getObjectPos(rackID, MAP_CELL.RACK);

        let rackR = rackPos[0];
        let rackC = rackPos[1];

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_DECOLORIZE,
            data: {
                type: MAP_CELL.RACK,
                id: rackID,
                row: rackR,
                col: rackC
            }
        });

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_LED_COLORIZE,
            data: {
                type: MAP_CELL.ROBOT,
                id: robotID,
                row: robR,
                col: robC,
                mode: LED_COLOR_MODE.OFF,
                color: GFX_COLORS.LED_BLUE_COLOR
            }
        });
    };

    /**
     * Listens for robot activate/deactivate button click.
     * Called from the main view model.
     */
    self.toggleActivation = function () {
        if (!self.deactivated()) { // Deactivate the robot
            sendToServer({
                type: MSG_TO_SERVER.CONTROL,
                data: {
                    id: parseInt(self.id()),
                    type: CONTROL_MSG.DEACTIVATE
                }
            });

            console.log("Robot #" + parseInt(self.id()) + " deactivation request sent");
        } else {
            sendToServer({
                type: MSG_TO_SERVER.CONTROL,
                data: {
                    id: parseInt(self.id()),
                    type: CONTROL_MSG.ACTIVATE
                }
            });

            console.log("Robot #" + parseInt(self.id()) + " activation request sent");
        }
    };

    self.stop = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_STOP,
            data: {
                type: MAP_CELL.ROBOT,
                id: id,
                row: r,
                col: c
            }
        });

        console.log("Robot #" + id + " stopped");
    };

    self.deactivate = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let rob = state.map.getSpecificRobot(r, c, id);

        rob.deactivated = true;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_FAILURE,
            data: {
                type: MAP_CELL.ROBOT,
                id: id,
                row: r,
                col: c
            }
        });

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_LED_COLORIZE,
            data: {
                type: MAP_CELL.ROBOT,
                id: id,
                row: r,
                col: c,
                mode: LED_COLOR_MODE.ON,
                color: GFX_COLORS.LED_RED_COLOR
            }
        });

        logger({
            level: LOG_LEVEL.ERROR,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: STR[4000]([rob.id])
        });

        if (id === parseInt(self.id())) { // Toggle button only if this is the selected robot
            self.deactivated(!self.deactivated());
        }

        console.log("Robot #" + id + " deactivated");
    };

    self.activate = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let rob = state.map.getSpecificRobot(r, c, id);

        rob.deactivated = false;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_FIXED,
            data: {
                type: MAP_CELL.ROBOT,
                id: id,
                row: r,
                col: c
            }
        });

        if (rob.assignedTask) {
            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_LED_COLORIZE,
                data: {
                    type: MAP_CELL.ROBOT,
                    id: id,
                    row: r,
                    col: c,
                    mode: LED_COLOR_MODE.FLASH,
                    color: GFX_COLORS.LED_BLUE_COLOR
                }
            });
        } else {
            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_LED_COLORIZE,
                data: {
                    type: MAP_CELL.ROBOT,
                    id: id,
                    row: r,
                    col: c,
                    mode: LED_COLOR_MODE.OFF,
                    color: GFX_COLORS.LED_RED_COLOR
                }
            });
        }

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: STR[3014]([rob.id])
        });

        if (id === parseInt(self.id())) { // Toggle button only if this is the selected robot
            self.deactivated(!self.deactivated());
        }

        console.log("Robot #" + id + " activated");
    };

    self.doneMoving = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);
        let r = pos[0];
        let c = pos[1];

        let rob = state.map.getSpecificRobot(r, c, id);

        let nr = r + ROW_DELTA[rob.direction];
        let nc = c + COL_DELTA[rob.direction];

        console.log("Robot #" + id + " new robot position: " + nr + " " + nc);

        state.map.moveObject(r, c, nr, nc, rob);

        rob.moving = false;

        if (rob.loaded) {
            let fac = state.map.getSpecificFacility(r, c, MAP_CELL.RACK);

            state.map.moveObject(r, c, nr, nc, fac);
        }
    };

    self.doneRotatingRight = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);
        let r = pos[0];
        let c = pos[1];

        let rob = state.map.getSpecificRobot(r, c, id);

        rob.direction = (rob.direction - 1 + ROBOT_DIR_CNT) % ROBOT_DIR_CNT;

        console.log("Robot #" + id + " new robot direction after rotating right: " + rob.direction);
    };

    self.doneRotatingLeft = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);
        let r = pos[0];
        let c = pos[1];

        let rob = state.map.getSpecificRobot(r, c, id);

        rob.direction = (rob.direction + 1) % ROBOT_DIR_CNT;

        console.log("Robot #" + id + " new robot direction after rotating left: " + rob.direction);
    };

    self.doneRetreating = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);
        let r = pos[0];
        let c = pos[1];

        let rob = state.map.getSpecificRobot(r, c, id);

        rob.direction = (rob.direction + 2) % ROBOT_DIR_CNT;

        if (!rob.moving) {
            let nr = r + ROW_DELTA[rob.direction];
            let nc = c + COL_DELTA[rob.direction];

            console.log("Moving Robot #" + id + ", due to retreating while the robot was not moving, to " +
                        " the new robot position: " + nr + " " + nc);

            state.map.moveObject(r, c, nr, nc, rob);

            if (rob.loaded) {
                let fac = state.map.getSpecificFacility(r, c, MAP_CELL.RACK);

                state.map.moveObject(r, c, nr, nc, fac);
            }
        }

        console.log("Robot #" + id + " new robot direction after retreating: " + rob.direction);
    };

    self.updateBattery = function (id, battery) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);
        let r = pos[0];
        let c = pos[1];

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_UPDATE,
            data: {
                type: MAP_CELL.ROBOT,
                id: id,
                row: r,
                col: c,
                battery: Math.min(10, battery) // ToDo
            }
        });

        if (battery < LOW_BATTERY_LEVEL) {
            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_LED_COLORIZE,
                data: {
                    type: MAP_CELL.ROBOT,
                    id: id,
                    row: r,
                    col: c,
                    mode: LED_COLOR_MODE.FLASH,
                    color: GFX_COLORS.LED_RED_COLOR
                }
            });
        } else {
            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_LED_COLORIZE,
                data: {
                    type: MAP_CELL.ROBOT,
                    id: id,
                    row: r,
                    col: c,
                    mode: LED_COLOR_MODE.OFF,
                    color: GFX_COLORS.LED_RED_COLOR
                }
            });
        }

        console.log("Robot #" + id + " new battery level: " + battery);
    };

    self.handleEsc = function () {
        unselect();
        clear();
    };

    let check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({
                text: STR[2001](["Robot ID"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.color().length === 0) {
            shouter.notifySubscribers({
                text: STR[2001](["Robot color"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.loadCap().length === 0) {
            shouter.notifySubscribers({
                text: STR[2001](["Robot load capacity"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0 || parseInt(self.loadCap()) < 0) {
            shouter.notifySubscribers({
                text: STR[2010](),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // Duplicate ID check
        let pos = state.map.getObjectPos(parseInt(self.id()), MAP_CELL.ROBOT);

        if (pos !== undefined && (pos[0] !== self.activeRobotRow || pos[1] !== self.activeRobotCol)) {
            shouter.notifySubscribers({
                text: STR[2002](["Robot ID"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // HTML color
        if (!self.color().match(REG_HTML_COLOR)) {
            shouter.notifySubscribers({
                text: STR[2006](["color code"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.ip().length > 0 && !self.ip().match(REG_IP)) {
            shouter.notifySubscribers({
                text: STR[2006](["IP address"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.port().length > 0 && isNaN(self.port())) {
            shouter.notifySubscribers({
                text: STR[2006](["port"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        return true;
    };

    let unselect = function () {
        self.activeRobotRow = self.activeRobotCol = -1;
        self.editing(false);
        self.showable(false);
    };

    let clear = function () {
        self.id(state.nextIDs.robot);
        self.color("#FF0000");
        $('.robot-color-preview').css("background", "#FF0000");
        self.loadCap(ROBOT_INIT_LOAD_CAP);
        self.ip("");
        self.port("");
    };

    // Events
    shouter.subscribe(function () {
        unselect();
        clear();
    }, self, SHOUT.STATE_UPDATED);

    // View configs
    $('#robot-color').colorpicker({
        customClass: "robot-color"
    });

    $('#robot-color').on('colorpickerChange', function (event) {
        let color = event.color.toString();

        $('.robot-color-preview').css("background", color);

        if (self.editing())
            return;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HOVER,
            data: {
                type: MAP_CELL.ROBOT,
                color: color
            }
        });
    });
};

module.exports = robotPanelViewModel;