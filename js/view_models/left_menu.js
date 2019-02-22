require("../utils/constants");
let ko = require('knockout');
let tempViewModel = require('./temps_menu');
let mapViewModel = require('./map_menu');
let entryViewModel = require('./entry_menu');
let robotViewModel = require('./robot_menu');
let rackViewModel = require('./rack_menu');
let parkViewModel = require('./park_menu');
let obstacleViewModel = require('./obstacle_menu');
let orderViewModel = require('./order_menu');

let leftMenuViewModel = function (shouter, map) {
    let self = this;

    self.activeMenu = ko.observable(LEFT_MENU.TEMPS);
    self.runningMode = ko.observable(RUNNING_MODE.DESIGN);

    /**
     * Handles menu tiles clicks.
     *
     * @param id   The id of the clicked tile from the LEFT_MENU enum.
     */
    self.menuItemClicked = function (id) {
        if (self.runningMode() === RUNNING_MODE.DESIGN) {
            if (id === LEFT_MENU.TEMPS) {
                self.tempsClicked();
            }
            else if (id === LEFT_MENU.MAP) {
                self.mapClicked();
            }
            else if (id === LEFT_MENU.ENTRY) {
                self.entryClicked();
            }
            else if (id === LEFT_MENU.RACK) {
                self.rackClicked();
            }
            else if (id === LEFT_MENU.OBSTACLE) {
                self.obstacleClicked();
            }
            else if (id === LEFT_MENU.ROBOT) {
                self.robotClicked();
            }
            else if (id === LEFT_MENU.PARK) {
                self.parkClicked();
            }
            else {
                return;
            }

            self.activeMenu(id);
        }
        else {
            if (id === LEFT_MENU.ORDER) {
                self.orderClicked();
                self.activeMenu(id);
            }
        }
    };

    self.tempsClicked = function () {

    };

    self.mapClicked = function () {

    };

    self.entryClicked = function () {

    };

    self.robotClicked = function () {

    };

    self.rackClicked = function () {

    };

    self.parkClicked = function () {

    };

    self.obstacleClicked = function () {

    };

    self.orderClicked = function () {

    };

    // Sub view models
    self.tempVM = new tempViewModel(shouter, map);
    self.mapVM = new mapViewModel(shouter, map);
    self.entryVM = new entryViewModel(shouter);
    self.robotVM = new robotViewModel(shouter);
    self.rackVM = new rackViewModel(shouter);
    self.parkVM = new parkViewModel(shouter);
    self.obstacleVM = new obstacleViewModel(shouter);
    self.orderVM = new orderViewModel(shouter);

    // Listen for mode change
    shouter.subscribe(function (runningMode) {
        if (runningMode) {
            self.activeMenu(LEFT_MENU.ORDER);
        }
        else {
            self.activeMenu(LEFT_MENU.TEMPS);
        }

        self.runningMode(runningMode);
    }, self, SHOUT_RUNNING_MODE);
};

module.exports = leftMenuViewModel;