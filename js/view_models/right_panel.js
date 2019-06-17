require('../utils/constants');
require('../utils/strings');
let $ = require('jquery');
let ko = require('knockout');

let itemsPanelViewModel = require('./items_panel');

let rightPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer) {
    let self = this;

    self.activePanel = ko.observable(RIGHT_PANEL.ITEMS);
    self.logs = ko.observableArray();
    self.stats = ko.observableArray();

    self.activateScrollUp = ko.observable(false);
    self.activateScrollDown = ko.observable(false);

    let logsList = $(".rpanel #logs");

    logsList.scroll(function () {
        self.activateScrollUp(logsList.scrollTop() > 0);

        self.activateScrollDown(
            logsList.scrollTop() + logsList.innerHeight() < logsList[0].scrollHeight);
    });

    // Sub view models
    self.itemsVM = new itemsPanelViewModel(runningMode, shouter, state, gfxEventHandler);

    // self.logs.push({
    //     level: LOG_LEVEL.INFO,
    //     object: LOG_TYPE.ROBOT,
    //     color: "#17b611",
    //     msg: "Robot <b>(#3)</b> loaded <b>(6)</b> of item <b>(#2)</b>."
    // }, {
    //     level: LOG_LEVEL.WARNING,
    //     object: LOG_TYPE.ROBOT,
    //     color: "#007302",
    //     msg: "Robot <b>(#3)</b> battery is low."
    // }, {
    //     level: LOG_LEVEL.ERROR,
    //     object: LOG_TYPE.ROBOT,
    //     color: "#007302",
    //     msg: "Robot <b>(#3)</b> is disconnected."
    // }, {
    //     level: LOG_LEVEL.INFO,
    //     object: LOG_TYPE.ORDER,
    //     msg: "Order <b>(xyz)</b> is fulfilled."
    // }, {
    //     level: LOG_LEVEL.INFO,
    //     object: LOG_TYPE.TEXT,
    //     msg: "Simulation Paused"
    // }, {
    //     level: LOG_LEVEL.INFO,
    //     object: LOG_TYPE.TEXT,
    //     msg: "Simulation Resumed"
    // }, {
    //     level: LOG_LEVEL.INFO,
    //     object: LOG_TYPE.ORDER,
    //     msg: "Order <b>(abc)</b> is fulfilled."
    // }, {
    //     level: LOG_LEVEL.INFO,
    //     object: LOG_TYPE.ROBOT,
    //     color: "#626678",
    //     msg: "Robot <b>(#6)</b> loaded <b>(4)</b> of item <b>(#1)</b>."
    // }, {
    //     level: LOG_LEVEL.WARNING,
    //     object: LOG_TYPE.ROBOT,
    //     color: "#731121",
    //     msg: "Robot <b>(#2)</b> battery is low."
    // }, {
    //     level: LOG_LEVEL.ERROR,
    //     object: LOG_TYPE.RACK,
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

    self.tabsClipPath = ko.computed(function () {
        if (self.activePanel() === RIGHT_PANEL.LOGS) {
            return 'polygon(0% 0%, 33.33% 0%, 33.33% 100%, 0% 100%)';
        } else if (self.activePanel() === RIGHT_PANEL.STATS) {
            return 'polygon(33.33% 0%, 66.66% 0%, 66.66% 100%, 33.33% 100%)';
        } else if (self.activePanel() === RIGHT_PANEL.ITEMS) {
            return 'polygon(66.66% 0%, 100% 0%, 100% 100%, 66.66% 100%)';
        }
    });

    self.addLog = function (log) {
        let userScrollingUp =
            logsList.scrollTop() + logsList.innerHeight() < logsList[0].scrollHeight;

        // Add the log
        self.logs.push(log);

        // Scroll view to bottom if the user is already not scrolling to top
        if (!userScrollingUp)
            logsList.animate({scrollTop: logsList[0].scrollHeight}, 250);
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
            self.stats.push({
                key: key,
                value: ko.observable(value)
            });
        }
    };

    self.toggleActiveList = function (panel) {
        if (runningMode() === RUNNING_MODE.DESIGN && panel !== RIGHT_PANEL.ITEMS)
            return;

        self.activePanel(panel);
    };

    // Listen for mode change
    runningMode.subscribe(function (newRunningMode) {
        if (newRunningMode === RUNNING_MODE.DESIGN) {
            self.activePanel(RIGHT_PANEL.ITEMS);
            self.logs.removeAll();
            self.stats.removeAll();
        } else {
            self.activePanel(RIGHT_PANEL.LOGS);
        }
    });

    self.handleEsc = function () {

    };

    self.scrollUp = function () {
        logsList.animate({scrollTop: 0}, 250);
    };

    self.scrollDown = function () {
        logsList.animate({scrollTop: logsList[0].scrollHeight}, 250);
    };
};

module.exports = rightPanelViewModel;