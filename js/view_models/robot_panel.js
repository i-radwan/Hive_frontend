require('../utils/constants');
let ko = require('knockout');

let robotPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer, logger) {
    let self = this;

    self.id = ko.observable(1);
    self.color = ko.observable("#FF0000");
    self.loadCap = ko.observable(100);
    self.batteryCap = ko.observable(10000);
    self.ip = ko.observable("");
    self.port = ko.observable("");

    self.applyVisible = ko.observable(false);
    self.activeRobotRow = -1;
    self.activeRobotCol = -1;

    self.add = function (row, col) {
        if (state.map.grid[row][col].robot === undefined && self.activeRobotRow === -1 && self.activeRobotCol === -1) {
            if (!check()) {
                return;
            }

            state.map.grid[row][col].robot = {
                id: parseInt(self.id()),
                color: self.color(),
                load_cap: parseInt(self.loadCap()),
                battery_cap: parseInt(self.batteryCap()),
                ip: self.ip(),
                port: self.port()
            };

            self.id(parseInt(self.id()) + 1);
            state.nextIDs.robot = Math.max(state.nextIDs.robot, parseInt(self.id()));

            shouter.notifySubscribers({text: "Robot placed successfully!", type: MSG_INFO}, SHOUT_MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_ADD,
                data: {
                    type: MAP_CELL.ROBOT,
                    row: row,
                    col: col,
                    id: parseInt(self.id()),
                    load_cap: parseInt(self.loadCap()),
                    battery_cap: parseInt(self.batteryCap()),
                    color: self.color(),
                    ip: self.ip(),
                    port: self.port()
                }
            });
        } else if (state.map.grid[row][col].robot !== undefined && self.activeRobotRow === -1 && self.activeRobotCol === -1) {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        } else if (state.map.grid[row][col].robot === undefined && self.activeRobotRow !== -1 && self.activeRobotCol !== -1) {
            gfxEventHandler({
                type: EVENT_TO_GFX.ESC
            });
        }
    };

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.grid[dstRow][dstCol].robot === undefined && state.map.grid[dstRow][dstCol].facility === undefined) {
            state.map.grid[dstRow][dstCol].robot = Object.assign({}, state.map.grid[srcRow][srcCol].robot);
            state.map.grid[srcRow][srcCol].robot = undefined;

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.ROBOT,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: dstRow,
                    dst_col: dstCol
                }
            });
        } else {
            shouter.notifySubscribers({
                text: "(" + dstRow + ", " + dstCol + ") is occupied!",
                type: MSG_ERROR
            }, SHOUT_MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.ROBOT,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: srcRow,
                    dst_col: srcCol
                }
            });
        }
    };

    self.delete = function (row, col) {
        if (state.map.grid[row][col].robot !== undefined) {
            state.map.grid[row][col].robot = undefined;

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DELETE,
                data: {
                    type: MAP_CELL.ROBOT,
                    row: row,
                    col: col
                }
            });

            unselect();
            clear();

            return true;
        }

        return false;
    };

    self.fill = function (row, col) {
        let robot = state.map.grid[row][col].robot;

        if (robot === undefined)
            return;

        self.id(robot.id);
        self.color(robot.color);
        self.loadCap(robot.load_cap);
        self.batteryCap(robot.battery_cap);
        self.ip(robot.ip);
        self.port(robot.port);

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HIGHLIGHT,
            data: {
                type: MAP_CELL.ROBOT,
                row: row,
                col: col
            }
        });
    };

    self.edit = function (row, col) {
        self.fill(row, col);
        self.applyVisible(true);
        self.activeRobotRow = row;
        self.activeRobotCol = col;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HIGHLIGHT,
            data: {
                type: MAP_CELL.ROBOT,
                row: row,
                col: col
            }
        });
    };

    self.update = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({text: "This action is allowed in design mode only!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (!check())
            return false;

        state.map.grid[self.activeRobotRow][self.activeRobotCol].robot = {
            type: MAP_CELL.ROBOT,
            id: parseInt(self.id()),
            color: self.color(),
            load_cap: parseInt(self.loadCap()),
            battery_cap: parseInt(self.batteryCap()),
            ip: self.ip(),
            port: self.port()
        };

        state.nextIDs.robot = Math.max(state.nextIDs.robot, parseInt(self.id()) + 1);

        shouter.notifySubscribers({text: "Robot updated successfully!", type: MSG_INFO}, SHOUT_MSG);

        unselect();
        clear();

        gfxEventHandler({
            type: EVENT_TO_GFX.ESC
        });
    };

    self.move = function (r, c, nr, nc) {
        state.map.grid[nr][nc].robot = Object.assign({}, state.map.grid[r][c].robot);
        state.map.grid[r][c].robot = undefined;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_MOVE,
            data: {
                row: r,
                col: c,
                new_row: nr,
                new_col: nc
            }
        });
    };

    self.bind = function (id, r, c) {
        let cell = state.map.grid[r][c];

        if (cell.facility === undefined) {
            throw "Error: there should be facility here!";
        }

        cell.facility.bound = true;
        cell.facility.bound_to_id = id;

        cell.robot.bound = true;
        cell.robot.bound_to = cell.facility.id;
        cell.robot.bound_to_type = cell.facility.type;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_BIND,
            data: {
                id: id,
                row: r,
                col: c,
                object_id: cell.facility.id,
                object_type: cell.facility.type
            }
        });

        if (cell.facility.type === MAP_CELL.GATE) {
            logger({
                level: LOG_LEVEL_INFO,
                object: LOG_OBJECT_ROBOT,
                color: cell.robot.color,
                msg: "Robot <b>(#" + cell.robot.id + ")</b> is bound to the Gate#<b>(" + cell.facility.id + ")</b>."
            });
        } else if (cell.facility.type === MAP_CELL.STATION) {
            logger({
                level: LOG_LEVEL_INFO,
                object: LOG_OBJECT_ROBOT,
                color: cell.robot.color,
                msg: "Robot <b>(#" + cell.robot.id + ")</b> is charging at Station#<b>(" + cell.facility.id + ")</b>."
            });
        }
    };

    self.unbind = function (id, r, c) {
        let cell = state.map.grid[r][c];

        if (cell.facility === undefined) {
            throw "Error: there should be facility here!";
        }

        cell.facility.bound = false;
        cell.facility.bound_to_id = undefined;

        cell.robot.bound = false;
        cell.robot.bound_to = undefined;
        cell.robot.bound_to_type = undefined;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_UNBIND,
            data: {
                id: id,
                row: r,
                col: c,
                object_id: cell.facility.id,
                object_type: cell.facility.type
            }
        });

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_DISCOLORIZE,
            data: {
                type: cell.facility.type,
                row: r,
                col: c
            }
        });

        if (cell.facility.type === MAP_CELL.GATE) {
            logger({
                level: LOG_LEVEL_INFO,
                object: LOG_OBJECT_ROBOT,
                color: cell.robot.color,
                msg: "Robot <b>(#" + cell.robot.id + ")</b> is released from the Gate#<b>(" + cell.facility.id + ")</b>."
            });
        } else if (cell.facility.type === MAP_CELL.STATION) {
            logger({
                level: LOG_LEVEL_INFO,
                object: LOG_OBJECT_ROBOT,
                color: cell.robot.color,
                msg: "Robot <b>(#" + cell.robot.id + ")</b> is leaving Station#<b>(" + cell.facility.id + ")</b>."
            });
        }
    };

    self.load = function (id, r, c) {
        let cell = state.map.grid[r][c];

        if (cell.facility === undefined || cell.facility.type !== MAP_CELL.RACK) {
            throw "Error: there should be a rack here!";
        }

        cell.facility.loaded = true;
        cell.facility.robot_id = id;

        cell.robot.loaded = true;
        cell.robot.loaded_rack_id = cell.facility.id;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_LOAD,
            data: {
                id: cell.facility.id,
                row: r,
                col: c
            }
        });

        logger({
            level: LOG_LEVEL_INFO,
            object: LOG_OBJECT_ROBOT,
            color: cell.robot.color,
            msg: "Robot <b>(#" + cell.robot.id + ")</b> loaded Rack#<b>(" + cell.facility.id + ")</b>."
        });
    };

    self.offload = function (id, r, c) {
        let cell = state.map.grid[r][c];

        if (cell.facility === undefined || cell.facility.type !== MAP_CELL.RACK) {
            throw "Error: there should be a rack here!";
        }

        cell.facility.loaded = false;
        cell.facility.robot_id = undefined;

        cell.robot.loaded = false;
        cell.robot.loaded_rack_id = undefined;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_OFFLOAD,
            data: {
                row: r,
                col: c,
                rack_id: cell.facility.id
            }
        });

        logger({
            level: LOG_LEVEL_INFO,
            object: LOG_OBJECT_ROBOT,
            color: cell.robot.color,
            msg: "Robot <b>(#" + cell.robot.id + ")</b> offloaded Rack#<b>(" + cell.facility.id + ")</b>."
        });
    };

    self.assignTask = function (robot_id, robot_row, robot_col, rack_id, rack_row, rack_col) {
        let cell = state.map.grid[robot_row][robot_col];

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_COLORIZE,
            data: {
                type: MAP_CELL.RACK,
                row: rack_row,
                col: rack_col,
                color: cell.robot.color
            }
        });

        logger({
            level: LOG_LEVEL_INFO,
            object: LOG_OBJECT_ROBOT,
            color: cell.robot.color,
            msg: "Robot <b>(#" + robot_id + ")</b> is assigned to Rack#<b>(" + rack_id + ")</b>."
        });
    };

    self.handleEsc = function () {
        unselect();
        clear();
    };

    let check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({text: "Robot ID is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.color().length === 0) {
            shouter.notifySubscribers({text: "Robot color is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.loadCap().length === 0) {
            shouter.notifySubscribers({text: "Robot load capacity is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.batteryCap().length === 0) {
            shouter.notifySubscribers({text: "Robot battery capacity is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0 || parseInt(self.batteryCap()) < 0 || parseInt(self.loadCap()) < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Duplicate ID check
        for (let i = 0; i < state.map.height; ++i) {
            for (let j = 0; j < state.map.width; ++j) {
                let c = state.map.grid[i][j].robot;

                if (c !== undefined && c.id === parseInt(self.id()) &&
                    !(i === self.activeRobotRow && j === self.activeRobotCol)) {
                    shouter.notifySubscribers({text: "Robot ID must be unique!", type: MSG_ERROR}, SHOUT_MSG);

                    return false;
                }
            }
        }

        // HTML color
        if (!self.color().match(REG_HTML_COLOR)) {
            shouter.notifySubscribers({text: "Invalid color code!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.ip().length > 0 && !self.ip().match(REG_IP)) {
            shouter.notifySubscribers({text: "Invalid IP address!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.port().length > 0 && isNaN(self.port())) {
            shouter.notifySubscribers({text: "Invalid Port!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        return true;
    };

    let unselect = function () {
        self.activeRobotRow = self.activeRobotCol = -1;
        self.applyVisible(false);
    };

    let clear = function () {
        self.id(state.nextIDs.robot);
        self.color("#FF0000");
        self.loadCap(100);
        self.batteryCap(10000);
        self.ip("");
        self.port("");
    };

    // Events
    shouter.subscribe(function () {
        unselect();
        clear();
    }, self, SHOUT_STATE_UPDATED);
};

module.exports = robotPanelViewModel;