require("../utils/constants");
let ko = require('knockout');

// Models
let Map = require('../models/map');

// ViewModels
let leftMenuViewModel = require("./left_menu");
let controlConsoleViewModel = require("./control_console");
let rightMenuViewModel = require("./right_menu");

let mainViewModel = function () {
    let self = this;

    self.map = new Map();

    self.shouter = new ko.subscribable();

    self.runningMode = ko.observable(RUNNING_MODE.DESIGN);

    self.leftMenuVM = new leftMenuViewModel(self.runningMode, self.shouter, self.map);
    self.controlConsoleVM = new controlConsoleViewModel(self.runningMode, self.shouter, self.map);
    self.rightMenuVM = new rightMenuViewModel(self.runningMode, self.shouter, self.map);
};

module.exports = mainViewModel;