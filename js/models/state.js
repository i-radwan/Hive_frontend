require('../utils/constants');

let Map = require('./map');

let State = function () {
    let self = this;

    self.map = new Map();
    self.items = [];

    self.getItem = function (id) {
        for (let i = 0; i < self.items.length; ++i) {
            if (parseInt(self.items[i].id) === parseInt(id))
                return {id: id, weight: parseFloat(self.items[i].weight)};
        }

        return undefined;
    };

    self.adjustItemQuantity = function (id, quantity) {
        if (quantity <= 0)
            return;

        for (let i = 0; i < self.items.length; ++i) {
            if (parseInt(self.items[i].id) === parseInt(id) && self.items[i].quantity + quantity >= 0) {
                self.items[i].quantity += quantity;

                return true;
            }
        }

        return false;
    };
};

module.exports = State;