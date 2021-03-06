require('../utils/constants');
require('../utils/strings');
const fs = require('fs');
const ko = require('knockout');
const {dialog} = require('electron').remote;

let mapPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer, logger) {
    let self = this;

    self.active = ko.computed(function () {
        return runningMode() === RUNNING_MODE.DESIGN;
    });

    self.mapWidth = ko.observable(MAP_INIT_WIDTH);
    self.mapHeight = ko.observable(MAP_INIT_HEIGHT);

    self.saveMap = function () {
        console.log("Save state");

        let path = dialog.showSaveDialog({
            title: 'Save Hive Map!',
            defaultPath: '~/state.hive'
        });

        if (path === undefined)
            return;

        fs.writeFile(path, JSON.stringify(state, null, 2), 'utf-8', function () {
            console.log("Map has been saved to 'state.hive'");
        });
    };

    self.loadMap = function () {
        console.log("Load state");

        let paths = dialog.showOpenDialog({
                title: "Load Hive State",
                defaultPath: "~",
                buttonLabel: "Load",
                filters: [{name: 'Hive State', extensions: ['hive']}]
            });

        if (paths === undefined || paths.length === 0)
            return;

        let path = paths[0];

        let newState = JSON.parse(fs.readFileSync(path, 'utf-8'));

        state.load(newState);

        shouter.notifySubscribers({}, SHOUT.STATE_UPDATED);
    };

    self.clearMap = function () {
        console.log("Clear the map");

        state.clear();

        shouter.notifySubscribers({}, SHOUT.STATE_UPDATED);
    };

    self.applyMapSize = function () {
        if (parseInt(self.mapHeight()) > 0 && parseInt(self.mapWidth()) > 0) {
            console.log("Apply map size");

            state.map.changeMapSize(parseInt(self.mapHeight()), parseInt(self.mapWidth()), true);

            shouter.notifySubscribers({}, SHOUT.STATE_UPDATED);

            shouter.notifySubscribers({
                text: STR[1003](),
                type: MSG_TYPE.INFO,
                volatile: true
            }, SHOUT.MSG);
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
            console.log(objs[k]);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_ADD,
                data: objs[k]
            });
        }
    };

    // Events
    shouter.subscribe(function () {
        self.mapHeight(parseInt(state.map.height));
        self.mapWidth(parseInt(state.map.width));

        informGFX();
    }, self, SHOUT.STATE_UPDATED);
};

module.exports = mapPanelViewModel;