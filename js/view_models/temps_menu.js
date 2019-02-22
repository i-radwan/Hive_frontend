require("../utils/constants");
let ko = require('knockout');

let tempsViewModel = function (shouter, map) {
    let self = this;

    /**
     * Fetches the saved templates.
     * TODO: fetch real templates.
     */
    self.fetchTemps = function () {
        let temps = [];
        for (let i = 0; i < 10; i++) {
            let temp = new Array(20);

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
                                item_number: 1,
                                quantity: 10,
                                weight: 1
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
                temp: temp,
                img: "images/hold.png"
            });
        }

        return temps;
    };

    self.temps = self.fetchTemps();

    self.tempClicked = function (idx) {
        console.log("Template " + idx() + " applied!");

        map.setMap(self.temps[idx()].temp);

        shouter.notifySubscribers(self.temps[idx()].temp, SHOUT_MAP_TEMP_APPLIED);
    };
};

module.exports = tempsViewModel;