// Includes
let $ = require('jquery');
let ko = require('knockout');
require("./utils/constants");

// ViewModels
let leftMenuViewModel = require("./view_models/left_menu");
let controlConsoleViewModel = require("./view_models/control_console");
let rightMenuViewModel = require("./view_models/right_menu");

// Apply the binding
$(document).ready(() => {
    let shouter = new ko.subscribable();

    let leftMenuVM = new leftMenuViewModel(shouter);
    let controlConsoleVM = new controlConsoleViewModel(shouter);
    let rightMenuVM = new rightMenuViewModel(shouter);

    ko.applyBindings(leftMenuVM, $("#left-menu")[0]);
    ko.applyBindings(controlConsoleVM, $("#control-console")[0]);
    ko.applyBindings(rightMenuVM, $("#right-menu")[0]);

    // GFX code
});
