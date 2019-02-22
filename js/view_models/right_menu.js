require("../utils/constants");
let ko = require('knockout');

let rightMenuViewModel = function (shouter, map) {
    let self = this;

    self.activeMenu = ko.observable(LEFT_MENU.TEMPS);
    self.runningMode = ko.observable(RUNNING_MODE.DESIGN);
    self.logs = ko.observableArray();
    self.stats = ko.observableArray();

    // TODO: listen to events
    self.logs.push({
        level: LOG_LEVEL_INFO,
        object: LOG_OBJECT_ROBOT,
        color: "#17b611",
        msg: "Robot <b>(#3)</b> loaded <b>(6)</b> of item <b>(#2)</b>."
    }, {
        level: LOG_LEVEL_WARNING,
        object: LOG_OBJECT_ROBOT,
        color: "#007302",
        msg: "Robot <b>(#3)</b> battery is low."
    }, {
        level: LOG_LEVEL_ERROR,
        object: LOG_OBJECT_ROBOT,
        color: "#007302",
        msg: "Robot <b>(#3)</b> is disconnected."
    }, {
        level: LOG_LEVEL_INFO,
        object: LOG_OBJECT_ORDER,
        msg: "Order <b>(xyz)</b> is fulfilled."
    }, {
        level: LOG_LEVEL_INFO,
        object: LOG_OBJECT_SIMULATION,
        msg: "Simulation Paused"
    }, {
        level: LOG_LEVEL_INFO,
        object: LOG_OBJECT_SIMULATION,
        msg: "Simulation Resumed"
    }, {
        level: LOG_LEVEL_INFO,
        object: LOG_OBJECT_ORDER,
        msg: "Order <b>(abc)</b> is fulfilled."
    }, {
        level: LOG_LEVEL_INFO,
        object: LOG_OBJECT_ROBOT,
        color: "#626678",
        msg: "Robot <b>(#6)</b> loaded <b>(4)</b> of item <b>(#1)</b>."
    }, {
        level: LOG_LEVEL_WARNING,
        object: LOG_OBJECT_ROBOT,
        color: "#731121",
        msg: "Robot <b>(#2)</b> battery is low."
    }, {
        level: LOG_LEVEL_ERROR,
        object: LOG_OBJECT_RACK,
        msg: "Rack <b>(#4)</b> is empty."
    });

    // Click Events
    self.toggleActiveList = function () {
        if (self.activeMenu() === RIGHT_MENU.LOGS) {
            self.activeMenu(RIGHT_MENU.STATS);
        }
        else if (self.activeMenu() === RIGHT_MENU.STATS) {
            self.activeMenu(RIGHT_MENU.LOGS)
        }
    };

    // Listen for mode change
    shouter.subscribe(function (runningMode) {
        if (runningMode === RUNNING_MODE.DESIGN) {
            self.activeMenu(RIGHT_MENU.EMPTY);
        }
        else {
            self.activeMenu(RIGHT_MENU.LOGS);
        }

        self.runningMode(runningMode);
    }, self, SHOUT_RUNNING_MODE);
};

module.exports = rightMenuViewModel;