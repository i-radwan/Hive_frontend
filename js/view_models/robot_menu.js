require("../utils/constants");
let ko = require('knockout');

let robotViewModel = function (shouter, map) {
    let self = this;

    self.id = ko.observable(1);
    self.color = ko.observable("#FF0000");
    self.loadCap = ko.observable(100);
    self.batteryCap = ko.observable(10000);
    self.ip = ko.observable("");

    self.addRobot = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.EMPTY) {
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
        } else {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        }
    };

    self.deleteRobot = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.ROBOT) {
            map.grid[row][col] = {
                type: MAP_CELL.EMPTY
            }
        }
    };

    self.moveRobot = function (srcRow, srcCol, dstRow, dstCol) {
        if (map.grid[dstRow][dstCol].type === MAP_CELL.EMPTY) {
            map.grid[dstRow][dstCol] = map.grid[srcRow][srcCol];
            map.grid[srcRow][srcCol] = {
                type: MAP_CELL.EMPTY
            }
        } else {
            shouter.notifySubscribers({
                text: "(" + dstRow + ", " + dstCol + ") is occupied!",
                type: MSG_ERROR
            }, SHOUT_MSG);
        }
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
};

module.exports = robotViewModel;