require("../utils/constants");
let ko = require('knockout');

// Models
let Map = require('../models/map');

// ViewModels
let leftMenuViewModel = require("./left_menu");
let controlConsoleViewModel = require("./control_console");
let rightMenuViewModel = require("./right_menu");

let mainViewModel = function (gfxEventHandler) {
    let self = this;

    self.map = new Map();

    self.shouter = new ko.subscribable();

    self.runningMode = ko.observable(RUNNING_MODE.DESIGN);

    self.gfxEventHandler = gfxEventHandler;

    self.leftMenuVM = new leftMenuViewModel(self.runningMode, self.shouter, self.map, gfxEventHandler);
    self.controlConsoleVM = new controlConsoleViewModel(self.runningMode, self.shouter, self.map, gfxEventHandler);
    self.rightMenuVM = new rightMenuViewModel(self.runningMode, self.shouter, self.map, gfxEventHandler);

    self.setGFXEventHandler = function (gfxEventHandler) {
        self.gfxEventHandler = gfxEventHandler;
    };

    self.eventHandler = function(event) {
        switch (event.type) {
            case LOGIC_EVENT_TYPE.CELL_CLICK:
                self.leftMenuVM.handleCellClick(event.row, event.col);
                break;
            case LOGIC_EVENT_TYPE.CELL_DRAG:
                self.leftMenuVM.handleCellDrag(event.src_row, event.src_col, event.dst_row, event.dst_col);
                break;
            case LOGIC_EVENT_TYPE.OBJECT_MOVE:
                self.leftMenuVM.handleObjectMove();
                break;
            case LOGIC_EVENT_TYPE.CELL_DELETE:
                self.leftMenuVM.handleCellDeleteClick(event.row, event.col);
                break;
            case LOGIC_EVENT_TYPE.ESC:
                self.leftMenuVM.handleEsc();
                break;
        }
    };

    self.handleCellClick = function (row, col) {
        self.leftMenuVM.handleCellClick(row, col);
    };

    self.handleCellDrag = function (srcRow, srcCol, dstRow, dstCol) {
        self.leftMenuVM.handleCellDrag(srcRow, srcCol, dstRow, dstCol);
    };

    self.handleObjectMove = function(srcRow, srcCol, dstRow, dstCol) {
        self.leftMenuVM.handleObjectMove(srcRow, srcCol, dstRow, dstCol);
    };

    self.handleCellDeleteClick = function(row, col) {
        self.leftMenuVM.handleCellDeleteClick(row, col);
    };

    self.handleEsc = function () {
        self.leftMenuVM.handleEsc();
    };
};

module.exports = mainViewModel;