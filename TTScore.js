/**
 * @class PingPong
 * @param {{}} params
 * @constructor
 */
var PingPong = function (params) {

    this.initialize(params);
};

/**
 * Initialization
 * @param {{}} params
 */
PingPong.prototype.initialize = function (params) {

    this.el = params.el;

    /*******************/
    /*private variables*/
    /*******************/

    this.gameStarted = false;
    this.waitingReady = false;

    this.clickState = {};

    this.initialService = '';
    this.playerLeftScore = 0;
    this.playerRightScore = 0;

    this.clickCoolDown = 750;
    this.lastClickTimestamp = {};
    this.cancelHoldDelay = 1500;
    this.cancelTimeoutCheck = null;

    this.clockStart = 0;
    this.clockInterval = null;

    /***********/
    /* runtime */
    /***********/

    this.initializeEvents();
    this.start();
};

/**
 * Bind events
 */
PingPong.prototype.initializeEvents = function () {

    $(document).on('contextmenu', function () {
        return false;
    });

    $(document).on('click', function (event) {

        event.preventDefault();
        event.stopPropagation();

        if (this.gameStarted) {

            var buttonId = event.which;

            /*check for cooldown*/

            if (
                typeof this.lastClickTimestamp[buttonId] === 'undefined'
                || ($.now() - this.lastClickTimestamp[buttonId]) > this.clickCoolDown
            ) {
                this.lastClickTimestamp[buttonId] = $.now();
                this.onClick(event);
            }
        }
    }.bind(this));

    $(document).on('mousedown', function (event) {

        var buttonId = event.which;
        this.clickState[buttonId] = true;

        if (this.waitingReady) {
            if (buttonId === 1) {
                this.el.find('#player-left-container').find('.ready').show();
            } else if (buttonId === 3) {
                this.el.find('#player-right-container').find('.ready').show();
            }

            if (this.clickState[1] === true && this.clickState[3] === true) {
                this.onStart();
            }
        } else if (this.gameStarted) {

            if (this.cancelTimeoutCheck !== null) {
                clearTimeout(this.cancelTimeoutCheck);
            }

            this.cancelTimeoutCheck = setTimeout(function () {

                if (this.clickState[buttonId] === true) {

                    this.lastClickTimestamp[buttonId] = $.now();
                    this.onLongClick(event);
                }

            }.bind(this), this.cancelHoldDelay);

        }

    }.bind(this));

    $(document).on('mouseup', function (event) {

        var buttonId = event.which;
        this.clickState[buttonId] = false;

        if (this.waitingReady) {
            if (buttonId === 1) {
                this.el.find('#player-left-container').find('.ready').hide();
            } else if (buttonId === 3) {
                this.el.find('#player-right-container').find('.ready').hide();
            }
        }

    }.bind(this));
};

PingPong.prototype.start = function () {

    this.gameStarted = false;

    this.initialService = '';
    this.playerLeftScore = 0;
    this.playerRightScore = 0;
    this.updateScore();

    this.clickState = {};
    this.waitingReady = true;
    this.el.find('#ready').show();
};

/**
 * Both players clicked "ready"
 */
PingPong.prototype.onStart = function () {

    this.waitingReady = false;
    this.el.find('.ready').hide();
    this.el.find('#ready').hide();

    this.initialService = Math.round(Math.random()) === 1 ? 'left' : 'right';
    this.changeService(this.initialService);
    this.el.find('#service').show();

    this.gameStarted = true;
    this.startClock();
};

/**
 * start clock
 */
PingPong.prototype.startClock = function () {

    this.clockStart = new Date().getTime();

    this.clockInterval = setInterval(function () {
        this.clockTick();
    }.bind(this), 1000);
};

/**
 * stop clock
 */
PingPong.prototype.stopClock = function () {

    clearInterval(this.clockInterval);
    this.el.find('[data-ui="time"]').html('00:00');
};

/**
 * stop the clock
 */
PingPong.prototype.clockTick = function () {

    var timelapse = Math.round((new Date().getTime() - this.clockStart) / 1000);

    var minutes = Math.floor(timelapse / 60);
    var seconds = timelapse - (minutes * 60);
    minutes = Math.min(minutes, 99);
    seconds = Math.min(Math.max(seconds, 0), 60);

    if (minutes < 10) {
        minutes = '0' + minutes;
    }

    if (seconds < 10) {
        seconds = '0' + seconds;
    }

    this.el.find('[data-ui="time"]').html(minutes + ':' + seconds);
};

/**
 * click detected
 * @param {{}} event
 */
PingPong.prototype.onClick = function (event) {

    switch (event.which) {

        case 1:
            this.addPoint('left');
            break;

        case 2:
            this.start();
            break;

        case 3:
            this.addPoint('right');
            break;
    }
};

/**
 * long click detected
 * @param {{}} event
 */
PingPong.prototype.onLongClick = function (event) {

    switch (event.which) {

        case 1:
            this.removePoint('left');
            break;

        case 3:
            this.removePoint('right');
            break;
    }
};

