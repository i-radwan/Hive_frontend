require('../utils/constants');

let Map = require('./map');

let State = function () {
    let self = this;

    self.map = new Map();
    self.items = [];
    self.orders = [];
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
        self.items = Object.assign({}, newState.items);
        self.orders = Object.assign({}, newState.orders);
        self.stock = Object.assign({}, newState.stock);
        self.map.setMap(newState.map.grid);

        // Update next IDs
        for (let i = 0; i < self.items.length; ++i) {
            self.nextIDs.item = Math.max(self.nextIDs.item, self.items[i].id);
        }

        for (let i = 0; i < self.map.height; ++i) {
            for (let j = 0; j < self.map.width; ++j) {
                let c = self.map.grid[i][j].facility;
                let r = self.map.grid[i][j].robot;

                if (c !== undefined) {
                    switch (c.type) {
                        case MAP_CELL.GATE:
                            self.nextIDs.gate = Math.max(self.nextIDs.gate, c.id);
                            break;
                        case MAP_CELL.RACK:
                            self.nextIDs.rack = Math.max(self.nextIDs.rack, c.id);
                            break;
                        case MAP_CELL.STATION:
                            self.nextIDs.station = Math.max(self.nextIDs.station, c.id);
                            break;
                        case MAP_CELL.OBSTACLE:
                            self.nextIDs.obstacle = Math.max(self.nextIDs.obstacle, c.id);
                            break;
                    }
                } else if (r !== undefined) {
                    self.nextIDs.robot = Math.max(self.nextIDs.robot, r.id);
                }
            }
        }
    };
};

module.exports = State;