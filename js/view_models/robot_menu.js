require("../utils/constants");
let ko = require('knockout');

let robotViewModel = function (shouter, map, gfxEventHandler) {
    let self = this;

    self.id = ko.observable(1);
    self.color = ko.observable("#FF0000");
    self.loadCap = ko.observable(100);
    self.batteryCap = ko.observable(10000);
    self.ip = ko.observable("");

    self.applyVisible = ko.observable(false);
    self.activeRobotRow = -1;
    self.activeRobotCol = -1;

    self.addRobot = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.EMPTY && self.activeRobotRow === -1 && self.activeRobotCol === -1) {
            if (!self.checkValid()) {
                return;
            }

            map.grid[row][col] = {
                type: MAP_CELL.ROBOT,
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
        } else if (map.grid[row][col].type !== MAP_CELL.EMPTY && self.activeRobotRow === -1 && self.activeRobotCol === -1) {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        } else if (map.grid[row][col].type === MAP_CELL.EMPTY && self.activeRobotRow !== -1 && self.activeRobotCol !== -1) {
            gfxEventHandler({
                type: GFX_EVENT_TYPE.ESC
            });
        }
    };

    self.moveRobot = function (srcRow, srcCol, dstRow, dstCol) {
        // TODO (ALERT): this would certainly cause an error if robot 2 is moving
        // to the old cell of robot 1, but the message of robot 2 arrives first from the
        // gfxEventHandler
        map.grid[dstRow][dstCol] = map.grid[srcRow][srcCol];
        map.grid[srcRow][srcCol] = {
            type: MAP_CELL.EMPTY
        };
    };

    self.dragRobot = function (srcRow, srcCol, dstRow, dstCol) {
        if (map.grid[dstRow][dstCol].type === MAP_CELL.EMPTY) {
            map.grid[dstRow][dstCol] = Object.assign({}, map.grid[srcRow][srcCol]);
            map.grid[srcRow][srcCol] = {
                type: MAP_CELL.EMPTY
            };

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

    self.deleteRobot = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.ROBOT) {
            map.grid[row][col] = {
                type: MAP_CELL.EMPTY
            };

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DELETE,
                object: MAP_CELL.ROBOT,
                row: row,
                col: col
            });

            self.clearSelection();

            return true;
        }

        return false;
    };

    self.fillFields = function (row, col) {
        let robot = map.grid[row][col];

        if (robot.type !== MAP_CELL.ROBOT)
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

    self.editRobot = function (row, col) {
        self.fillFields(row, col);
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

    self.updateRobot = function () {
        if (!self.checkValid()) {
            return;
        }

        map.grid[self.activeRobotRow][self.activeRobotCol] = {
            type: MAP_CELL.ROBOT,
            id: parseInt(self.id()),
            color: self.color(),
            load_cap: parseInt(self.loadCap()),
            battery_cap: parseInt(self.batteryCap()),
            ip: self.ip()
        };

        shouter.notifySubscribers({text: "Robot updated successfully!", type: MSG_INFO}, SHOUT_MSG);

        self.clearSelection();

        gfxEventHandler({
            type: GFX_EVENT_TYPE.ESC
        });
    };

    self.checkValid = function () {
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
        for (let i = 0; i < map.height; ++i) {
            for (let j = 0; j < map.width; ++j) {
                let c = map.grid[i][j];

                if (c.type === MAP_CELL.ROBOT && c.id === parseInt(self.id())) {
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

    self.clearSelection = function () {
        self.activeRobotRow = self.activeRobotCol = -1;
        self.applyVisible(false);
    };

    self.handleEsc = function () {
        self.clearSelection();
    };
};

module.exports = robotViewModel;