/**
 * add point
 * @param {string} player
 */
PingPong.prototype.addPoint = function (player) {

    if (player === 'left') {
        this.playerLeftScore++;
    } else if (player === 'right') {
        this.playerRightScore++;
    } else {
        return;
    }

    this.updateScore();
};

/**
 * remove point
 * @param {string} player
 */
PingPong.prototype.removePoint = function (player) {

    if (player === 'left') {
        this.playerLeftScore = Math.max(this.playerLeftScore - 1, 0);
    } else if (player === 'right') {
        this.playerRightScore = Math.max(this.playerRightScore - 1, 0);
    } else {
        return;
    }

    this.updateScore();
};

PingPong.prototype.updateScore = function () {

    /*update points*/

    var totalPoints = this.playerLeftScore + this.playerRightScore;

    if (totalPoints >= 20) {

        if (this.playerLeftScore === this.playerRightScore) {
            this.el.find('[data-ui="player-left-score"]').html(10);
            this.el.find('[data-ui="player-right-score"]').html(10);
        } else {

            if (Math.abs(this.playerLeftScore - this.playerRightScore) >= 2) {
                if (this.playerLeftScore > this.playerRightScore) {
                    this.el.find('[data-ui="player-left-score"]').html(11);
                } else {
                    this.el.find('[data-ui="player-right-score"]').html(11);
                }
            } else {
                if (this.playerLeftScore > this.playerRightScore) {
                    this.el.find('[data-ui="player-left-score"]').html('ADV');
                    this.el.find('[data-ui="player-right-score"]').html(10);
                } else {
                    this.el.find('[data-ui="player-left-score"]').html(10);
                    this.el.find('[data-ui="player-right-score"]').html('ADV');
                }
            }
        }

    } else {
        this.el.find('[data-ui="player-left-score"]').html(this.playerLeftScore);
        this.el.find('[data-ui="player-right-score"]').html(this.playerRightScore);
    }

    if (
        (this.playerLeftScore >= 11 && (this.playerLeftScore - this.playerRightScore) >= 2)
        || (this.playerRightScore >= 11 && (this.playerRightScore - this.playerLeftScore) >= 2)
    ) {
        this.gameOver();
        return;
    }

    if (totalPoints >= 20) {

        if (totalPoints % 2 === 0) {
            this.changeService(this.initialService === 'left' ? 'left' : 'right');
        } else {
            this.changeService(this.initialService === 'left' ? 'right' : 'left');
        }

    } else {

        /*update service*/

        totalPoints++;
        if (totalPoints % 2 !== 0) {
            totalPoints++;
        }

        if (totalPoints % 4 === 0) {
            this.changeService(this.initialService === 'left' ? 'right' : 'left');
        } else {
            this.changeService(this.initialService === 'left' ? 'left' : 'right');
        }
    }
};

/**
 * game over
 */
PingPong.prototype.gameOver = function () {

    this.stopClock();
    this.gameStarted = false;
    this.el.find('#service').hide();

    if (this.playerLeftScore > this.playerRightScore) {
        this.el.find('#player-left-container').find('.winner').show();
    } else {
        this.el.find('#player-right-container').find('.winner').show();
    }

    this.playSound('sounds/winner.wav');

    setTimeout(function () {

        this.el.find('.winner').hide();
        this.start();

    }.bind(this), 5000);
};

/**
 * change service
 * @param {string} side
 */
PingPong.prototype.changeService = function (side) {

    if (typeof playSound === 'undefined') {
        playSound = true;
    }

    var service = this.el.find('[data-ui="service"]');
    var servicePlayerLeftClass = 'service-player-left';
    var servicePlayerRightClass = 'service-player-right';

    var elementMoved = false;

    if (side === 'left') {

        if (service.hasClass(servicePlayerRightClass)) {
            service.removeClass(servicePlayerRightClass);
            elementMoved = true;
        }

        service.addClass(servicePlayerLeftClass);

    } else if (side === 'right') {

        if (service.hasClass(servicePlayerLeftClass)) {
            service.removeClass(servicePlayerLeftClass);
            elementMoved = true;
        }

        service.addClass(servicePlayerRightClass);
    }

    if (elementMoved && (this.playerLeftScore !== 0 || this.playerRightScore !== 0)) {
        this.playSound('sounds/change_service.wav');
    }
};

/**
 * this will play a sound
 *
 * @param {string} soundFile
 */
PingPong.prototype.playSound = function (soundFile) {

    var audioElement = this.el.find('.audioElement');
    if (audioElement.length === 0) {
        audioElement = $('<audio>');
        audioElement.addClass('audioElement').appendTo(this.el);
    }

    audioElement.attr('src', soundFile);
    audioElement[0].play();
};

/* jQuery wrapper */

$.fn.extend({
    pingPong: function (params) {

        if (typeof params !== 'object') {
            params = {};
        }

        params['el'] = $(this);
        return new PingPong(params);
    }
});
