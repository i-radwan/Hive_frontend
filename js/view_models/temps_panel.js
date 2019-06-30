require('../utils/constants');
require('../utils/strings');
const ko = require('knockout');
const fs = require('fs');

let tempsPanelViewModel = function (runningMode, shouter, state, sendToServer, logger) {
    let self = this;

    self.active = ko.computed(function () {
        return runningMode() === RUNNING_MODE.DESIGN;
    });

    self.fetchTemps = function () {
        let temps = [];

        fs.readdirSync(TEMPS_PATH).forEach(file => {
            if (file[0] === "." || isNaN(file))
                return;

            let imgPath = TEMPS_PATH + file + "/" + TEMP_IMAGE_NAME;
            let statePath = TEMPS_PATH + file + "/" + TEMP_STATE_NAME;

            temps.push({
                state_path: statePath,
                img: imgPath
            });
        });

        return temps;
    };

    self.tempClicked = function (idx) {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        if (idx < 0 || idx >= self.temps.length) {
            shouter.notifySubscribers({
                text: STR[2006](["template"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        console.log("Template " + idx() + " applied!");

        let newState = JSON.parse(fs.readFileSync(self.temps[idx()].state_path, 'utf-8'));

        state.load(newState);

        shouter.notifySubscribers({}, SHOUT.STATE_UPDATED);
    };

    self.temps = self.fetchTemps();
};

module.exports = tempsPanelViewModel;