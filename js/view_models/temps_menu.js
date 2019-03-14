require("../utils/constants");
let ko = require('knockout');

let tempsViewModel = function (shouter, state) {
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
                                type: MAP_CELL.EMPTY
                            };
                            break;
                        case 1:
                            temp[j][k] = {
                                type: MAP_CELL.ENTRY
                            };
                            break;
                        case 2:
                            temp[j][k] = {
                                type: MAP_CELL.ROBOT,
                                color: "#FF0000",
                                load_cap: 10,
                                battery_cap: 1000,
                                ip: ""
                            };
                            break;
                        case 3:
                            temp[j][k] = {
                                type: MAP_CELL.RACK,
                                items: [{
                                    id: 1,
                                    quantity: 10
                                }],
                                capacity: RACK_CAP
                            };
                            break;
                        case 4:
                            temp[j][k] = {
                                type: MAP_CELL.PARK
                            };
                            break;
                        case 5:
                            temp[j][k] = {
                                type: MAP_CELL.OBSTACLE
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
        console.log("Template " + idx() + " applied!");

        state.items = self.temps[idx()].temp.items;
        state.map.setMap(self.temps[idx()].temp.map);

        shouter.notifySubscribers(self.temps[idx()].temp.map, SHOUT_MAP_TEMP_APPLIED);
    };
};

module.exports = tempsViewModel;