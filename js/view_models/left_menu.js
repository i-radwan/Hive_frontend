require('../utils/constants');
let ko = require('knockout');

let tempViewModel = require('./temps_menu');
let mapViewModel = require('./map_menu');
let gateViewModel = require('./gate_menu');
let robotViewModel = require('./robot_menu');
let rackViewModel = require('./rack_menu');
let stationViewModel = require('./station_menu');
let obstacleViewModel = require('./obstacle_menu');
let orderViewModel = require('./order_menu');

let leftMenuViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer, logger) {
    let self = this;

    self.activeMenu = ko.observable(LEFT_MENU.TEMPS);

    // Sub view models
    self.tempVM = new tempViewModel(shouter, state, gfxEventHandler, sendToServer, logger);
    self.mapVM = new mapViewModel(shouter, state, gfxEventHandler, sendToServer, logger);
    self.gateVM = new gateViewModel(shouter, state, gfxEventHandler, sendToServer, logger);
    self.robotVM = new robotViewModel(shouter, state, gfxEventHandler, sendToServer, logger);
    self.rackVM = new rackViewModel(shouter, state, gfxEventHandler, sendToServer, logger);
    self.stationVM = new stationViewModel(shouter, state, gfxEventHandler, sendToServer, logger);
    self.obstacleVM = new obstacleViewModel(shouter, state, gfxEventHandler, sendToServer, logger);
    self.orderVM = new orderViewModel(shouter, state, gfxEventHandler, sendToServer, runningMode, logger);

    /**
     * Handles menu tiles clicks.
     *
     * @param id   The id of the clicked tile from the LEFT_MENU enum.
     */
    self.toggle = function (id) {
        if (runningMode() === RUNNING_MODE.DESIGN) {
            if (id === LEFT_MENU.TEMPS) {
                toggleTemps();
            } else if (id === LEFT_MENU.MAP) {
                toggleMap();
            } else if (id === LEFT_MENU.GATE) {
                toggleGate();
            } else if (id === LEFT_MENU.RACK) {
                toggleRack();
            } else if (id === LEFT_MENU.OBSTACLE) {
                toggleObstacle();
            } else if (id === LEFT_MENU.ROBOT) {
                toggleRobot();
            } else if (id === LEFT_MENU.STATION) {
                toggleStation();
            } else {
                return;
            }

            self.activeMenu(id);
        } else {
            if (id === LEFT_MENU.ORDER) {
                toggleOrder();

                self.activeMenu(id);
            }
        }
    };

    let toggleTemps = function () {
        gfxEventHandler({
            type: EVENT_TO_GFX.ESC
        });
    };

    let toggleMap = function () {
        gfxEventHandler({
            type: EVENT_TO_GFX.ESC
        });
    };

    let toggleGate = function () {
        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HOVER,
            object: MAP_CELL.GATE
        });
    };

    let toggleRobot = function () {
        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HOVER,
            object: MAP_CELL.ROBOT
        });
    };

    let toggleRack = function () {
        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HOVER,
            object: MAP_CELL.RACK
        });
    };

    let toggleStation = function () {
        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HOVER,
            object: MAP_CELL.STATION
        });
    };

    let toggleObstacle = function () {
        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HOVER,
            object: MAP_CELL.OBSTACLE
        });
    };

    let toggleOrder = function () {
        gfxEventHandler({
            type: EVENT_TO_GFX.ESC
        });
    };

    // Outside events
    self.handleCellClick = function (row, col) {
        if (runningMode() === RUNNING_MODE.DESIGN) {
            if (state.map.grid[row][col].facility === undefined && state.map.grid[row][col].robot === undefined) {
                switch (self.activeMenu()) {
                    case LEFT_MENU.GATE:
                        self.gateVM.add(row, col);
                        break;
                    case LEFT_MENU.ROBOT:
                        self.robotVM.add(row, col);
                        break;
                    case LEFT_MENU.RACK:
                        self.rackVM.add(row, col);
                        break;
                    case LEFT_MENU.STATION:
                        self.stationVM.add(row, col);
                        break;
                    case LEFT_MENU.OBSTACLE:
                        self.obstacleVM.add(row, col);
                        break;
                }
            } else {
                if (state.map.grid[row][col].robot !== undefined) {
                    self.activeMenu(LEFT_MENU.ROBOT);
                    self.robotVM.edit(row, col);
                } else if (state.map.grid[row][col].facility !== undefined) {
                    switch (state.map.grid[row][col].facility.type) {
                        case MAP_CELL.GATE:
                            self.activeMenu(LEFT_MENU.GATE);
                            self.gateVM.edit(row, col);
                            break;
                        case MAP_CELL.RACK:
                            self.activeMenu(LEFT_MENU.RACK);
                            self.rackVM.edit(row, col);
                            break;
                        case MAP_CELL.STATION:
                            self.activeMenu(LEFT_MENU.STATION);
                            self.stationVM.edit(row, col);
                            break;
                        case MAP_CELL.OBSTACLE:
                            self.activeMenu(LEFT_MENU.OBSTACLE);
                            self.obstacleVM.edit(row, col);
                            break;
                    }
                }
            }
        } else {
            if (state.map.grid[row][col].robot !== undefined) {
                self.activeMenu(LEFT_MENU.ROBOT);
                self.robotVM.fill(row, col);
            } else if (state.map.grid[row][col].facility !== undefined) {
                switch (state.map.grid[row][col].facility.type) {
                    case MAP_CELL.GATE:
                        self.activeMenu(LEFT_MENU.GATE);
                        self.gateVM.fill(row, col);
                        break;
                    case MAP_CELL.RACK:
                        self.activeMenu(LEFT_MENU.RACK);
                        self.rackVM.fill(row, col);
                        break;
                    case MAP_CELL.STATION:
                        self.activeMenu(LEFT_MENU.STATION);
                        self.stationVM.fill(row, col);
                        break;
                    case MAP_CELL.OBSTACLE:
                        self.activeMenu(LEFT_MENU.OBSTACLE);
                        self.obstacleVM.fill(row, col);
                        break;
                }
            }
        }
    };

    self.handleCellDeleteClick = function (row, col) {
        let status = false;

        if (state.map.grid[row][col].robot !== undefined) {
            status = self.robotVM.delete(row, col);
        } else if (state.map.grid[row][col].facility !== undefined) {
            switch (state.map.grid[row][col].facility.type) {
                case MAP_CELL.GATE:
                    status = self.gateVM.delete(row, col);
                    break;
                case MAP_CELL.RACK:
                    status = self.rackVM.delete(row, col);
                    break;
                case MAP_CELL.STATION:
                    status = self.stationVM.delete(row, col);
                    break;
                case MAP_CELL.OBSTACLE:
                    status = self.obstacleVM.delete(row, col);
                    break;
            }
        }

        // Hide details panel after delete is done
        if (status)
            self.activeMenu(LEFT_MENU.EMPTY);
    };

    self.handleCellDrag = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.grid[srcRow][srcCol].robot !== undefined) {
            self.robotVM.drag(srcRow, srcCol, dstRow, dstCol);
        } else if (state.map.grid[srcRow][srcCol].facility !== undefined) {
            switch (state.map.grid[srcRow][srcCol].facility.type) {
                case MAP_CELL.GATE:
                    self.gateVM.drag(srcRow, srcCol, dstRow, dstCol);
                    break;
                case MAP_CELL.RACK:
                    self.rackVM.drag(srcRow, srcCol, dstRow, dstCol);
                    break;
                case MAP_CELL.STATION:
                    self.stationVM.drag(srcRow, srcCol, dstRow, dstCol);
                    break;
                case MAP_CELL.OBSTACLE:
                    self.obstacleVM.drag(srcRow, srcCol, dstRow, dstCol);
                    break;
            }
        }
    };

    self.handleObjectMove = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.grid[srcRow][srcCol].robot !== undefined) {
            self.robotVM.move(srcRow, srcCol, dstRow, dstCol);
        } else if (state.map.grid[srcRow][srcCol].facility !== undefined) {
            switch (state.map.grid[srcRow][srcCol].type) {
                case MAP_CELL.GATE:
                    self.gateVM.move(srcRow, srcCol, dstRow, dstCol);
                    break;
                case MAP_CELL.RACK:
                    self.rackVM.move(srcRow, srcCol, dstRow, dstCol);
                    break;
                case MAP_CELL.STATION:
                    self.stationVM.move(srcRow, srcCol, dstRow, dstCol);
                    break;
                case MAP_CELL.OBSTACLE:
                    self.obstacleVM.move(srcRow, srcCol, dstRow, dstCol);
                    break;
            }
        }
    };

    self.handleEsc = function () {
        self.gateVM.handleEsc();
        self.robotVM.handleEsc();
        self.rackVM.handleEsc();
        self.stationVM.handleEsc();
        self.obstacleVM.handleEsc();

        self.activeMenu(LEFT_MENU.EMPTY);
    };

    // Listen for mode change
    runningMode.subscribe(function (newRunningMode) {
        if (newRunningMode !== RUNNING_MODE.DESIGN) {
            self.activeMenu(LEFT_MENU.ORDER);
        } else {
            self.activeMenu(LEFT_MENU.TEMPS);
        }
    });
};

module.exports = leftMenuViewModel;