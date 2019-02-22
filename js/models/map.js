require("../utils/constants");

let Map = function () {
    let self = this;

    self.height = MAP_INIT_HEIGHT;
    self.width = MAP_INIT_WIDTH;
    self.grid = [];

    /**
     * Changes map size.
     *
     * @param height    The new map height.
     * @param width     The new map width.
     * @param copyOld   Take the top-left corner of the original map.
     */
    self.changeMapSize = function (height, width, copyOld) {
        console.log("Updating the map h: " + height + " * w:" + width);

        let newGrid = new Array(height);

        for (let i = 0; i < height; i++) {
            newGrid[i] = new Array(width);
            for (let j = 0; j < width; j++) {
                newGrid[i][j] = {
                    type: MAP_CELL.EMPTY
                };
            }
        }

        if (copyOld === true) {
            for (let i = 0; i < Math.min(height, self.grid.length); i++) {
                for (let j = 0; j < Math.min(width, self.grid[i].length); j++) {
                    newGrid[i][j] = self.grid[i][j];
                }
            }
        }

        self.grid = newGrid;
    };

    /**
     * Sets the new map grid.
     *
     * @param newMap    The new map grid.
     */
    self.setMap = function (newMap) {
        console.log("Setting the map!");

        self.height = newMap.length;
        self.width = newMap[0].length;

        self.grid = new Array(self.height);

        for (let i = 0; i < self.height; i++) {
            self.grid[i] = new Array(self.width);

            for (let j = 0; j < self.width; j++) {
                self.grid[i][j] = newMap[i][j];
            }
        }
    };

    /**
     * Saves the map to the given file.
     *
     * @param path  The path to the file.
     */
    self.saveMap = function (path = "map.hive") {
        console.log(JSON.stringify(self, null, 2));
        fs.writeFile('./data.json', JSON.stringify(self, null, 2) , 'utf-8');
    };

    self.changeMapSize(self.height, self.width, false);
};

module.exports = Map;