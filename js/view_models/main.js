require("../utils/constants");
let ko = require("knockout");

// Models
let State = require("../models/state");

// ViewModels
let leftPanelViewModel = require("./left_panel");
let centerPanelViewModel = require("./center_panel");
let rightPanelViewModel = require("./right_panel");

let mainViewModel = function (gfxEventHandler, comm) {
    let self = this;

    self.state = new State();

    self.shouter = new ko.subscribable();

    self.runningMode = ko.observable(RUNNING_MODE.DESIGN);

    self.gfxEventHandler = gfxEventHandler;

    self.rightPanelVM = new rightPanelViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm.send);
    self.centerPanelVM = new centerPanelViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm, self.rightPanelVM.addLog);
    self.leftPanelVM = new leftPanelViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm.send, self.rightPanelVM.addLog);

    self.logger = self.rightPanelVM.addLog;

    self.pendingActions = 0; // No. of actions sent to graphics and waiting for their ACKs

    self.loadingVisible = ko.observable(false);

    self.setGFXEventHandler = function (gfxEventHandler) {
        self.gfxEventHandler = gfxEventHandler;
    };

    self.handleServerMsg = function (msg) {
        switch (msg.type) {
            case MSG_FROM_SERVER.ACK_CONFIG:
                self.centerPanelVM.controlConsoleVM.handleAckConfig(msg);
                break;

            case MSG_FROM_SERVER.ACK_RESUME:
                self.centerPanelVM.controlConsoleVM.handleAckResume(msg);
                break;

            case MSG_FROM_SERVER.ACK_ORDER:
                self.leftPanelVM.orderVM.handleAckOrder(msg);
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
                        self.leftPanelVM.robotVM.move(data.row, data.col);
                    } else if (a.type === SERVER_ACTIONS.ROTATE_RIGHT) {
                        self.leftPanelVM.robotVM.rotateRight(data.row, data.col);
                    } else if (a.type === SERVER_ACTIONS.ROTATE_LEFT) {
                        self.leftPanelVM.robotVM.rotateLeft(data.row, data.col);
                    } else if (a.type === SERVER_ACTIONS.RETREAT) {
                        self.leftPanelVM.robotVM.retreat(data.row, data.col);
                    } else if (a.type === SERVER_ACTIONS.BIND) {
                        self.leftPanelVM.robotVM.bind(data.id, data.row, data.col);
                    } else if (a.type === SERVER_ACTIONS.UNBIND) {
                        self.leftPanelVM.robotVM.unbind(data.id, data.row, data.col);
                    } else if (a.type === SERVER_ACTIONS.LOAD) {
                        self.leftPanelVM.robotVM.load(data.id, data.row, data.col);
                    } else if (a.type === SERVER_ACTIONS.OFFLOAD) {
                        self.leftPanelVM.robotVM.offload(data.id, data.row, data.col);
                    }

                    self.pendingActions++;
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

                        self.leftPanelVM.robotVM.assignTask(robot_id, robot_row, robot_col, rack_id, rack_row, rack_col);
                    } else if (l.type === SERVER_LOGS.ITEM_DELIVERED) {
                        let order_id = data.order_id;
                        let item_id = data.item_id;
                        let item_quantity = data.item_quantity;

                        self.leftPanelVM.orderVM.updateOrderDeliveredItems(order_id, item_id, item_quantity);
                    } else if (l.type === SERVER_LOGS.ORDER_FULFILLED) {
                        let id = data.id;
                        let order_fulfilled_time = data.fulfilled_time;

                        self.leftPanelVM.orderVM.finishOngoingOrder(id, order_fulfilled_time);
                    } else if (l.type === SERVER_LOGS.ORDER_ISSUED) {
                        let id = data.id;

                        self.leftPanelVM.orderVM.issueOrder(id);
                    } else if (l.type === SERVER_LOGS.ORDER_DELAYED) {
                        let id = data.id;

                        self.leftPanelVM.orderVM.delayOrder(id);
                    } else if (l.type === SERVER_LOGS.ORDER_RESUMED) {
                        let id = data.id;

                        self.leftPanelVM.orderVM.resumeOrder(id);
                    } else if (l.type === SERVER_LOGS.RACK_ADJUSTED) {
                        let rack_id = data.rack_id;
                        let rack_row = data.rack_row;
                        let rack_col = data.rack_col;
                        let items = data.items;

                        self.leftPanelVM.rackVM.adjustRack(rack_id, rack_row, rack_col, items);
                    } else if (l.type === SERVER_LOGS.BATTERY_UPDATED) {
                        let id = data.id;
                        let row = data.row;
                        let col = data.col;
                        let battery = data.battery;

                        self.leftPanelVM.robotVM.updateBattery(id, row, col, battery);
                    }
                }

                for (let i = 0; i < statistics.length; ++i) {
                    self.rightPanelVM.updateStats(statistics[i].key, statistics[i].value);
                }
                break;

            case MSG_FROM_SERVER.DEACTIVATE:
                self.leftPanelVM.robotVM.deactivateRobot(msg.data.row, msg.data.col);

                self.pendingActions--;
                break;

            case MSG_FROM_SERVER.ACTIVATE:
                self.leftPanelVM.robotVM.activateRobot(msg.data.row, msg.data.col);

                self.pendingActions++;
                break;

            case MSG_FROM_SERVER.MSG:
                self.shouter.notifySubscribers({text: msg.data.text, type: msg.data.type}, SHOUT.MSG);
                break;
        }
    };

    self.eventHandler = function (event) {
        switch (event.type) {
            case EVENT_FROM_GFX.CELL_CLICK:
                handleCellClick(event.row, event.col);
                break;

            case EVENT_FROM_GFX.CELL_DRAG:
                handleCellDrag(event.src_row, event.src_col, event.dst_row, event.dst_col);
                break;

            case EVENT_FROM_GFX.CELL_DELETE:
                handleCellDeleteClick(event.row, event.col);
                break;

            case EVENT_FROM_GFX.CELL_HOVER:
                handleCellHover(event.row, event.col);
                break;

            case EVENT_FROM_GFX.ACK_ACTION:
                handleActionAck();
                break;

            case EVENT_FROM_GFX.ESC:
                handleEsc();
                break;
        }
    };

    /**
     * Listens for robot activate/deactivate button click.
     *
     * {@link robotPanelViewModel#toggleActivation}
     */
    self.toggleActivation = function () {
        if (!self.leftPanelVM.robotVM.deactivated()) { // Deactivate the robot
            self.pendingActions--;
        } else {
            self.pendingActions++;
        }

        self.leftPanelVM.robotVM.toggleActivation();
    };

    let handleCellClick = function (row, col) {
        self.leftPanelVM.handleCellClick(row, col);
    };

    let handleCellDrag = function (srcRow, srcCol, dstRow, dstCol) {
        self.leftPanelVM.handleCellDrag(srcRow, srcCol, dstRow, dstCol);
    };

    let handleCellDeleteClick = function (row, col) {
        self.leftPanelVM.handleCellDeleteClick(row, col);
    };

    let handleCellHover = function (row, col) {
        self.centerPanelVM.controlConsoleVM.handleCellHover(row, col);
    };

    let handleActionAck = function (ack) {
        let data = ack.data;

        if (data.type === EVENT_TO_GFX.OBJECT_MOVE || data.type === EVENT_TO_GFX.OBJECT_RETREAT) {
            self.leftPanelVM.robotVM.updateRobotMovingState(id, data.data.row, data.data.col);
        }

        if (--self.pendingActions === 0) { // All actions are done
            comm.send({
                type: MSG_TO_SERVER.ACK
            });
        }
    };

    let handleEsc = function () {
        self.leftPanelVM.handleEsc();
        self.centerPanelVM.controlConsoleVM.handleEsc();
        self.rightPanelVM.handleEsc();

        gfxEventHandler({
            type: EVENT_TO_GFX.ESC
        });
    };

    gfxEventHandler({
        type: EVENT_TO_GFX.INIT,
        data: {
            width: self.state.map.width,
            height: self.state.map.height
        }
    });

    // Events
    self.shouter.subscribe(function (on) {
        self.loadingVisible(on);
    }, self, SHOUT.LOADING);
};

module.exports = mainViewModel;