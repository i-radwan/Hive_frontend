require('../utils/constants');
let ko = require('knockout');

let itemsPanelViewModel = require('./items_panel');

let rightPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer) {
    let self = this;

    self.activePanel = ko.observable(RIGHT_PANEL.ITEMS);
    self.logs = ko.observableArray();
    self.stats = ko.observableArray();

    // Sub view models
    self.itemsVM = new itemsPanelViewModel(shouter, state, gfxEventHandler);

    // self.logs.push({
    //     level: LOG_LEVEL_INFO,
    //     object: LOG_OBJECT_ROBOT,
    //     color: "#17b611",
    //     msg: "Robot <b>(#3)</b> loaded <b>(6)</b> of item <b>(#2)</b>."
    // }, {
    //     level: LOG_LEVEL_WARNING,
    //     object: LOG_OBJECT_ROBOT,
    //     color: "#007302",
    //     msg: "Robot <b>(#3)</b> battery is low."
    // }, {
    //     level: LOG_LEVEL_ERROR,
    //     object: LOG_OBJECT_ROBOT,
    //     color: "#007302",
    //     msg: "Robot <b>(#3)</b> is disconnected."
    // }, {
    //     level: LOG_LEVEL_INFO,
    //     object: LOG_OBJECT_ORDER,
    //     msg: "Order <b>(xyz)</b> is fulfilled."
    // }, {
    //     level: LOG_LEVEL_INFO,
    //     object: LOG_OBJECT_SIMULATION,
    //     msg: "Simulation Paused"
    // }, {
    //     level: LOG_LEVEL_INFO,
    //     object: LOG_OBJECT_SIMULATION,
    //     msg: "Simulation Resumed"
    // }, {
    //     level: LOG_LEVEL_INFO,
    //     object: LOG_OBJECT_ORDER,
    //     msg: "Order <b>(abc)</b> is fulfilled."
    // }, {
    //     level: LOG_LEVEL_INFO,
    //     object: LOG_OBJECT_ROBOT,
    //     color: "#626678",
    //     msg: "Robot <b>(#6)</b> loaded <b>(4)</b> of item <b>(#1)</b>."
    // }, {
    //     level: LOG_LEVEL_WARNING,
    //     object: LOG_OBJECT_ROBOT,
    //     color: "#731121",
    //     msg: "Robot <b>(#2)</b> battery is low."
    // }, {
    //     level: LOG_LEVEL_ERROR,
    //     object: LOG_OBJECT_RACK,
    //     msg: "Rack <b>(#4)</b> is empty."
    // });

    self.stats.push({
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    }, {
        key: "Throughput",
        value: ko.observable(12)
    });

    self.addLog = function (log) {
        self.logs.push(log);
    };

    self.updateStats = function (key, value) {
        let f = false;
        self.stats().forEach(function (elem) {
            if (elem.key === key) {
                elem.value(value);
                f = true;
            }
        });

        if (!f) {
            self.stats().push({
                key: key,
                value: ko.observable(value)
            });
        }
    };

    self.toggleActiveList = function () {
        if (self.activePanel() === RIGHT_PANEL.LOGS) {
            self.activePanel(RIGHT_PANEL.STATS);
        }
        else if (self.activePanel() === RIGHT_PANEL.STATS) {
            self.activePanel(RIGHT_PANEL.LOGS)
        }
    };

    // Listen for mode change
    runningMode.subscribe(function (newRunningMode) {
        if (newRunningMode === RUNNING_MODE.DESIGN) {
            self.activePanel(RIGHT_PANEL.ITEMS);
        }
        else {
            self.activePanel(RIGHT_PANEL.LOGS);
        }
    });

    self.handleEsc = function () {

    };
};

module.exports = rightPanelViewModel;