require("../utils/constants");
let ko = require('knockout');
let tempViewModel = require('./temps_menu');
let mapViewModel = require('./map_menu');
let entryViewModel = require('./entry_menu');
let robotViewModel = require('./robot_menu');
let rackViewModel = require('./rack_menu');
let parkViewModel = require('./park_menu');
let obstacleViewModel = require('./obstacle_menu');
let orderViewModel = require('./order_menu');

let leftMenuViewModel = function (runningMode, shouter, map) {
    let self = this;

    self.activeMenu = ko.observable(LEFT_MENU.TEMPS);

    /**
     * Handles menu tiles clicks.
     *
     * @param id   The id of the clicked tile from the LEFT_MENU enum.
     */
    self.menuItemClicked = function (id) {
        if (runningMode() === RUNNING_MODE.DESIGN) {
            if (id === LEFT_MENU.TEMPS) {
                self.tempsClicked();
            } else if (id === LEFT_MENU.MAP) {
                self.mapClicked();
            } else if (id === LEFT_MENU.ENTRY) {
                self.entryClicked();
            } else if (id === LEFT_MENU.RACK) {
                self.rackClicked();
            } else if (id === LEFT_MENU.OBSTACLE) {
                self.obstacleClicked();
            } else if (id === LEFT_MENU.ROBOT) {
                self.robotClicked();
            } else if (id === LEFT_MENU.PARK) {
                self.parkClicked();
            } else {
                return;
            }

            self.activeMenu(id);
        } else {
            if (id === LEFT_MENU.ORDER) {
                self.orderClicked();
                self.activeMenu(id);
            }
        }
    };

    self.tempsClicked = function () {

    };

    self.mapClicked = function () {

    };

    self.entryClicked = function () {

    };

    self.robotClicked = function () {

    };

    self.rackClicked = function () {

    };

    self.parkClicked = function () {

    };

    self.obstacleClicked = function () {

    };

    self.orderClicked = function () {

    };

    // Sub view models
    self.tempVM = new tempViewModel(shouter, map);
    self.mapVM = new mapViewModel(shouter, map);
    self.entryVM = new entryViewModel(shouter, map);
    self.robotVM = new robotViewModel(shouter, map);
    self.rackVM = new rackViewModel(shouter, map);
    self.parkVM = new parkViewModel(shouter, map);
    self.obstacleVM = new obstacleViewModel(shouter, map);
    self.orderVM = new orderViewModel(shouter, map);

    // Listen for mode change
    runningMode.subscribe(function (newRunningMode) {
        if (newRunningMode !== RUNNING_MODE.DESIGN) {
            self.activeMenu(LEFT_MENU.ORDER);
        } else {
            self.activeMenu(LEFT_MENU.TEMPS);
        }
    });

    // Outside events
    self.handleCellClick = function (row, col) {
        if (runningMode() === RUNNING_MODE.DESIGN) {
            if (map.grid[row][col].type === MAP_CELL.EMPTY) {
                switch (self.activeMenu()) {
                    case LEFT_MENU.ENTRY:
                        self.entryVM.addEntry(row, col);
                        break;
                    case LEFT_MENU.ROBOT:
                        self.robotVM.addRobot(row, col);
                        break;
                    case LEFT_MENU.RACK:
                        self.rackVM.addRack(row, col);
                        break;
                    case LEFT_MENU.PARK:
                        self.parkVM.addPark(row, col);
                        break;
                    case LEFT_MENU.OBSTACLE:
                        self.obstacleVM.addObstacle(row, col);
                        break;
                }
            } else {
                switch (map.grid[row][col].type) {
                    case MAP_CELL.ENTRY:
                        self.activeMenu(LEFT_MENU.EMPTY);
                        break;
                    case MAP_CELL.ROBOT:
                        self.activeMenu(LEFT_MENU.ROBOT);
                        self.robotVM.editRobot(row, col);
                        break;
                    case MAP_CELL.RACK:
                        self.activeMenu(LEFT_MENU.RACK);
                        self.rackVM.editRack(row, col);
                        break;
                    case MAP_CELL.PARK:
                        self.activeMenu(LEFT_MENU.EMPTY);
                        break;
                    case MAP_CELL.OBSTACLE:
                        self.activeMenu(LEFT_MENU.EMPTY);
                        break;
                }
            }
        } else {
            switch (map.grid[row][col].type) {
                case MAP_CELL.ENTRY:
                    self.activeMenu(LEFT_MENU.EMPTY);
                    break;
                case MAP_CELL.ROBOT:
                    self.activeMenu(LEFT_MENU.ROBOT);
                    self.robotVM.fillFields(row, col);
                    break;
                case MAP_CELL.RACK:
                    self.activeMenu(LEFT_MENU.RACK);
                    self.rackVM.fillFields(row, col);
                    break;
                case MAP_CELL.PARK:
                    self.activeMenu(LEFT_MENU.EMPTY);
                    break;
                case MAP_CELL.OBSTACLE:
                    self.activeMenu(LEFT_MENU.EMPTY);
                    break;
            }
        }
    };

    self.handleCellDeleteClick = function (row, col) {
        switch (map.grid[row][col].type) {
            case MAP_CELL.ENTRY:
                self.entryVM.deleteEntry(row, col);
                break;
            case MAP_CELL.ROBOT:
                self.robotVM.deleteRobot(row, col);
                break;
            case MAP_CELL.RACK:
                self.rackVM.deleteRack(row, col);
                break;
            case MAP_CELL.PARK:
                self.parkVM.deletePark(row, col);
                break;
            case MAP_CELL.OBSTACLE:
                self.obstacleVM.deleteObstacle(row, col);
                break;
        }

        self.activeMenu(LEFT_MENU.EMPTY);
    };

    self.handleCellDrag = function (srcRow, srcCol, dstRow, dstCol) {
        switch (map.grid[srcRow][srcCol].type) {
            case MAP_CELL.ENTRY:
                self.entryVM.moveEntry(srcRow, srcCol, dstRow, dstCol);
                break;
            case MAP_CELL.ROBOT:
                self.robotVM.moveRobot(srcRow, srcCol, dstRow, dstCol);
                break;
            case MAP_CELL.RACK:
                self.rackVM.moveRack(srcRow, srcCol, dstRow, dstCol);
                break;
            case MAP_CELL.PARK:
                self.parkVM.movePark(srcRow, srcCol, dstRow, dstCol);
                break;
            case MAP_CELL.OBSTACLE:
                self.obstacleVM.moveObstacle(srcRow, srcCol, dstRow, dstCol);
                break;
        }
    };

    self.handleEsc = function () {
        self.activeMenu(LEFT_MENU.EMPTY);
    };
};

module.exports = leftMenuViewModel;