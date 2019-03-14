require('../utils/constants');
let ko = require('knockout');

let robotViewModel = function (shouter, state, gfxEventHandler) {
    let self = this;

    self.id = ko.observable(1);
    self.color = ko.observable("#FF0000");
    self.loadCap = ko.observable(100);
    self.batteryCap = ko.observable(10000);
    self.ip = ko.observable("");

    self.applyVisible = ko.observable(false);
    self.activeRobotRow = -1;
    self.activeRobotCol = -1;

    self.add = function (row, col) {
        if (state.map.grid[row][col].robot === undefined && self.activeRobotRow === -1 && self.activeRobotCol === -1) {
            if (!self.check()) {
                return;
            }

            state.map.grid[row][col].robot = {
                id: parseInt(self.id()),
                color: self.color(),
                load_cap: parseInt(self.loadCap()),
                battery_cap: parseInt(self.batteryCap()),
                ip: self.ip()
            };

            self.id(parseInt(self.id()) + 1);

            shouter.notifySubscribers({text: "Robot placed successfully!", type: MSG_INFO}, SHOUT_MSG);

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_ADD,
                object: MAP_CELL.ROBOT,
                row: row,
                col: col,
                id: parseInt(self.id()),
                load_cap: parseInt(self.loadCap()),
                battery_cap: parseInt(self.batteryCap()),
                color: self.color(),
                ip: self.ip()
            });
        } else if (state.map.grid[row][col].robot !== undefined && self.activeRobotRow === -1 && self.activeRobotCol === -1) {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        } else if (state.map.grid[row][col].robot === undefined && self.activeRobotRow !== -1 && self.activeRobotCol !== -1) {
            gfxEventHandler({
                type: GFX_EVENT_TYPE.ESC
            });
        }
    };

    self.move = function (srcRow, srcCol, dstRow, dstCol) {
        // TODO (ALERT): this would certainly cause an error if robot 2 is moving
        // to the old cell of robot 1, but the message of robot 2 arrives first from the
        // gfxEventHandler
        state.map.grid[dstRow][dstCol].robot = Object.assign({}, state.map.grid[srcRow][srcCol].robot);
        state.map.grid[srcRow][srcCol].robot = undefined;
    };

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.grid[dstRow][dstCol].robot === undefined) {
            state.map.grid[dstRow][dstCol].robot = Object.assign({}, state.map.grid[srcRow][srcCol].robot);
            state.map.grid[srcRow][srcCol].robot = undefined;

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DRAG,
                object: MAP_CELL.ROBOT,
                src_row: srcRow,
                src_col: srcCol,
                dst_row: dstRow,
                dst_col: dstCol
            });
        } else {
            shouter.notifySubscribers({
                text: "(" + dstRow + ", " + dstCol + ") is occupied!",
                type: MSG_ERROR
            }, SHOUT_MSG);

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DRAG,
                object: MAP_CELL.ROBOT,
                src_row: srcRow,
                src_col: srcCol,
                dst_row: srcRow,
                dst_col: srcCol
            });
        }
    };

    self.delete = function (row, col) {
        if (state.map.grid[row][col].robot !== undefined) {
            state.map.grid[row][col].robot = undefined;

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DELETE,
                object: MAP_CELL.ROBOT,
                row: row,
                col: col
            });

            self.unselect();

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

        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.ROBOT,
            row: row,
            col: col
        });
    };

    self.edit = function (row, col) {
        self.fill(row, col);
        self.applyVisible(true);
        self.activeRobotRow = row;
        self.activeRobotCol = col;

        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.ROBOT,
            row: row,
            col: col
        });
    };

    self.update = function () {
        if (!self.check()) { // ToDo: this will cause an issue if the ID didn't change
            return false;
        }

        state.map.grid[self.activeRobotRow][self.activeRobotCol].robot = {
            type: MAP_CELL.ROBOT,
            id: parseInt(self.id()),
            color: self.color(),
            load_cap: parseInt(self.loadCap()),
            battery_cap: parseInt(self.batteryCap()),
            ip: self.ip()
        };

        shouter.notifySubscribers({text: "Robot updated successfully!", type: MSG_INFO}, SHOUT_MSG);

        self.unselect();

        gfxEventHandler({
            type: GFX_EVENT_TYPE.ESC
        });

        return true;
    };

    self.check = function () {
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

        // Duplicate ID check
        for (let i = 0; i < state.map.height; ++i) {
            for (let j = 0; j < state.map.width; ++j) {
                let c = state.map.grid[i][j].robot;

                if (c !== undefined && c.id === parseInt(self.id())) {
                    shouter.notifySubscribers({text: "Robot ID must be unique!", type: MSG_ERROR}, SHOUT_MSG);

                    return false;
                }
            }
        }

        // -ve values
        if (parseInt(self.id()) < 0 || parseInt(self.batteryCap()) < 0 || parseInt(self.loadCap()) < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // HTML color
        if (!self.color().match(REG_HTML_COLOR)) {
            shouter.notifySubscribers({text: "Invalid color code!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.ip().length > 0 &&
            !self.ip().match(REG_IP)) {
            shouter.notifySubscribers({text: "Invalid IP address!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        return true;
    };

    self.unselect = function () {
        self.activeRobotRow = self.activeRobotCol = -1;
        self.applyVisible(false);
    };

    self.handleEsc = function () {
        self.unselect();
    };
};

module.exports = robotViewModel;