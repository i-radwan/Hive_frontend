require('../utils/constants');
let ko = require('knockout');

let tempsPanelViewModel = function (runningMode, shouter, state, sendToServer, logger) {
    let self = this;

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

            for (let j = 0; j < 20; j++) {
                temp[j] = new Array(30);

                for (let k = 0; k < 30; k++) {
                    let rand = Math.floor(Math.random() * 6);

                    switch (rand) {
                        case 0:
                            temp[j][k] = {
                                robot: undefined,
                                facility: undefined
                            };
                            break;
                        case 1:
                            temp[j][k] = {
                                robot: undefined,
                                facility: {
                                    type: MAP_CELL.GATE
                                }
                            };
                            break;
                        case 2:
                            temp[j][k] = {
                                robot: {
                                    type: MAP_CELL.ROBOT,
                                    color: "#FF0000",
                                    load_cap: 10,
                                    ip: ""
                                },
                                facility: undefined
                            };
                            break;
                        case 3:
                            temp[j][k] = {
                                robot: undefined,
                                facility: {
                                    type: MAP_CELL.RACK,
                                    items: [{
                                        id: 1,
                                        quantity: 10
                                    }],
                                    capacity: RACK_INIT_CAP
                                }
                            };
                            break;
                        case 4:
                            temp[j][k] = {
                                robot: undefined,
                                facility: {
                                    type: MAP_CELL.STATION
                                }
                            };
                            break;
                        case 5:
                            temp[j][k] = {
                                robot: undefined,
                                facility: {
                                    type: MAP_CELL.OBSTACLE
                                }
                            };
                    }
                }
            }

            temps.push({
                temp: {
                    map: temp,
                    items: items
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
                type: MSG_TYPE.ERROR
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
        state.map.setMap(self.temps[idx()].temp.map);

        shouter.notifySubscribers({}, SHOUT.STATE_UPDATED);
    };
};

module.exports = tempsPanelViewModel;