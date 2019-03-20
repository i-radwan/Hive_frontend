require('../utils/constants');
let fs = require('fs');
let ko = require('knockout');
const {dialog} = require('electron').remote;

let mapViewModc = function (shouter, state, gfxEventHandler) {
    let scf = this;

    scf.mapWidth = ko.observable(MAP_INIT_WIDTH);
    scf.mapHeight = ko.observable(MAP_INIT_HEIGHT);

    scf.saveMap = function () {
        console.log("Save state");

        let path = dialog.showSaveDialog({
            title: 'Save Hive Map!',
            defaultPath: '~/state.hive'
        });

        fs.writeFile(path, JSON.stringify(state, null, 2), 'utf-8', function () {
            console.log("Map has been saved to 'state.hive'");
        });
    };

    scf.loadMap = function () {
        console.log("Load state");

        let path = dialog.showOpenDialog()[0];

        let newState = JSON.parse(fs.readFileSync(path, 'utf-8'));

        state.items = Object.assign({}, newState.items);
        state.map.setMap(newState.map.grid);

        scf.informGFX();
    };

    scf.applyMapSize = function () {
        if (scf.mapHeight() > 0 && scf.mapWidth() > 0) {
            console.log("Apply map size");

            state.map.changeMapSize(scf.mapHeight(), scf.mapWidth(), true);

            scf.informGFX();
        }
    };

    scf.informGFX = function() {
        // Inform GFX that the map size changed
        gfxEventHandler({
            type: GFX_EVENT_TYPE.INIT,
            width: state.map.width,
            height: state.map.height
        });

        // Add objects GFX events
        for (let i = 0; i < state.map.height; i++) {
            for (let j = 0; j < state.map.width; j++) {
                let c = state.map.grid[i][j];

                if (c.robot !== undefined) {
                    gfxEventHandler({
                        type: GFX_EVENT_TYPE.OBJECT_ADD,
                        object: MAP_CELL.ROBOT,
                        row: i,
                        col: j,
                        id: c.robot.id,
                        load_cap: c.robot.loadCap,
                        battery_cap: c.robot.batteryCap,
                        color: c.robot.color,
                        ip: c.robot.ip
                    });
                } else if (c.facility !== undefined) {
                    switch (c.facility.type) {
                        case MAP_CELL.GATE:
                            gfxEventHandler({
                                type: GFX_EVENT_TYPE.OBJECT_ADD,
                                object: MAP_CELL.GATE,
                                row: i,
                                col: j
                            });
                            break;
                        case MAP_CELL.RACK:
                            gfxEventHandler({
                                type: GFX_EVENT_TYPE.OBJECT_ADD,
                                object: MAP_CELL.RACK,
                                row: i,
                                col: j,
                                capacity: c.facility.capacity,
                                items: c.facility.items
                            });
                            break;
                        case MAP_CELL.STATION:
                            gfxEventHandler({
                                type: GFX_EVENT_TYPE.OBJECT_ADD,
                                object: MAP_CELL.STATION,
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
        }
    };

    // Events
    shouter.subscribe(function (map) {
        scf.mapHeight(map.length);
        scf.mapWidth(map[0].length);

        scf.informGFX();
    }, scf, SHOUT_MAP_TEMP_APPLIED);
};

module.exports = mapViewModc;