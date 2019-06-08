require('../utils/constants');
let fs = require('fs');
let ko = require('knockout');
const {dialog} = require('electron').remote;

let mapPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer, logger) {
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
            console.log("Map has been saved to 'state.hive'");
        });
    };

    self.loadMap = function () {
        console.log("Load state");

        let path = dialog.showOpenDialog()[0];

        let newState = JSON.parse(fs.readFileSync(path, 'utf-8'));

        state.load(newState);

        shouter.notifySubscribers({}, SHOUT.STATE_UPDATED);
    };

    self.applyMapSize = function () {
        if (self.mapHeight() > 0 && self.mapWidth() > 0) {
            console.log("Apply map size");

            state.map.changeMapSize(self.mapHeight(), self.mapWidth(), true);

            shouter.notifySubscribers({}, SHOUT.STATE_UPDATED);
        }
    };

    let informGFX = function() {
        // Inform GFX that the map size changed
        gfxEventHandler({
            type: EVENT_TO_GFX.INIT,
            data: {
                width: state.map.width,
                height: state.map.height
            }
        });

        // Add objects GFX events
        for (let i = 0; i < state.map.height; i++) {
            for (let j = 0; j < state.map.width; j++) {
                let c = state.map.grid[i][j];

                if (c.robot !== undefined) {
                    gfxEventHandler({
                        type: EVENT_TO_GFX.OBJECT_ADD,
                        data: {
                            type: MAP_CELL.ROBOT,
                            row: i,
                            col: j,
                            direction: ROBOT_DIR.RIGHT,
                            id: c.robot.id,
                            load_cap: c.robot.loadCap,
                            color: c.robot.color,
                            ip: c.robot.ip
                        }
                    });
                } else if (c.facility !== undefined) {
                    switch (c.facility.type) {
                        case MAP_CELL.GATE:
                            gfxEventHandler({
                                type: EVENT_TO_GFX.OBJECT_ADD,
                                data: {
                                    type: MAP_CELL.GATE,
                                    row: i,
                                    col: j
                                }
                            });
                            break;
                        case MAP_CELL.RACK:
                            gfxEventHandler({
                                type: EVENT_TO_GFX.OBJECT_ADD,
                                data: {
                                    type: MAP_CELL.RACK,
                                    row: i,
                                    col: j,
                                    capacity: c.facility.capacity,
                                    items: c.facility.items
                                }
                            });
                            break;
                        case MAP_CELL.STATION:
                            gfxEventHandler({
                                type: EVENT_TO_GFX.OBJECT_ADD,
                                data: {
                                    type: MAP_CELL.STATION,
                                    row: i,
                                    col: j
                                }
                            });
                            break;
                        case MAP_CELL.OBSTACLE:
                            gfxEventHandler({
                                type: EVENT_TO_GFX.OBJECT_ADD,
                                data: {
                                    type: MAP_CELL.OBSTACLE,
                                    row: i,
                                    col: j
                                }
                            });
                            break;
                    }
                }
            }
        }
    };

    // Events
    shouter.subscribe(function () {
        console.log(state);
        console.log(state.map);

        self.mapHeight(state.map.height);
        self.mapWidth(state.map.width);

        informGFX();
    }, self, SHOUT.STATE_UPDATED);
};

module.exports = mapPanelViewModel;