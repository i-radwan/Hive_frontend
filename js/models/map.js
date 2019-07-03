require('../utils/constants');
require('../utils/strings');

let Map = function () {
    let self = this;

    self.height = MAP_INIT_HEIGHT;
    self.width = MAP_INIT_WIDTH;
    self.grid = [];
    self.objects = {}; // [id, type] ==> [row, col]

    self.changeMapSize = function (height, width, copyOld) {
        console.log("Updating the map h: " + height + " * w:" + width);

        let newGrid = new Array(height);

        for (let i = 0; i < height; i++) {
            newGrid[i] = new Array(width);

            for (let j = 0; j < width; j++) {
                newGrid[i][j] = {
                    objects: []
                };
            }
        }

        self.objects = {};

        if (copyOld === true) {
            for (let i = 0; i < Math.min(height, self.grid.length); i++) {
                for (let j = 0; j < Math.min(width, self.grid[i].length); j++) {
                    newGrid[i][j] = Object.assign({}, self.grid[i][j]);

                    let objs = self.grid[i][j].objects;

                    for (let k = 0; k < objs.length; k++) {
                        self.objects[[objs[k].id, objs[k].type]] = [i, j];
                    }
                }
            }
        }

        self.grid = newGrid;
        self.width = width;
        self.height = height;
    };

    self.setMap = function (newMap, newObjects) {
        // Note: loading the file as is could lead to inconsistency.
        console.log("Setting the map!");

        self.height = newMap.length;
        self.width = newMap[0].length;

        self.grid = new Array(self.height);

        for (let i = 0; i < self.height; i++) {
            self.grid[i] = new Array(self.width);

            for (let j = 0; j < self.width; j++) {
                self.grid[i][j] = Object.assign({}, newMap[i][j]);

                if (self.grid[i][j].type === MAP_CELL.ROBOT && self.grid[i][j].deactivated) {
                    throw "No robot should be saved as deactivated!";
                }
            }
        }

        self.objects = Object.assign({}, newObjects);
    };

    self.clearMap = function () {
        console.log("Setting the map!");

        self.grid = new Array(self.height);

        for (let i = 0; i < self.height; i++) {
            self.grid[i] = new Array(self.width);

            for (let j = 0; j < self.width; j++) {
                self.grid[i][j] = {
                    objects: []
                };
            }
        }

        self.objects = [];
    };

    self.isFree = function(r, c) {
        return self.grid[r][c].objects.length === 0;
    };

    self.isRobotFree = function(r, c) {
        let objs = self.grid[r][c].objects;
        let objsLen = objs.length;

        for (let i = 0; i < objsLen; ++i) {
            if (objs[i].type === MAP_CELL.ROBOT)
                return false;
        }

        return true;
    };

    self.addObject = function(r, c, obj) {
        self.grid[r][c].objects.push(obj);

        self.objects[[obj.id, obj.type]] = [r, c];
    };

    self.updateObject = function(r, c, obj) {
        let objs = self.grid[r][c].objects;
        let objsLen = objs.length;

        for (let i = 0; i < objsLen; ++i) {
            if (objs[i].type === obj.type && objs[i].id === obj.id) {
                objs[i] = obj;

                self.objects[[obj.id, obj.type]] = [r, c];

                return;
            }
        }

        throw "The object to be updated was not found " + obj;
    };

    self.deleteObject = function(r, c, obj) {
        let objs = self.grid[r][c].objects;
        let objsLen = objs.length;

        for (let i = 0; i < objsLen; ++i) {
            if (objs[i].type === obj.type && objs[i].id === obj.id) {
                objs.splice(i, 1);

                delete self.objects[[obj.id, obj.type]];

                return;
            }
        }

        throw "The object to be deleted was not found " + obj;
    };

    self.getObject = function(r, c, type) {
        let objs = self.grid[r][c].objects;
        let objsLen = objs.length;

        for (let i = 0; i < objsLen; ++i) {
            if (objs[i].type === type) {
                return objs[i];
            }
        }

        return undefined;
    };

    self.getCellObjects = function(r, c) {
        return self.grid[r][c].objects;
    };

    self.moveObject = function(r, c, nr, nc, obj) {
        self.deleteObject(r, c, obj);
        self.addObject(nr, nc, obj);
    };

    self.getObjectPos = function(id, type) {
        return self.objects[[id, type]];
    };

    self.getRobot = function(r, c) {
        return self.getObject(r, c, MAP_CELL.ROBOT);
    };

    self.getInvalidIPRobot = function() {
        for (const [k, v] of Object.entries(self.objects)) {
            let key = k.split(",");

            if (parseInt(key[1]) !== MAP_CELL.ROBOT)
                continue;

            let rob = self.getRobot(v[0], v[1]);

            if (!rob.ip.match(REG_IP)) {
                return [v[0], v[1]];
            }
        }

        return undefined;
    };

    self.isFacilityFree = function(r, c) {
        let objs = self.grid[r][c].objects;
        let objsLen = objs.length;

        for (let i = 0; i < objsLen; ++i) {
            if (objs[i].type === MAP_CELL.RACK || objs[i].type === MAP_CELL.OBSTACLE ||
                objs[i].type === MAP_CELL.STATION || objs[i].type === MAP_CELL.GATE)
                return false;
        }

        return true;
    };

    self.getFacility = function(r, c) {
        let objs = self.grid[r][c].objects;
        let objsLen = objs.length;

        for (let i = 0; i < objsLen; ++i) {
            if (objs[i].type === MAP_CELL.RACK || objs[i].type === MAP_CELL.OBSTACLE ||
                objs[i].type === MAP_CELL.STATION || objs[i].type === MAP_CELL.GATE)
                return objs[i];
        }

        return undefined;
    };

    self.getSpecificFacility = function(r, c, type) {
        return self.getObject(r, c, type);
    };

    self.getItemRack = function(id) {
        for (const [k, v] of Object.entries(self.objects)) {
            let key = k.split(",");

            if (parseInt(key[1]) !== MAP_CELL.RACK)
                continue;

            let rack = self.getSpecificFacility(v[0], v[1], parseInt(key[1]));

            for (let k = 0; k < rack.items.length; ++k) {
                if (rack.items[k].id === id) {
                    return {
                        id: rack.id,
                        row: v[0],
                        col: v[1]
                    };
                }
            }
        }

        return undefined;
    };

    self.getBindableFacility = function(r, c) {
        let objs = self.grid[r][c].objects;
        let objsLen = objs.length;

        for (let i = 0; i < objsLen; ++i) {
            if (objs[i].type === MAP_CELL.STATION || objs[i].type === MAP_CELL.GATE) {
                if (objs[i].bound === true)
                    continue;

                return objs[i];
            }
        }

        return undefined;
    };

    self.getBoundFacility = function(r, c) {
        let objs = self.grid[r][c].objects;
        let objsLen = objs.length;

        for (let i = 0; i < objsLen; ++i) {
            if (objs[i].type === MAP_CELL.STATION || objs[i].type === MAP_CELL.GATE) {
                if (objs[i].bound === true)
                    return objs[i];
            }
        }

        return undefined;
    };

    self.getObjects = function() {
        let objs = [];
        let cells = {};

        for (const [k, v] of Object.entries(self.objects)) {
            cells[[v[0], v[1]]] = true;
        }

        for (const [k, v] of Object.entries(cells)) {
            let key = k.split(",");

            let c = self.grid[key[0]][key[1]];

            for (let k = 0; k < c.objects.length; k++) {
                let obj = Object.assign({}, c.objects[k]);

                obj.row = parseInt(key[0]);
                obj.col = parseInt(key[1]);

                objs.push(obj);
            }
        }

        return objs;
    };

    self.changeMapSize(self.height, self.width, false);
};

module.exports = Map;