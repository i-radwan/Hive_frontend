require('../utils/constants');
let ko = require('knockout');

let tempsPanelViewModel = function (runningMode, shouter, state, sendToServer, logger) {
    let self = this;

    self.active = ko.computed(function () {
        return runningMode() === RUNNING_MODE.DESIGN;
    });

    /**
     * Fetches the saved templates.
     * TODO: fetch real templates.
     */
    self.fetchTemps = function () {
        let temps = [];
        for (let i = 0; i < 10; i++) {
            let temp = new Array(20);

            let items = [{
                id: 1,
                weight: 10
            }];

            let objects = {};

            for (let j = 0; j < 20; j++) {
                temp[j] = new Array(30);

                for (let k = 0; k < 30; k++) {
                    let rand = Math.floor(Math.random() * 6);

                    switch (rand) {
                        case 0:
                            temp[j][k] = {
                                objects: []
                            };
                            break;
                        case 1:
                            temp[j][k] = {
                                objects: [{
                                    type: MAP_CELL.GATE,
                                    id: 30 * j + k,
                                    color: GFX_SVG_DEFAULT_COLOR.GATE
                                }]
                            };

                            objects[[30 * j + k, MAP_CELL.GATE]] = [j, k];
                            break;
                        case 2:
                            temp[j][k] = {
                                objects: [{
                                    type: MAP_CELL.ROBOT,
                                    id: 30 * j + k,
                                    color: "#FF0000",
                                    load_cap: 10,
                                    ip: ""
                                }]
                            };

                            objects[[30 * j + k, MAP_CELL.ROBOT]] = [j, k];
                            break;
                        case 3:
                            temp[j][k] = {
                                objects: [{
                                    type: MAP_CELL.RACK,
                                    id: 30 * j + k,
                                    items: [{
                                        id: 1,
                                        quantity: 10
                                    }],
                                    capacity: RACK_INIT_CAP,
                                    color: GFX_SVG_DEFAULT_COLOR.RACK
                                }]
                            };

                            objects[[30 * j + k, MAP_CELL.RACK]] = [j, k];
                            break;
                        case 4:
                            temp[j][k] = {
                                objects: [{
                                    type: MAP_CELL.STATION,
                                    id: 30 * j + k,
                                    color: GFX_SVG_DEFAULT_COLOR.STATION
                                }]
                            };

                            objects[[30 * j + k, MAP_CELL.STATION]] = [j, k];
                            break;
                        case 5:
                            temp[j][k] = {
                                objects: [{
                                    type: MAP_CELL.OBSTACLE,
                                    id: 30 * j + k,
                                    color: GFX_SVG_DEFAULT_COLOR.OBSTACLE
                                }]
                            };

                            objects[[30 * j + k, MAP_CELL.OBSTACLE]] = [j, k];
                    }
                }
            }

            temps.push({
                temp: {
                    map: temp,
                    items: items,
                    objects: objects
                },
                img: "images/temps/hold.png"
            });
        }

        return temps;
    };

    self.temps = self.fetchTemps();

    self.tempClicked = function (idx) {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: "This action is allowed in design mode only!",
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        if (idx < 0 || idx >= self.temps.length) {
            shouter.notifySubscribers({
                text: "Invalid template!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        console.log("Template " + idx() + " applied!");

        state.items = self.temps[idx()].temp.items;
        state.map.setMap(self.temps[idx()].temp.map, self.temps[idx()].temp.objects);

        shouter.notifySubscribers({}, SHOUT.STATE_UPDATED);
    };
};

module.exports = tempsPanelViewModel;