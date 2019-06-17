require('../utils/constants');
require('../utils/strings');

let ServerMiddleWare = function () {
    let self = this;

    self.send = function(msg) {
        // ToDo: filter state
        // ToDo: filter order

        return msg;
    };

    self.receive = function (msg) {
        return msg;
    }
};

module.exports = ServerMiddleWare;