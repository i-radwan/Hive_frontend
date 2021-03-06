require('../utils/constants');
require('../utils/strings');
const Map = require('./map');

let State = function () {
    let self = this;

    self.map = new Map();
    self.items = [];
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

    self.load = function (newState) {
        self.items = Object.assign([], newState.items);
        self.nextIDs = Object.assign({}, newState.nextIDs);
        self.map.setMap(newState.map.grid, newState.map.objects);
    };

    self.clear = function () {
        self.nextIDs = {
            gate: 1,
            robot: 1,
            rack: 1,
            station: 1,
            obstacle: 1,
            item: self.nextIDs.item // We don't reset the items here
        };

        self.map.clearMap();
    };
};

module.exports = State;