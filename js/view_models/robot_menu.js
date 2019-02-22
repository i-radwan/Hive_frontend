require("../utils/constants");
let ko = require('knockout');

let robotViewModel = function (shouter) {
    let self = this;

    self.id = ko.observable();
    self.color = ko.observable();
    self.loadCap = ko.observable();
    self.batteryCap = ko.observable();
    self.ip = ko.observable();
};

module.exports = robotViewModel;