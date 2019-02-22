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
                id: self.id(),
                color: self.color(),
                load_cap: self.loadCap(),
                battery_cap: self.batteryCap(),
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

    // TODO: more checks
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

        return true;
    };
};

module.exports = robotViewModel;