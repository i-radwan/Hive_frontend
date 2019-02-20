const Utils = require("./utils");

let App = {
    init: function () {
        Utils.log("Init. the system!", 0);
    },

    run: function () {
        this.init();
    }
};

module.exports = App;