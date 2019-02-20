let Utils = {
    level: 0,

    log: function (msg, level) {
        if (level >= level)
            console.log(msg);
    }
};

module.exports = Utils;