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

    let informGFX = function () {
        // Inform GFX that the map size changed
        gfxEventHandler({
            type: EVENT_TO_GFX.INIT,
            data: {
                width: state.map.width,
                height: state.map.height
            }
        });

        // Add objects GFX events
        let objs = state.map.getObjects();

        for (let k = 0; k < objs.length; k++) {
            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_ADD,
                data: objs[k]
            });
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