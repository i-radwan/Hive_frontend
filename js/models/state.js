require("../utils/constants");

let Map = require('./map');

let State = function () {
    let self = this;

    self.map = new Map();
    self.items = [];

    self.getItemWeight = function(id) {
        for (let i = 0; i < self.items.length; ++i) {
            if (parseInt(self.items[i].id) === parseInt(id))
                return self.items[i].weight;
        }

        return -1;
    }
};

module.exports = State;