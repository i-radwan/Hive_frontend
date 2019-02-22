require("../utils/constants");
let ko = require('knockout');

let robotViewModel = function (shouter, map) {
    let self = this;

    self.id = ko.observable();
    self.color = ko.observable();
    self.loadCap = ko.observable();
    self.batteryCap = ko.observable();
    self.ip = ko.observable();

    self.addRobot = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.EMPTY || map.grid[row][col].type === MAP_CELL.ROBOT) {
            map.grid[row][col] = {
                type: MAP_CELL.ROBOT,
                id: self.id(),
                color: self.color(),
                load_cap: self.loadCap(),
                battery_cap: self.batteryCap(),
                ip: self.ip()
            }
        } else {
            shouter.notifySubscribers("(" + row + ", " + col + ") is occupied!", SHOUT_ERROR);
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
            shouter.notifySubscribers("(" + dstRow + ", " + dstCol + ") is occupied!", SHOUT_ERROR);
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
};

module.exports = robotViewModel;