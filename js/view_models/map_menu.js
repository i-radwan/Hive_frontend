require("../utils/constants");
let fs = require('fs');
let ko = require('knockout');

let mapViewModel = function (shouter, map) {
    let self = this;

    self.mapWidth = ko.observable(MAP_INIT_WIDTH);
    self.mapHeight = ko.observable(MAP_INIT_HEIGHT);

    self.saveMap = function () {
        console.log("Save map");

        fs.writeFile('./map.hive', JSON.stringify(map, null, 2), 'utf-8', function () {
            console.log("Map has been saved to map.hive");
        });
    };

    self.loadMap = function () {
        console.log("Load map");

        let newMap = JSON.parse(fs.readFileSync('./map.hive', 'utf-8'));
        map.setMap(newMap.grid);
    };

    self.applyMapSize = function () {
        if (self.mapHeight() > 0 && self.mapWidth() > 0) {
            console.log("Apply map size");

            map.changeMapSize(self.mapHeight(), self.mapWidth(), true);
        }
    };

    // Events
    shouter.subscribe(function (map) {
        self.mapHeight(map.length);
        self.mapWidth(map[0].length);
    }, self, SHOUT_MAP_TEMP_APPLIED);
};

module.exports = mapViewModel;