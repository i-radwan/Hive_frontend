require('../utils/constants');

let Map = require('./map');

let State = function () {
    let self = this;

    self.map = new Map();
    self.items = [];

    /**
     * Returns the weight of an item given its iD.
     *
     * @param id     The required item ID.
     * @return {*}   Item weight: if the item exists, -1 otherwise.
     */
    self.getItemWeight = function(id) {
        for (let i = 0; i < self.items.length; ++i) {
            if (parseInt(self.items[i].id) === parseInt(id))
                return parseFloat(self.items[i].weight);
        }

        return -1;
    }
};

module.exports = State;