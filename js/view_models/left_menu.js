require("../utils/constants.js");
let ko = require('knockout');

let mapViewModel = function (shouter) {
    let self = this;

    /**
     * Changes map size.
     *
     * @param height    The new map height.
     * @param width     The new map width.
     * @param oldMap    The old map to take its cells values (the ones in the new grids area from top-left).
     */
    self.updateMap = function (height, width, oldMap = null) {
        let newMap = new Array(height);

        for (let i = 0; i < height; i++) {
            newMap[i] = new Array(width);
            for (let j = 0; j < width; j++) {
                newMap[i][j] = MAP_CELL.EMPTY;
            }
        }

        if (oldMap !== null) {
            for (let i = 0; i < Math.min(height, oldMap.length); i++) {
                for (let j = 0; j < Math.min(width, oldMap[i].length); j++) {
                    newMap[i][j] = oldMap[i][j];
                }
            }
        }

        self.mapGrid = newMap;

        shouter.notifySubscribers(self.mapGrid, SHOUT_MAP_CHANGED);
    };

    self.mapWidth = ko.observable(MAP_INIT_WIDTH);
    self.mapHeight = ko.observable(MAP_INIT_HEIGHT);
    self.mapGrid = self.updateMap(self.mapHeight, self.mapWidth);

    self.mapWidth.subscribe(function (newWidth) {
        self.updateMap(self.mapHeight, newWidth, self.mapGrid);
    });

    self.mapHeight.subscribe(function (newHeight) {
        self.updateMap(newHeight, self.mapWidth, self.mapGrid);
    });
};

let leftMenuViewModel = function (shouter) {
    let self = this;

    self.activeMenu = ko.observable(LEFT_MENU.TEMPS);
    self.runningMode = ko.observable(RUNNING_MODE.DESIGN);

    // Listen for mode change
    shouter.subscribe(function (runningMode) {
        self.runningMode = runningMode;
    }, self, SHOUT_RUNNING_MODE);

    //
    // Click events
    //

    /**
     * Handles menu tiles clicks.
     *
     * @param id   The id of the clicked tile from the LEFT_MENU enum.
     */
    self.menuItemClicked = function (id) {
        if (self.runningMode() === RUNNING_MODE.DESIGN) {
            if (id === LEFT_MENU.TEMPS) {
                self.tempsClicked();
            }
            else if (id === LEFT_MENU.MAP) {
                self.mapClicked();
            }
            else if (id === LEFT_MENU.ENTRY) {
                self.entryClicked();
            }
            else if (id === LEFT_MENU.RACK) {
                self.rackClicked();
            }
            else if (id === LEFT_MENU.OBSTACLE) {
                self.obstacleClicked();
            }
            else if (id === LEFT_MENU.ROBOT) {
                self.robotClicked();
            }
            else if (id === LEFT_MENU.PARK) {
                self.parkClicked();
            }
            else {
                return;
            }

            self.activeMenu(id);
        }
        else {
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
    mapViewModel(shouter);
};

module.exports = leftMenuViewModel;