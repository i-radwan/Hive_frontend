require("../utils/constants");
let ko = require('knockout');
let mapViewModel = require('./map_menu');
let tempViewModel = require('./temps_menu');

let leftMenuViewModel = function (shouter) {
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
    mapViewModel(shouter);
    tempViewModel(shouter);

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