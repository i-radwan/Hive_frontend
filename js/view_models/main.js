require('../utils/constants');
let ko = require('knockout');

// Models
let State = require('../models/state');

// ViewModels
let leftMenuViewModel = require("./left_menu");
let controlConsoleViewModel = require("./control_console");
let rightMenuViewModel = require("./right_menu");

let mainViewModel = function (gfxEventHandler, comm) {
    let self = this;

    self.state = new State();

    self.shouter = new ko.subscribable();

    self.runningMode = ko.observable(RUNNING_MODE.DESIGN);

    self.gfxEventHandler = gfxEventHandler;

    self.logger = self.rightMenuVM.addLog;

    self.leftMenuVM = new leftMenuViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm.send, self.logger);
    self.controlConsoleVM = new controlConsoleViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm, self.logger);
    self.rightMenuVM = new rightMenuViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm.send);

    self.setGFXEventHandler = function (gfxEventHandler) {
        self.gfxEventHandler = gfxEventHandler;
    };

    self.eventHandler = function (event) {
        switch (event.type) {
            case EVENT_FROM_GFX.CELL_CLICK:
                handleCellClick(event.row, event.col);
                break;
            case EVENT_FROM_GFX.CELL_DRAG:
                handleCellDrag(event.src_row, event.src_col, event.dst_row, event.dst_col);
                break;
            case EVENT_FROM_GFX.OBJECT_MOVE:
                handleObjectMove();
                break;
            case EVENT_FROM_GFX.CELL_DELETE:
                handleCellDeleteClick(event.row, event.col);
                break;
            case EVENT_FROM_GFX.ESC:
                handleEsc();
                break;
        }
    };

    self.handleServerMsg = function (msg) {
        switch (msg.type) {
            case MSG_FROM_SERVER.ACK_CONFIG:
                self.controlConsoleVM.handleServerMsg(msg);
                break;

            case MSG_FROM_SERVER.ACK_RESUME:
                self.controlConsoleVM.handleServerMsg(msg);
                break;

            case MSG_FROM_SERVER.ACK_ORDER:
                self.leftMenuVM.orderVM.handleServerMsg(msg);
                break;

            case SERVER_EVENT_TYPE.OBJECT_UPDATE:
                gfxEventHandler({
                    type: EVENT_TO_GFX.OBJECT_MOVE,
                    src_row: msg.src_row,
                    src_col: msg.src_col,
                    dst_row: msg.dst_row,
                    dst_col: msg.dst_col
                });
                break;

            case SERVER_EVENT_TYPE.FILL_RACK:
                self.leftMenuVM.rackVM.fillRack(msg.rack_id, msg.item_id, msg.item_quantity);
                break;

            case SERVER_EVENT_TYPE.LOG:
                self.rightMenuVM.addLog(msg.level, msg.object, msg.text);
                break;

            case SERVER_EVENT_TYPE.STATS:
                self.rightMenuVM.updateStats(msg.key, msg.value);
                break;

            case SERVER_EVENT_TYPE.MSG:
                shouter.notifySubscribers({text: msg.text, type: msg.log_type}, SHOUT_MSG);
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
            type: EVENT_TO_GFX.ESC
        });
    };

    gfxEventHandler({
        type: EVENT_TO_GFX.INIT,
        width: self.state.map.width,
        height: self.state.map.height
    });
};

module.exports = mainViewModel;