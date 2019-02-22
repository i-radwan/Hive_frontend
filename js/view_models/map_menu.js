require("../utils/constants");
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
        console.log("Update the map h: " + height + " * w:" + width);

        let newMap = new Array(height);

        for (let i = 0; i < height; i++) {
            newMap[i] = new Array(width);
            for (let j = 0; j < width; j++) {
                newMap[i][j] = {
                    type: MAP_CELL.EMPTY
                };
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

        shouter.notifySubscribers(self.mapGrid, SHOUT_MAP_SIZE_CHANGED);
    };

    self.saveMap = function () {
        console.log("Save map");
        // TODO
    };

    self.loadMap = function () {
        console.log("Load map");
        // TODO
    };

    self.applyMapSize = function () {
        if (self.mapHeight() > 0 && self.mapWidth() > 0) {
            console.log("Apply map size");

            self.updateMap(self.mapHeight(), self.mapWidth(), self.mapGrid);
        }
    };

    self.mapWidth = ko.observable(MAP_INIT_WIDTH);
    self.mapHeight = ko.observable(MAP_INIT_HEIGHT);
    self.mapGrid = self.updateMap(self.mapHeight(), self.mapWidth());

    // Events
    shouter.subscribe(function (map) {
        self.mapHeight(map.length);
        self.mapWidth(map[0].length);
        self.mapGrid = map;
    }, self, SHOUT_MAP_TEMP_APPLIED);
};

module.exports = mapViewModel;