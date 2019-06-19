require('../utils/constants');
require('../utils/strings');
const $ = require('jquery');
const ko = require('knockout');

const controlConsoleViewModel = require("./control_panel");
const settingsPanelViewModel = require("./settings_panel");

let controlPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, comm, logger) {
    let self = this;

    self.settingsVisible = ko.observable(false);

    self.controlConsoleVM = new controlConsoleViewModel(runningMode, shouter, state, gfxEventHandler, comm, logger);
    self.settingsVM = new settingsPanelViewModel(runningMode, shouter, state, gfxEventHandler, comm, logger);

    self.toggleSettings = function () {
        if (self.settingsVisible()) {
            $("#settings-icon").removeClass("rotated");
            $("#settings").slideUp({
                duration: 250,
                progress: function (a, p) {
                    if (p > 0.5) {
                        $(".map-row").removeClass("back");
                        $(".settings").removeClass("front");
                    }
                }
            });
        } else {
            $("#settings-icon").addClass("rotated");
            $("#settings").slideDown({
                duration: 250,
                progress: function (a, p) {
                    if (p > 0.5) {
                        $(".map-row").addClass("back");
                        $(".settings").addClass("front");
                    }
                }
            });
        }

        self.settingsVisible(!self.settingsVisible());
    };
};

module.exports = controlPanelViewModel;