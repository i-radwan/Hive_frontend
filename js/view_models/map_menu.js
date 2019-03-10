require("../utils/constants");
let fs = require('fs');
let ko = require('knockout');
const {dialog} = require('electron').remote;

let mapViewModel = function (shouter, map, gfxEventHandler) {
    let self = this;

    self.mapWidth = ko.observable(MAP_INIT_WIDTH);
    self.mapHeight = ko.observable(MAP_INIT_HEIGHT);

    self.saveMap = function () {
        console.log("Save map");

        let path = dialog.showSaveDialog({
            title: 'Save Hive Map!',
            defaultPath: '~/map.hive'
        });

        fs.writeFile(path, JSON.stringify(map, null, 2), 'utf-8', function () {
            console.log("Map has been saved to map.hive");
        });
    };

    self.loadMap = function () {
        console.log("Load map");

        let path = dialog.showOpenDialog()[0];

        let newMap = JSON.parse(fs.readFileSync(path, 'utf-8'));
        map.setMap(newMap.grid);

        self.informGFX();
    };

    self.applyMapSize = function () {
        if (self.mapHeight() > 0 && self.mapWidth() > 0) {
            console.log("Apply map size");

            map.changeMapSize(self.mapHeight(), self.mapWidth(), true);

            self.informGFX();
        }
    };

    self.informGFX = function() {
        // Inform GFX that the map size changed
        gfxEventHandler({
            type: GFX_EVENT_TYPE.INIT,
            width: map.width,
            height: map.height
        });

        // Add objects GFX events
        for (let i = 0; i < map.height; i++) {
            for (let j = 0; j < map.width; j++) {
                let el = map.grid[i][j];

                switch (el.type) {
                    case MAP_CELL.ENTRY:
                        gfxEventHandler({
                            type: GFX_EVENT_TYPE.OBJECT_ADD,
                            object: MAP_CELL.ENTRY,
                            row: i,
                            col: j
                        });
                        break;
                    case MAP_CELL.ROBOT:
                        gfxEventHandler({
                            type: GFX_EVENT_TYPE.OBJECT_ADD,
                            object: MAP_CELL.ROBOT,
                            row: i,
                            col: j,
                            id: el.id,
                            load_cap: el.loadCap,
                            battery_cap: el.batteryCap,
                            color: el.color,
                            ip: el.ip
                        });
                        break;
                    case MAP_CELL.RACK:
                        gfxEventHandler({
                            type: GFX_EVENT_TYPE.OBJECT_ADD,
                            object: MAP_CELL.RACK,
                            row: i,
                            col: j,
                            item_number: el.itemNumber,
                            quantity: el.quantity,
                            item_weight: el.itemWeight
                        });
                        break;
                    case MAP_CELL.PARK:
                        gfxEventHandler({
                            type: GFX_EVENT_TYPE.OBJECT_ADD,
                            object: MAP_CELL.PARK,
                            row: i,
                            col: j
                        });
                        break;
                    case MAP_CELL.OBSTACLE:
                        gfxEventHandler({
                            type: GFX_EVENT_TYPE.OBJECT_ADD,
                            object: MAP_CELL.OBSTACLE,
                            row: i,
                            col: j
                        });
                        break;
                }
            }
        }
    };

    // Events
    shouter.subscribe(function (map) {
        self.mapHeight(map.length);
        self.mapWidth(map[0].length);

        self.informGFX();
    }, self, SHOUT_MAP_TEMP_APPLIED);
};

module.exports = mapViewModel;