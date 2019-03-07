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

    self.handleCellClick = function (row, col) {
        self.leftMenuVM.handleCellClick(row, col);
    };

    self.handleCellDrag = function (srcRow, srcCol, dstRow, dstCol) {
        self.leftMenuVM.handleCellDrag(srcRow, srcCol, dstRow, dstCol);
    };

    self.handleCellDeleteClick = function(row, col) {
        self.leftMenuVM.handleCellDeleteClick(row, col);
    };

    self.handleEsc = function () {
        self.leftMenuVM.handleEsc();
    };
};

module.exports = mainViewModel;