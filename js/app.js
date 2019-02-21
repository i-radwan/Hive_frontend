// Includes
require("./utils/constants");
let $ = require('jquery');
let ko = require('knockout');
let GFX = require('./gfx/gfx');

// ViewModels
let leftMenuViewModel = require("./view_models/left_menu");
let controlConsoleViewModel = require("./view_models/control_console");
let rightMenuViewModel = require("./view_models/right_menu");

// Apply the binding
$(document).ready(() => {
    let shouter = new ko.subscribable();
    ko.applyBindings(new leftMenuViewModel(shouter), $("#left-menu")[0]);
    ko.applyBindings(new controlConsoleViewModel(shouter), $("#control-console")[0]);
    ko.applyBindings(new rightMenuViewModel(shouter), $("#right-menu")[0]);

    let gfx = new GFX();
});