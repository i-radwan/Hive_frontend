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
    // TODO: replace with GFX
    let gfxEventHandler = function (event) {
        console.log(event);
    };

    let comm = new communicator(new serverMiddleWare());

    let mainVM = new mainViewModel(gfxEventHandler, comm);
    let gfx = new GFX();

    let mainVM = new mainViewModel(gfx.eventHandler);

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