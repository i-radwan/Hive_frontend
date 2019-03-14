require("../utils/constants");
let fs = require('fs');
let ko = require('knockout');
const {dialog} = require('electron').remote;

let mapViewModel = function (shouter, state, gfxEventHandler) {
    let self = this;

    self.mapWidth = ko.observable(MAP_INIT_WIDTH);
    self.mapHeight = ko.observable(MAP_INIT_HEIGHT);

    self.saveMap = function () {
        console.log("Save state");

        let path = dialog.showSaveDialog({
            title: 'Save Hive Map!',
            defaultPath: '~/state.hive'
        });

        fs.writeFile(path, JSON.stringify(state, null, 2), 'utf-8', function () {
            console.log("Map has been saved to state.hive");
        });
    };

    self.loadMap = function () {
        console.log("Load state");

        let path = dialog.showOpenDialog()[0];

        let newState = JSON.parse(fs.readFileSync(path, 'utf-8'));

        state.items = newState.items;
        state.map.setMap(newState.map.grid);

        self.informGFX();
    };

    self.applyMapSize = function () {
        if (self.mapHeight() > 0 && self.mapWidth() > 0) {
            console.log("Apply map size");

            state.map.changeMapSize(self.mapHeight(), self.mapWidth(), true);

            self.informGFX();
        }
    };

    self.informGFX = function() {
        // Inform GFX that the map size changed
        gfxEventHandler({
            type: GFX_EVENT_TYPE.INIT,
            width: state.map.width,
            height: state.map.height
        });

        // Add objects GFX events
        for (let i = 0; i < state.map.height; i++) {
            for (let j = 0; j < state.map.width; j++) {
                let el = state.map.grid[i][j];

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