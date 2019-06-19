require('../utils/constants');
const ko = require("knockout");

// Models
const State = require("../models/state");

// ViewModels
const leftPanelViewModel = require("./left_panel");
const centerPanelViewModel = require("./center_panel");
const rightPanelViewModel = require("./right_panel");

let mainViewModel = function (gfxEventHandler, comm) {
    let self = this;

    self.state = new State();

    self.time = ko.observable(0);

    self.shouter = new ko.subscribable();

    self.runningMode = ko.observable(RUNNING_MODE.DESIGN);

    self.gfxEventHandler = gfxEventHandler;

    self.rightPanelVM = new rightPanelViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm.send);
    self.centerPanelVM = new centerPanelViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm, self.rightPanelVM.addLog);
    self.leftPanelVM = new leftPanelViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm.send, self.rightPanelVM.addLog);

    self.logger = self.rightPanelVM.addLog;

    self.pendingActions = []; // No. of actions sent to graphics and waiting for their ACKs

    self.loadingVisible = ko.observable(false);

    let incrementTimeInterval;

    self.setGFXEventHandler = function (gfxEventHandler) {
        self.gfxEventHandler = gfxEventHandler;
    };

    self.handleServerMsg = function (msg) {
        console.log("Received:", JSON.stringify(msg));

        switch (msg.type) {
            case MSG_FROM_SERVER.ACK_START:
                self.centerPanelVM.controlConsoleVM.handleAckStart(msg);
                break;

            case MSG_FROM_SERVER.ACK_RESUME:
                self.centerPanelVM.controlConsoleVM.handleAckResume(msg);
                break;

            case MSG_FROM_SERVER.ACK_ORDER:
                self.leftPanelVM.orderVM.handleAckOrder(msg);
                break;

            case MSG_FROM_SERVER.UPDATE:
                self.timestep = msg.data.timestep;
                self.state.timestep = self.timestep;

                self.pendingActions = [];

                let actions = msg.data.actions;
                let logs = msg.data.logs;
                let statistics = msg.data.statistics;

                // Push the actions to pendingActions before calling the gfx library
                // because if the gfx changed an action (e.g. load), while we are still processing here
                // we will have race condition between here and handleAckAction function.
                for (let i = 0; i < actions.length; ++i) {
                    let data = actions[i].data;

                    self.pendingActions.push(data.id);
                }

                // We have to check here, because if we checked after calling the gfx lib, and gfx
                // lib has already called handleAckAction, we may enter this block, because the
                // pendingActions is now empty, even though it contained actions at the beginning.
                // This will cause sending ACK twice.
                if (self.pendingActions.length === 0) {
                    comm.send({
                        type: MSG_TO_SERVER.ACK
                    });

                    console.log("ACK sent");
                }

                for (let i = 0; i < actions.length; ++i) {
                    let a = actions[i];
                    let data = actions[i].data;

                    if (a.type === SERVER_ACTIONS.MOVE) {
                        self.leftPanelVM.robotVM.move(data.id);
                    } else if (a.type === SERVER_ACTIONS.ROTATE_RIGHT) {
                        self.leftPanelVM.robotVM.rotateRight(data.id);
                    } else if (a.type === SERVER_ACTIONS.ROTATE_LEFT) {
                        self.leftPanelVM.robotVM.rotateLeft(data.id);
                    } else if (a.type === SERVER_ACTIONS.RETREAT) {
                        self.leftPanelVM.robotVM.retreat(data.id);
                    } else if (a.type === SERVER_ACTIONS.BIND) {
                        self.leftPanelVM.robotVM.bind(data.id);
                    } else if (a.type === SERVER_ACTIONS.UNBIND) {
                        self.leftPanelVM.robotVM.unbind(data.id);
                    } else if (a.type === SERVER_ACTIONS.LOAD) {
                        self.leftPanelVM.robotVM.load(data.id);
                    } else if (a.type === SERVER_ACTIONS.OFFLOAD) {
                        self.leftPanelVM.robotVM.offload(data.id);
                    }
                }

                for (let i = 0; i < logs.length; ++i) {
                    let l = logs[i];
                    let data = logs[i].data;

                    if (l.type === SERVER_LOGS.TASK_ASSIGNED) {
                        let robotID = data.robot_id;
                        let rackID = data.rack_id;

                        self.leftPanelVM.robotVM.assignTask(robotID, rackID);
                    } else if (l.type === SERVER_LOGS.TASK_COMPLETED) {
                        let orderID = data.order_id;
                        let rackID = data.rack_id;
                        let items = data.items;

                        self.leftPanelVM.rackVM.adjustRack(rackID, items);
                        self.leftPanelVM.orderVM.updateOrderDeliveredItems(orderID, items);
                    } else if (l.type === SERVER_LOGS.ORDER_FULFILLED) {
                        console.log("Data", data);
                        let id = data.id;

                        self.leftPanelVM.orderVM.finishOngoingOrder(id);
                    } else if (l.type === SERVER_LOGS.ORDER_ISSUED) {
                        let id = data.id;

                        self.leftPanelVM.orderVM.issueOrder(id);
                    } else if (l.type === SERVER_LOGS.BATTERY_UPDATED) {
                        let id = data.id;
                        let battery = data.battery;

                        self.leftPanelVM.robotVM.updateBattery(id, battery);
                    }
                }

                for (let i = 0; i < statistics.length; ++i) {
                    self.rightPanelVM.updateStats(statistics[i].key, statistics[i].value);
                }
                break;

            case MSG_FROM_SERVER.CONTROL:
                if (msg.data.type === CONTROL_MSG.ACTIVATE) {
                    self.leftPanelVM.robotVM.activateRobots(msg.data.ids);
                } else if (msg.data.type === CONTROL_MSG.DEACTIVATE) {
                    self.leftPanelVM.robotVM.deactivateRobots(msg.data.ids);

                    // Remove from pendingActions if it exists there
                    for (let i = 0; i < msg.data.ids.length; i++) {
                        reducePendingActions(self.pendingActions, msg.data.ids[i]);
                    }
                }
                break;

            case MSG_FROM_SERVER.MSG:
                self.shouter.notifySubscribers({
                    text: STR[data.msg.id](data.msg.args),
                    title: data.msg.reason,
                    type: msg.data.status
                }, SHOUT.MSG);

                if (msg.data.status === MSG_TYPE.ERROR) {
                    self.centerPanelVM.controlConsoleVM.stop();
                }
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
                handleActionAck(event.data);
                break;

            case EVENT_FROM_GFX.ESC:
                handleEsc();
                break;
        }
    };

    self.toggleActivation = function () {
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

    let handleActionAck = function (data) {
        if (data.type === EVENT_TO_GFX.OBJECT_MOVE || data.type === EVENT_TO_GFX.OBJECT_RETREAT) {
            self.leftPanelVM.robotVM.doneMoving(data.data.id);
        }

        reducePendingActions(data.data.id);
    };

    let handleEsc = function () {
        self.leftPanelVM.handleEsc();
        self.centerPanelVM.controlConsoleVM.handleEsc();
        self.rightPanelVM.handleEsc();

        gfxEventHandler({
            type: EVENT_TO_GFX.ESC
        });
    };

    let reducePendingActions = function (elm) {
        if (self.pendingActions.length === 0)
            return;

        let index = self.pendingActions.indexOf(elm);

        if (index > -1) {
            self.pendingActions.splice(index, 1);
        }

        if (self.pendingActions.length === 0) { // All actions are done
            comm.send({
                type: MSG_TO_SERVER.ACK
            });

            console.log("ACK sent");
        }
    };

    let incrementTime = function () {
        if (self.runningMode() === RUNNING_MODE.SIMULATE || self.runningMode() === RUNNING_MODE.DEPLOY) {
            self.time(self.time() + 1);

            self.centerPanelVM.controlConsoleVM.time(self.time());
            self.leftPanelVM.orderVM.incrementTime();
        }
    };

    // Events
    self.shouter.subscribe(function (on) {
        self.loadingVisible(on);
    }, self, SHOUT.LOADING);

    self.shouter.subscribe(function () {
        handleEsc();
    }, self, SHOUT.ESC);

    self.runningMode.subscribe(function (newRunningMode) {
        console.log("MODE", newRunningMode);

        if (newRunningMode === RUNNING_MODE.DESIGN) {
            self.time(0);
            self.centerPanelVM.controlConsoleVM.time(0);
            self.leftPanelVM.orderVM.time(0);

            self.loadingVisible(false);

            clearInterval(incrementTimeInterval);
        } else {
            clearInterval(incrementTimeInterval);
            incrementTimeInterval = setInterval(incrementTime, 1000);
        }
    });

    gfxEventHandler({
        type: EVENT_TO_GFX.INIT,
        data: {
            width: self.state.map.width,
            height: self.state.map.height
        }
    });
};

module.exports = mainViewModel;