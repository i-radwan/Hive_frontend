require('../utils/constants');

let Map = require('./map');

let State = function () {
    let self = this;

    self.map = new Map();
    self.items = [];
    self.stock = {};
    self.nextIDs = { // Holds next IDs in the auto increment fashion
        gate: 1,
        robot: 1,
        rack: 1,
        station: 1,
        obstacle: 1,
        item: 1
    };

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

    self.load = function (newState) {
        self.items = Object.assign([], newState.items);
        self.stock = Object.assign({}, newState.stock);
        self.nextID = Object.assign({}, newState.nextID);
        self.map.setMap(newState.map.grid);
    };
};

module.exports = State;