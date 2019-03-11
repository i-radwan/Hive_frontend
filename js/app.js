// Includes
require("./utils/constants");
let $ = require('jquery');
let ko = require('knockout');
let GFX = require('./gfx/gfx');
let communicator = require('./comm/comm');

// ViewModels
let mainViewModel = require("./view_models/main");

// Apply the binding
$(document).ready(() => {
    let gfx = new GFX();

    let comm = new communicator();

    let mainVM = new mainViewModel(gfx.eventHandler, comm.send);

    ko.applyBindings(mainVM, $("#main")[0]);

    // GFX code
    gfx.setLogicEventHandler(mainVM.eventHandler);

    // Communication logic
    let rcv = function (msg) {
        switch (msg.type) {
            case SERVER_EVENT_TYPE.OBJECT_UPDATE:
                gfx.eventHandler({
                    type: GFX_EVENT_TYPE.OBJECT_MOVE,
                    src_row: msg.src_row,
                    src_col: msg.src_col,
                    dst_row: msg.dst_row,
                    dst_col: msg.dst_col
                });
                break;
            case SERVER_EVENT_TYPE.LOG:
                mainVM.rightMenuVM.addLog(msg.level, msg.object, msg.text);
                break;
            case SERVER_EVENT_TYPE.STATS:
                mainVM.rightMenuVM.updateStats(msg.key, msg.value);
                break;
            case SERVER_EVENT_TYPE.MSG:
                shouter.notifySubscribers({text: msg.text, type: msg.log_type}, SHOUT_MSG);
                break;
        }
    };

    comm.connect(SERVER_IP, SERVER_PORT, rcv);

    // Simulation logic
});