require('../utils/constants');
let ko = require('knockout');

// Models
let State = require('../models/state');

// ViewModels
let leftMenuViewModel = require("./left_menu");
let controlConsoleViewModel = require("./control_console");
let rightMenuViewModel = require("./right_menu");

let mainViewModel = function (gfxEventHandler, sendToServer) {
    let self = this;

    self.state = new State();

    self.shouter = new ko.subscribable();

    self.runningMode = ko.observable(RUNNING_MODE.DESIGN);

    self.gfxEventHandler = gfxEventHandler;

    self.leftMenuVM = new leftMenuViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, sendToServer);
    self.controlConsoleVM = new controlConsoleViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, sendToServer);
    self.rightMenuVM = new rightMenuViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, sendToServer);

    self.setGFXEventHandler = function (gfxEventHandler) {
        self.gfxEventHandler = gfxEventHandler;
    };

    self.eventHandler = function (event) {
        switch (event.type) {
            case LOGIC_EVENT_TYPE.CELL_CLICK:
                handleCellClick(event.row, event.col);
                break;
            case LOGIC_EVENT_TYPE.CELL_DRAG:
                handleCellDrag(event.src_row, event.src_col, event.dst_row, event.dst_col);
                break;
            case LOGIC_EVENT_TYPE.OBJECT_MOVE:
                handleObjectMove();
                break;
            case LOGIC_EVENT_TYPE.CELL_DELETE:
                handleCellDeleteClick(event.row, event.col);
                break;
            case LOGIC_EVENT_TYPE.ESC:
                handleEsc();
                break;
        }
    };

    let handleCellClick = function (row, col) {
        self.leftMenuVM.handleCellClick(row, col);
    };

    let handleCellDrag = function (srcRow, srcCol, dstRow, dstCol) {
        self.leftMenuVM.handleCellDrag(srcRow, srcCol, dstRow, dstCol);
    };

    let handleObjectMove = function (srcRow, srcCol, dstRow, dstCol) {
        self.leftMenuVM.handleObjectMove(srcRow, srcCol, dstRow, dstCol);
    };

    let handleCellDeleteClick = function (row, col) {
        self.leftMenuVM.handleCellDeleteClick(row, col);
    };

    let handleEsc = function () {
        self.leftMenuVM.handleEsc();
        self.controlConsoleVM.handleEsc();
        self.rightMenuVM.handleEsc();

        gfxEventHandler({
            type: GFX_EVENT_TYPE.ESC
        });
    };

    gfxEventHandler({
        type: GFX_EVENT_TYPE.INIT,
        width: self.state.map.width,
        height: self.state.map.height
    });
};

module.exports = mainViewModel;