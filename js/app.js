// Includes
require("./utils/constants");
let $ = require('jquery');
let ko = require('knockout');

// Models
let Map = require('./models/map');

// ViewModels
let leftMenuViewModel = require("./view_models/left_menu");
let controlConsoleViewModel = require("./view_models/control_console");
let rightMenuViewModel = require("./view_models/right_menu");

// Apply the binding
$(document).ready(() => {
    // Initialization
    let map = new Map();

    let shouter = new ko.subscribable();

    let leftMenuVM = new leftMenuViewModel(shouter, map);
    let controlConsoleVM = new controlConsoleViewModel(shouter, map);
    let rightMenuVM = new rightMenuViewModel(shouter, map);

    ko.applyBindings(leftMenuVM, $("#left-menu")[0]);
    ko.applyBindings(controlConsoleVM, $("#control-console")[0]);
    ko.applyBindings(rightMenuVM, $("#right-menu")[0]);

    // GFX code

    // Communication logic

    // Simulation logic

});
