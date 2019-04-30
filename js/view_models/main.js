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

    self.leftMenuVM = new leftMenuViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm.send, self.logger);
    self.controlConsoleVM = new controlConsoleViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm, self.logger);
    self.rightMenuVM = new rightMenuViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm.send);

    self.logger = self.rightMenuVM.addLog;

    self.pendingActions = 0; // # of actions sent to graphics and waiting for their ACKs

    self.setGFXEventHandler = function (gfxEventHandler) {
        self.gfxEventHandler = gfxEventHandler;
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

            case MSG_FROM_SERVER.UPDATE:
                self.timestep = msg.data.timestep; // ToDo: display on the center console

                let actions = msg.data.actions;
                let logs = msg.data.logs;
                let statistics = msg.data.statistics;

                for (let i = 0; i < actions.length; ++i) {
                    let a = actions[i];
                    let data = actions[i].data;

                    if (a.type === SERVER_ACTIONS.MOVE) {
                        self.pendingActions++;

                        let r = data.robot_row;
                        let c = data.robot_col;
                        let nr = data.robot_new_row;
                        let nc = data.robot_new_col;

                        self.leftMenuVM.robotVM.move(r, c, nr, nc);
                    } else if (a.type === SERVER_ACTIONS.BIND) {
                        self.pendingActions++;

                        let id = data.robot_id;
                        let r = data.robot_row;
                        let c = data.robot_col;

                        self.leftMenuVM.robotVM.bind(id, r, c);
                    } else if (a.type === SERVER_ACTIONS.UNBIND) {
                        self.pendingActions++;

                        let id = data.robot_id;
                        let r = data.robot_row;
                        let c = data.robot_col;

                        self.leftMenuVM.robotVM.unbind(id, r, c);
                    } else if (a.type === SERVER_ACTIONS.LOAD) {
                        self.pendingActions++;

                        let id = data.robot_id;
                        let r = data.robot_row;
                        let c = data.robot_col;

                        self.leftMenuVM.robotVM.load(id, r, c);
                    } else if (a.type === SERVER_ACTIONS.OFFLOAD) {
                        self.pendingActions++;

                        let id = data.robot_id;
                        let r = data.robot_row;
                        let c = data.robot_col;

                        self.leftMenuVM.robotVM.offload(id, r, c);
                    }
                }

                for (let i = 0; i < logs.length; ++i) {
                    let l = logs[i];
                    let data = logs[i].data;

                    if (l.type === SERVER_LOGS.TASK_ASSIGNED) {
                        let robot_id = data.robot_id;
                        let robot_row = data.robot_row;
                        let robot_col = data.robot_col;
                        let rack_id = data.rack_id;
                        let rack_row = data.rack_row;
                        let rack_col = data.rack_col;

                        self.leftMenuVM.robotVM.assignTask(robot_id, robot_row, robot_col, rack_id, rack_row, rack_col);
                    } else if (l.type === SERVER_LOGS.ITEM_DELIVERED) {
                        let order_id = data.order_id;
                        let item_id = data.item_id;
                        let item_quantity = data.item_quantity;

                        self.orderVM.updateOrderDeliveredItems(order_id, item_id, item_quantity);
                    } else if (l.type === SERVER_LOGS.ORDER_FULFILLED) {
                        let order_id = data.order_id;

                        self.orderVM.finishOngoingOrder(order_id);
                    } else if (l.type === SERVER_LOGS.RACK_ADJUSTED) {
                        let rack_id = data.rack_id;
                        let rack_row = data.rack_row;
                        let rack_col = data.rack_col;
                        let item_id = data.item_id;
                        let item_quantity = data.item_quantity;

                        self.leftMenuVM.rackVM.adjustRack(rack_id, rack_row, rack_col, item_id, item_quantity);
                    }
                }

                for (let i = 0; i < statistics.length; ++i) {
                    // ToDo
                }
                break;

            case MSG_FROM_SERVER.MSG:
                self.shouter.notifySubscribers({text: msg.text, type: msg.type}, SHOUT_MSG);
                break;
        }
    };

    self.eventHandler = function (event) {
        switch (event.type) {
            case EVENT_FROM_GFX.CELL_CLICK:
                handleCellClick(event.row, event.col);
                break;

            case EVENT_FROM_GFX.ACK_ACTION:
                handleActionAck();
                break;

            case EVENT_FROM_GFX.CELL_DRAG:
                handleCellDrag(event.src_row, event.src_col, event.dst_row, event.dst_col);
                break;

            case EVENT_FROM_GFX.CELL_DELETE:
                handleCellDeleteClick(event.row, event.col);
                break;

            case EVENT_FROM_GFX.ESC:
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

    let handleCellDeleteClick = function (row, col) {
        self.leftMenuVM.handleCellDeleteClick(row, col);
    };

    let handleActionAck = function () {
        if (--self.pendingActions === 0) { // All actions are done
            comm.send({
                type: MSG_TO_SERVER.ACK_ACTION
            });
        }
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