require('../utils/constants');
let ko = require('knockout');

let tempViewModel = require('./temps_panel');
let mapViewModel = require('./map_panel');
let gateViewModel = require('./gate_panel');
let robotViewModel = require('./robot_panel');
let rackViewModel = require('./rack_panel');
let stationViewModel = require('./station_panel');
let obstacleViewModel = require('./obstacle_panel');
let orderViewModel = require('./order_panel');

let leftPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer, logger) {
    let self = this;

    self.activePanel = ko.observable(LEFT_PANEL.TEMPS);

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
     * Handles panel tiles clicks.
     *
     * @param id   The id of the clicked tile from the LEFT_PANEL enum.
     */
    self.toggle = function (id) {
        if (runningMode() === RUNNING_MODE.DESIGN) {
            if (id === LEFT_PANEL.TEMPS) {
                toggleTemps();
            } else if (id === LEFT_PANEL.MAP) {
                toggleMap();
            } else if (id === LEFT_PANEL.GATE) {
                toggleGate();
            } else if (id === LEFT_PANEL.RACK) {
                toggleRack();
            } else if (id === LEFT_PANEL.OBSTACLE) {
                toggleObstacle();
            } else if (id === LEFT_PANEL.ROBOT) {
                toggleRobot();
            } else if (id === LEFT_PANEL.STATION) {
                toggleStation();
            } else {
                return;
            }

            self.activePanel(id);
        } else {
            if (id === LEFT_PANEL.ORDER) {
                toggleOrder();

                self.activePanel(id);
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
            data: {
                type: MAP_CELL.GATE
            }
        });
    };

    let toggleRobot = function () {
        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HOVER,
            data: {
                type: MAP_CELL.ROBOT
            }
        });
    };

    let toggleRack = function () {
        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HOVER,
            data: {
                type: MAP_CELL.RACK
            }
        });
    };

    let toggleStation = function () {
        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HOVER,
            data: {
                type: MAP_CELL.STATION
            }
        });
    };

    let toggleObstacle = function () {
        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HOVER,
            data: {
                type: MAP_CELL.OBSTACLE
            }
        });
    };

    let toggleOrder = function () {
        gfxEventHandler({
            type: EVENT_TO_GFX.ESC
        });
    };

    self.handleCellClick = function (row, col) {
        if (runningMode() === RUNNING_MODE.DESIGN) {
            if (state.map.grid[row][col].facility === undefined && state.map.grid[row][col].robot === undefined) {
                switch (self.activePanel()) {
                    case LEFT_PANEL.GATE:
                        self.gateVM.add(row, col);
                        break;
                    case LEFT_PANEL.ROBOT:
                        self.robotVM.add(row, col);
                        break;
                    case LEFT_PANEL.RACK:
                        self.rackVM.add(row, col);
                        break;
                    case LEFT_PANEL.STATION:
                        self.stationVM.add(row, col);
                        break;
                    case LEFT_PANEL.OBSTACLE:
                        self.obstacleVM.add(row, col);
                        break;
                }
            } else {
                if (state.map.grid[row][col].robot !== undefined) {
                    self.activePanel(LEFT_PANEL.ROBOT);
                    self.robotVM.edit(row, col);
                } else if (state.map.grid[row][col].facility !== undefined) {
                    switch (state.map.grid[row][col].facility.type) {
                        case MAP_CELL.GATE:
                            self.activePanel(LEFT_PANEL.GATE);
                            self.gateVM.edit(row, col);
                            break;
                        case MAP_CELL.RACK:
                            self.activePanel(LEFT_PANEL.RACK);
                            self.rackVM.edit(row, col);
                            break;
                        case MAP_CELL.STATION:
                            self.activePanel(LEFT_PANEL.STATION);
                            self.stationVM.edit(row, col);
                            break;
                        case MAP_CELL.OBSTACLE:
                            self.activePanel(LEFT_PANEL.OBSTACLE);
                            self.obstacleVM.edit(row, col);
                            break;
                    }
                }
            }
        } else {
            if (state.map.grid[row][col].robot !== undefined) {
                self.activePanel(LEFT_PANEL.ROBOT);
                self.robotVM.fill(row, col);
            } else if (state.map.grid[row][col].facility !== undefined) {
                switch (state.map.grid[row][col].facility.type) {
                    case MAP_CELL.GATE:
                        self.activePanel(LEFT_PANEL.GATE);
                        self.gateVM.fill(row, col);
                        break;
                    case MAP_CELL.RACK:
                        self.activePanel(LEFT_PANEL.RACK);
                        self.rackVM.fill(row, col);
                        break;
                    case MAP_CELL.STATION:
                        self.activePanel(LEFT_PANEL.STATION);
                        self.stationVM.fill(row, col);
                        break;
                    case MAP_CELL.OBSTACLE:
                        self.activePanel(LEFT_PANEL.OBSTACLE);
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
            self.activePanel(LEFT_PANEL.EMPTY);
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

    self.handleEsc = function () {
        self.gateVM.handleEsc();
        self.robotVM.handleEsc();
        self.rackVM.handleEsc();
        self.stationVM.handleEsc();
        self.obstacleVM.handleEsc();

        self.activePanel(LEFT_PANEL.EMPTY);
    };

    // Listen for mode change
    runningMode.subscribe(function (newRunningMode) {
        if (newRunningMode !== RUNNING_MODE.DESIGN) {
            self.activePanel(LEFT_PANEL.ORDER);
        } else {
            self.activePanel(LEFT_PANEL.TEMPS);
        }
    });
};

module.exports = leftPanelViewModel;