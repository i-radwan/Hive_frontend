let Utils = function () {
    let self = this;

    self.secondsToFormattedTime = function (time) {
        let seconds = time;
        let minutes = 0;
        let hours = 0;

        if (seconds > 60) {
            minutes = Math.floor(seconds / 60);
            seconds -= minutes * 60;
        }

        if (minutes > 60) {
            hours = Math.floor(minutes / 60);
            minutes -= hours * 60;
        }

        let s = String(seconds);
        let m = String(minutes);
        let h = String(hours);

        if (seconds < 10) {
            s = "0" + s;
        }

        if (minutes < 10) {
            m = "0" + m;
        }

        if (hours < 10) {
            h = "0" + h;
        }

        return h + ":" + m + ":" + s;
    };
};

module.exports = Utils;