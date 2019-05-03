// Includes
require("./utils/constants");
let $ = require('jquery');
let ko = require('knockout');
let communicator = require('./comm/comm');
let serverMiddleWare = require('./comm/server_middleware');
let GFX = require('./gfx/gfx');

// ViewModels
let mainViewModel = require("./view_models/main");

// Apply the binding
$(document).ready(() => {
    let gfx = new GFX();

    let comm = new communicator(new serverMiddleWare());

    let mainVM = new mainViewModel(gfx.eventHandler, comm);

    ko.applyBindings(mainVM, $("#main")[0]);

    // GFX code
    gfx.setLogicEventHandler(mainVM.eventHandler);

    // Communication logic
    let rcv = function (msg) {
        mainVM.handleServerMsg(msg);
    };

    comm.rcv = rcv;

    // Simulation logic
});