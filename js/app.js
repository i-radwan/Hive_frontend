// Includes
const remote = require('electron').remote;
require("./utils/constants");
let $ = require('jquery');
let ko = require('knockout');
let GFX = require('./gfx/gfx');
let communicator = require('./comm/comm');
let serverMiddleWare = require('./comm/server_middleware');

// ViewModels
let mainViewModel = require("./view_models/main");

// Apply the binding
$(document).ready(() => {
    let gfx = new GFX();

    let comm = new communicator(new serverMiddleWare());

    let mainVM = new mainViewModel(gfx.eventHandler, comm);

    ko.applyBindings(mainVM, $("body")[0]);

    // GFX code
    gfx.setLogicEventHandler(mainVM.eventHandler);

    // Communication logic
    let rcv = function (msg) {
        mainVM.handleServerMsg(msg);
    };

    comm.rcv = rcv;

    // Configure title bar buttons
    $('.exit').on('click', e => {
        remote.getCurrentWindow().close();
    });

    $('.minimize').on('click', e => {
        remote.getCurrentWindow().minimize();
    });

    $('.zoom').on('click', e => {
        if (remote.getCurrentWindow().isMaximized())
            remote.getCurrentWindow().unmaximize();
        else
            remote.getCurrentWindow().maximize();
    });

    // Configure all text/number input fields
    $("input[type=text]").click(function () {
        this.select();
        this.setSelectionRange(0, this.value.length);
    });

    $("input[type=number]").click(function () {
        this.select();
    });
});