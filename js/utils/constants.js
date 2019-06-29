SERVER_IP = "127.0.0.1";
SERVER_PORT = 1337;

RECONNECT_INTERVAL = 150;   // ms

MIN_TIMESTEP = 1000;        // ms

//
// Shouting codes
//
SHOUT = {
    STATE_UPDATED: 0,
    MSG: 1,
    LOADING: 2,
    ESC: 3
};

//
// Running modes
//
RUNNING_MODE = {
    DESIGN: 0,
    SIMULATE: 1,
    DEPLOY: 2,
    PAUSE: 3
};

// Panels
LEFT_PANEL = {
    EMPTY: 0,
    TEMPS: 1,
    MAP: 2,
    GATE: 3,
    ROBOT: 4,
    RACK: 5,
    STATION: 6,
    OBSTACLE: 7,
    ORDER: 8
};

RIGHT_PANEL = {
    EMPTY: 0,
    LOGS: 1,
    STATS: 2,
    ITEMS: 3
};

ORDER_PANEL = {
    ADD: 0,
    ONGOING: 1,
    UPCOMING: 2,
    FINISHED: 3
};

// Map
MAP_INIT_WIDTH = 17;
MAP_INIT_HEIGHT = 10;
MAP_CELL = {
    GATE: 0,
    ROBOT: 1,
    RACK: 2,
    STATION: 3,
    OBSTACLE: 4
};

// Msgs configs
MSG_TIMEOUT = 2500; // ms

// Msgs types
MSG_TYPE = {
    INFO: 0,
    ERROR: 1
};

// Logs levels
LOG_LEVEL = {
    INFO: 0,
    WARNING: 1,
    ERROR: 2
};

LOG_TYPE = {
    ROBOT: 0,
    RACK: 1,
    ORDER: 2,
    TEXT: 3
};

// Regex
REG_HTML_COLOR = "^#([A-Fa-f0-9]{6})$";
REG_IP = "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$";

RACK_INIT_CAP = 250;
RACK_INIT_WEIGHT = 50;

ORDER_TYPE = {
    COLLECT: 0,
    REFILL: 1
};

ORDER_STATUS = {
    ONGOING: 0,
    UPCOMING: 1,
    FINISHED: 2
};

UPCOMING_ORDERS_CONSUMPTION_INTERVAL = 1000 * 60; // 1 Min

ROBOT_DIR_CNT = 4;
ROBOT_DIR = {
    RIGHT: 0,
    UP: 1,
    LEFT: 2,
    DOWN: 3
};

ROW_DELTA = [0, -1, 0, 1];
COL_DELTA = [1, 0, -1, 0];

LOW_BATTERY_LEVEL = 4;


// Server Msgs
START_MODE = {
    SIMULATE: 0,
    DEPLOY: 1
};

ACK_START_STATUS = {
    OK: 0,
    ERROR: 1
};

ACK_RESUME_STATUS = {
    OK: 0,
    ERROR: 1
};

ACK_ORDER_STATUS = {
    OK: 0,
    ERROR: 1
};

CONTROL_MSG = {
    ACTIVATE: 0,
    DEACTIVATE: 1
};

MSG_TO_SERVER = {
    START: 0,
    STOP: 1,
    PAUSE: 2,
    RESUME: 3,
    ORDER: 4,
    CONTROL: 5,
    DONE: 6
};

MSG_FROM_SERVER = {
    ACK_START: 0,
    ACK_RESUME: 1,
    ACK_ORDER: 2,
    ACTION: 3,
    LOG: 4,
    CONTROL: 5,
    MSG: 6
};

SERVER_ACTIONS = {
    STOP: 0,
    MOVE: 1,
    ROTATE_RIGHT: 2,
    ROTATE_LEFT: 3,
    RETREAT: 4,
    LOAD: 5,
    OFFLOAD: 6,
    BIND: 7,
    UNBIND: 8
};

SERVER_LOGS = {
    TASK_ASSIGNED: 0,
    TASK_COMPLETED: 1,
    ORDER_FULFILLED: 2,
    BATTERY_UPDATED: 3
};

//
// GFX
//
GRID_CELL_LENGTH = 50;
MAX_ZOOM_LENGTH = 30 * GRID_CELL_LENGTH;
MIN_ZOOM_LENGTH = GRID_CELL_LENGTH;
KEYBOARD_DRAG_SPEED = 0.5;

ARROW = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
};

KEY_CODE = {
    F5: 116,
    DELETE: 46,
    ESC: 27,
    CTRL: 17,
    SPACE: 32
};

MOVING_SPEED = 0.5;
ROTATING_SPEED = 1.5;
FLASHING_SPEED = 50;

ANIMATION_TYPE = {
    MOVE_RIGHT: 1,
    MOVE_LEFT: 2,
    MOVE_UP: 3,
    MOVE_DOWN: 4,
    MOVE: 5,
    ROTATE_RIGHT: 6,
    ROTATE_LEFT: 7,
    RETREAT: 8
};

LED_COLOR_MODE = {
    OFF: 0,
    ON: 1,
    FLASH: 2
};

CURSOR_STYLES = {
    CROSS: "move",
    DEFAULT: "default",
    POINTER: "pointer",
    CAN_GRAB: "grab",
    GRABBING: "grabbing"
};

// GFX Events
EVENT_FROM_GFX = {
    CELL_CLICK: 0,
    CELL_DRAG: 1,
    CELL_DELETE: 2,
    CELL_HOVER: 3,
    DONE: 4,
    ESC: 5
};

EVENT_TO_GFX = {
    INIT: 0,
    OBJECT_HOVER: 1,
    OBJECT_ADD: 2,
    OBJECT_DELETE: 3,
    OBJECT_DRAG: 4,
    OBJECT_MOVE: 5,
    OBJECT_ROTATE_RIGHT: 6,
    OBJECT_ROTATE_LEFT: 7,
    OBJECT_RETREAT: 8,
    OBJECT_HIGHLIGHT: 9,
    OBJECT_UNHIGHLIGHT: 10,
    OBJECT_COLORIZE: 11,
    OBJECT_DECOLORIZE: 12,
    OBJECT_LED_COLORIZE: 13,
    OBJECT_BIND: 14,
    OBJECT_UNBIND: 15,
    OBJECT_LOAD: 16,
    OBJECT_OFFLOAD: 17,
    OBJECT_FAILURE: 18,
    OBJECT_STOP: 19,
    OBJECT_FIXED: 20,
    OBJECT_UPDATE: 21,
    SIMULATION_START: 22,
    SIMULATION_PAUSE: 23,
    SIMULATION_RESUME: 24,
    SIMULATION_STOP: 25,
    ESC: 26
};

// GFX SVG models
GFX_SVG_MODEL = {
    ROBOT: [
        '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>robot_0</title><path class="led_body" d="M37.5,40.6a20,20,0,0,0,0-31.2V40.6Zm3.75-16.1a0.5,0.5,0,1,1-.5.5A0.5,0.5,0,0,1,41.25,24.5Z" fill="#bababa"/><circle cx="41.25" cy="25" r="0.5" fill="#1d1d1e"/><path d="M5,25A20,20,0,0,0,37.5,40.6V25A12.5,12.5,0,1,1,25,12.5,12.5,12.5,0,0,1,37.5,25V9.4A20,20,0,0,0,5,25Z" fill="#505051"/></svg>',
        '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>robot_10</title><path d="M34.25,16.61V33.39A12.45,12.45,0,0,0,34.25,16.61Z" fill="none"/><path class="robot_body" d="M37.5,25V9.4a20.13,20.13,0,0,0-3.25-2.11v9.32A12.44,12.44,0,0,1,37.5,25Z" fill="#df9626"/><path class="robot_body" d="M34.25,33.39v9.32A20.13,20.13,0,0,0,37.5,40.6V25A12.44,12.44,0,0,1,34.25,33.39Z" fill="#df9626"/><path class="led_body" d="M37.5,40.6a20,20,0,0,0,0-31.2V40.6Zm3.75-16.1a0.5,0.5,0,1,1-.5.5A0.5,0.5,0,0,1,41.25,24.5Z" fill="#bababa"/><circle cx="41.25" cy="25" r="0.5" fill="#1d1d1e"/><path d="M5,25A20,20,0,0,0,34.25,42.71V33.39a12.5,12.5,0,1,1,0-16.77V7.29A20,20,0,0,0,5,25Z" fill="#505051"/></svg>',
        '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>robot_20</title><path d="M37.5,25A12.5,12.5,0,0,0,31,14V36A12.5,12.5,0,0,0,37.5,25Z" fill="none"/><path class="robot_body" d="M37.5,25V9.4A20,20,0,0,0,31,5.94V14A12.5,12.5,0,0,1,37.5,25Z" fill="#df9626"/><path class="robot_body" d="M31,36v8.1a20,20,0,0,0,6.5-3.46V25A12.5,12.5,0,0,1,31,36Z" fill="#df9626"/><path class="led_body" d="M37.5,40.6a20,20,0,0,0,0-31.2V40.6Zm3.75-16.1a0.5,0.5,0,1,1-.5.5A0.5,0.5,0,0,1,41.25,24.5Z" fill="#bababa"/><circle cx="41.25" cy="25" r="0.5" fill="#1d1d1e"/><path d="M5,25A20,20,0,0,0,31,44.06V36A12.5,12.5,0,1,1,31,14V5.94A20,20,0,0,0,5,25Z" fill="#505051"/></svg>',
        '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>robot_30</title><path d="M37.5,25a12.5,12.5,0,0,0-9.75-12.19V37.19A12.5,12.5,0,0,0,37.5,25Z" fill="none"/><path class="robot_body" d="M37.5,25V9.4a19.92,19.92,0,0,0-9.75-4.19v7.61A12.5,12.5,0,0,1,37.5,25Z" fill="#df9626"/><path class="robot_body" d="M27.75,37.19v7.61A19.92,19.92,0,0,0,37.5,40.6V25A12.5,12.5,0,0,1,27.75,37.19Z" fill="#df9626"/><path class="led_body" d="M37.5,40.6a20,20,0,0,0,0-31.2V40.6Zm3.75-16.1a0.5,0.5,0,1,1-.5.5A0.5,0.5,0,0,1,41.25,24.5Z" fill="#bababa"/><circle cx="41.25" cy="25" r="0.5" fill="#1d1d1e"/><path d="M5,25A19.89,19.89,0,0,0,27.75,44.79V37.19a12.5,12.5,0,1,1,0-24.37V5.21A19.89,19.89,0,0,0,5,25Z" fill="#505051"/></svg>',
        '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>robot_40</title><path d="M37.5,25A12.5,12.5,0,0,0,25,12.5l-0.5,0V37.47l0.5,0A12.5,12.5,0,0,0,37.5,25Z" fill="none"/><path class="robot_body" d="M25,12.5A12.5,12.5,0,0,1,37.5,25V9.4A19.9,19.9,0,0,0,25,5L24.5,5v7.5Z" fill="#df9626"/><path class="robot_body" d="M25,37.5l-0.5,0V45L25,45a19.9,19.9,0,0,0,12.5-4.4V25A12.5,12.5,0,0,1,25,37.5Z" fill="#df9626"/><path class="led_body" d="M37.5,40.6a20,20,0,0,0,0-31.2V40.6Zm3.75-16.1a0.5,0.5,0,1,1-.5.5A0.5,0.5,0,0,1,41.25,24.5Z" fill="#bababa"/><circle cx="41.25" cy="25" r="0.5" fill="#1d1d1e"/><path d="M5,25A20,20,0,0,0,24.5,45v-7.5a12.48,12.48,0,0,1,0-24.95V5A20,20,0,0,0,5,25Z" fill="#505051"/></svg>',
        '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>robot_50</title><path d="M37.5,25A12.5,12.5,0,0,0,21.25,13.07V36.93A12.5,12.5,0,0,0,37.5,25Z" fill="none"/><path class="robot_body" d="M25,37.5a12.49,12.49,0,0,1-3.75-.57v7.71a19.86,19.86,0,0,0,16.25-4V25A12.5,12.5,0,0,1,25,37.5Z" fill="#df9626"/><path class="robot_body" d="M25,12.5A12.5,12.5,0,0,1,37.5,25V9.4a19.86,19.86,0,0,0-16.25-4v7.71A12.49,12.49,0,0,1,25,12.5Z" fill="#df9626"/><path class="led_body" d="M37.5,40.6a20,20,0,0,0,0-31.2V40.6Zm3.75-16.1a0.5,0.5,0,1,1-.5.5A0.5,0.5,0,0,1,41.25,24.5Z" fill="#bababa"/><circle cx="41.25" cy="25" r="0.5" fill="#1d1d1e"/><path d="M5,25A20,20,0,0,0,21.25,44.64V36.93a12.5,12.5,0,0,1,0-23.85V5.36A20,20,0,0,0,5,25Z" fill="#505051"/></svg>',
        '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>robot_60</title><path d="M37.5,25A12.5,12.5,0,0,0,18,14.64V35.36A12.5,12.5,0,0,0,37.5,25Z" fill="none"/><path class="robot_body" d="M25,12.5A12.5,12.5,0,0,1,37.5,25V9.4A19.87,19.87,0,0,0,18,6.28v8.36A12.44,12.44,0,0,1,25,12.5Z" fill="#df9626"/><path class="robot_body" d="M25,37.5a12.44,12.44,0,0,1-7-2.14v8.36A19.87,19.87,0,0,0,37.5,40.6V25A12.5,12.5,0,0,1,25,37.5Z" fill="#df9626"/><path class="led_body" d="M37.5,40.6a20,20,0,0,0,0-31.2V40.6Zm3.75-16.1a0.5,0.5,0,1,1-.5.5A0.5,0.5,0,0,1,41.25,24.5Z" fill="#bababa"/><circle cx="41.25" cy="25" r="0.5" fill="#1d1d1e"/><path d="M5,25A20,20,0,0,0,18,43.72V35.36a12.5,12.5,0,0,1,0-20.71V6.28A20,20,0,0,0,5,25Z" fill="#505051"/></svg>',
        '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>robot_70</title><path d="M25,37.5A12.5,12.5,0,1,0,14.75,17.86V32.14A12.48,12.48,0,0,0,25,37.5Z" fill="none"/><path class="robot_body" d="M25,12.5A12.5,12.5,0,0,1,37.5,25V9.4A19.91,19.91,0,0,0,14.75,7.85v10A12.48,12.48,0,0,1,25,12.5Z" fill="#df9626"/><path class="robot_body" d="M25,37.5a12.48,12.48,0,0,1-10.25-5.36v10A19.91,19.91,0,0,0,37.5,40.6V25A12.5,12.5,0,0,1,25,37.5Z" fill="#df9626"/><path class="led_body" d="M37.5,40.6a20,20,0,0,0,0-31.2V40.6Zm3.75-16.1a0.5,0.5,0,1,1-.5.5A0.5,0.5,0,0,1,41.25,24.5Z" fill="#bababa"/><circle cx="41.25" cy="25" r="0.5" fill="#1d1d1e"/><path d="M5,25a20,20,0,0,0,9.75,17.15v-10a12.46,12.46,0,0,1,0-14.29v-10A20,20,0,0,0,5,25Z" fill="#505051"/></svg>',
        '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>robot_80</title><circle cx="25" cy="25" r="12.5" fill="none"/><path class="robot_body" d="M25,45a19.9,19.9,0,0,0,12.5-4.4V25A12.5,12.5,0,1,1,25,12.5,12.5,12.5,0,0,1,37.5,25V9.4a19.93,19.93,0,0,0-26,.87V39.73A19.9,19.9,0,0,0,25,45Z" fill="#df9626"/><path class="led_body" d="M37.5,40.6a20,20,0,0,0,0-31.2V40.6Z" fill="#bababa"/><path d="M5,25a19.92,19.92,0,0,0,6.5,14.73V10.27A19.92,19.92,0,0,0,5,25Z" fill="#505051"/><circle cx="41.25" cy="25" r="0.5" fill="#1d1d1e"/></svg>',
        '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>robot_90</title><circle cx="25" cy="25" r="12.5" fill="none"/><path class="robot_body" d="M25,45a19.9,19.9,0,0,0,12.5-4.4V25A12.5,12.5,0,1,1,25,12.5,12.5,12.5,0,0,1,37.5,25V9.4A20,20,0,0,0,8.25,14.09V35.91A20,20,0,0,0,25,45Z" fill="#df9626"/><path class="led_body" d="M37.5,40.6a20,20,0,0,0,0-31.2V40.6Z" fill="#bababa"/><path d="M8.25,35.91V14.09A19.94,19.94,0,0,0,8.25,35.91Z" fill="#505051"/><circle cx="41.25" cy="25" r="0.5" fill="#1d1d1e"/></svg>',
        '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>robot_100</title><circle cx="25" cy="25" r="12.5" fill="none"/><path class="robot_body" d="M25,37.5A12.5,12.5,0,1,1,37.5,25V9.4a20,20,0,1,0,0,31.2V25A12.5,12.5,0,0,1,25,37.5Z" fill="#df9626"/><path class="led_body" d="M45,25A20,20,0,0,0,37.5,9.4V40.6A20,20,0,0,0,45,25Z" fill="#bababa"/><circle cx="41.25" cy="25" r="0.5" fill="#1d1d1e"/></svg>'
    ],
    GATE: '<svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>gate_thick_gapped_thin_border</title><path class="gate_body" d="M3.49,18.68A0.49,0.49,0,0,1,3,18.2V8.7A5.71,5.71,0,0,1,8.71,3l9.45,0.06a0.49,0.49,0,0,1,0,1h0L8.71,4A4.73,4.73,0,0,0,4,8.7v9.5A0.49,0.49,0,0,1,3.49,18.68Z" fill="#bababa"/><path class="gate_body" d="M18.16,47h0l-9.45-.06A5.71,5.71,0,0,1,3,41.24V31.87a0.49,0.49,0,0,1,1,0v9.37A4.73,4.73,0,0,0,8.71,46L18.16,46A0.49,0.49,0,0,1,18.16,47Z" fill="#bababa"/><path class="gate_body" d="M31.84,47a0.49,0.49,0,0,1,0-1L41.29,46A4.73,4.73,0,0,0,46,41.24V31.87a0.49,0.49,0,0,1,1,0v9.37a5.71,5.71,0,0,1-5.71,5.7L31.85,47h0Z" fill="#bababa"/><path class="gate_body" d="M46.51,18.68A0.49,0.49,0,0,1,46,18.2V8.7A4.73,4.73,0,0,0,41.29,4L31.85,4h0a0.49,0.49,0,0,1,0-1L41.29,3A5.71,5.71,0,0,1,47,8.7v9.5A0.49,0.49,0,0,1,46.51,18.68Z" fill="#bababa"/><path class="gate_body" d="M33.5,23.6h-17a1,1,0,0,1,0-2h17A1,1,0,0,1,33.5,23.6Z" fill="#bababa"/><path class="gate_body" d="M33.5,28.4h-17a1,1,0,0,1,0-2h17A1,1,0,0,1,33.5,28.4Z" fill="#bababa"/><path class="gate_body" d="M33.5,23.6a1,1,0,0,1-.71-0.3l-5-5.08a1,1,0,0,1,1.43-1.4l5,5.08A1,1,0,0,1,33.5,23.6Z" fill="#bababa"/><path class="gate_body" d="M21.5,33.47a1,1,0,0,1-.71-0.3l-5-5.08a1,1,0,1,1,1.42-1.4l5,5.08A1,1,0,0,1,21.5,33.47Z" fill="#bababa"/></svg>',
    STATION: '<svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>station_rotated</title><polygon class="station_body" points="30 24.17 25.42 24.17 27.25 15 20 25.83 24.58 25.83 22.75 35 30 24.17" fill="#feea3a"/><path class="station_body" d="M18.38,3.49a2,2,0,1,1-2-2A2,2,0,0,1,18.38,3.49Zm-3.2,0a1.2,1.2,0,1,0,1.2-1.2A1.2,1.2,0,0,0,15.18,3.49Z" fill="#feea3a"/><ellipse class="station_body" cx="33.63" cy="3.49" rx="1.6" ry="1.55" fill="#feea3a"/><path class="station_body" d="M35.63,3.49a2,2,0,0,1-4,0A2,2,0,0,1,35.63,3.49Zm-3.2,0a1.2,1.2,0,0,0,2.4,0A1.2,1.2,0,0,0,32.42,3.49Z" fill="#feea3a"/><path class="station_body" d="M8.71,4A4.74,4.74,0,0,0,4,8.71V41.29A4.74,4.74,0,0,0,8.71,46H41.29A4.74,4.74,0,0,0,46,41.29V8.71A4.74,4.74,0,0,0,41.29,4V3A5.72,5.72,0,0,1,47,8.71V41.29A5.72,5.72,0,0,1,41.29,47H8.71A5.72,5.72,0,0,1,3,41.29V8.71A5.72,5.72,0,0,1,8.71,3V4Z" fill="#feea3a"/><rect class="station_body" x="8.71" y="3" width="5.87" height="0.98" fill="#feea3a"/><rect class="station_body" x="35.42" y="3" width="5.87" height="0.98" fill="#feea3a"/></svg>',
    OBSTACLE: '<svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>obstacle_less_dense</title><polyline class="obstacle_body" points="27.07 22.39 24.76 17.45 29.45 18.73 31.32 21.11 28.78 25.36" fill="#bababa"/><polyline class="obstacle_body" points="31.05 32.55 28.53 26.84 32.21 21.81 36.96 32.55" fill="#bababa"/><polyline class="obstacle_body" points="29.45 32.55 20.06 32.55 22.21 26.72 26.76 25.44" fill="#bababa"/><polyline class="obstacle_body" points="21.89 26.05 20.06 24.16 23.35 17.45 26.04 22.82 26.34 24.46" fill="#bababa"/><polyline class="obstacle_body" points="17.8 32.55 13.04 32.55 13.59 28.27 18.53 25.36 21.09 26.36" fill="#bababa"/></svg>',
    RACK: '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><title>rack_thick</title><circle cx="25" cy="25" r="12.5" fill="#1d1d1e"/><path class="rack_body" d="M32.64,30.5H17.36a0.52,0.52,0,0,1,0-1H32.64A0.52,0.52,0,0,1,32.64,30.5Z" fill="#bababa"/><path class="rack_body" d="M32.64,31H17.36a1,1,0,0,1,0-2H32.64A1,1,0,0,1,32.64,31Zm0-1v0h0Z" fill="#bababa"/><path class="rack_body" d="M32.64,25.5H17.36a0.52,0.52,0,0,1,0-1H32.64A0.52,0.52,0,0,1,32.64,25.5Z" fill="#bababa"/><path class="rack_body" d="M32.64,26H17.36a1,1,0,0,1,0-2H32.64A1,1,0,0,1,32.64,26Zm0-1v0h0Z" fill="#bababa"/><path class="rack_body" d="M32.64,20.5H17.36a0.52,0.52,0,0,1,0-1H32.64A0.52,0.52,0,0,1,32.64,20.5Z" fill="#bababa"/><path class="rack_body" d="M32.64,21H17.36a0.91,0.91,0,0,1-.76-1,0.91,0.91,0,0,1,.76-1H32.64a0.91,0.91,0,0,1,.76,1A0.91,0.91,0,0,1,32.64,21Zm0-1v0h0Z" fill="#bababa"/></svg>'
};

GFX_COLORS_DEFAULT = {
    ROBOT: "#df9626",
    ROBOT_LED: "#bababa",
    GATE: "#bababa",
    STATION: "#feea3a",
    OBSTACLE: "#d10000",
    RACK: "#bababa",
    CELL: 0x1d1d1e,
    CELL_STROKE: 0xbababa
};

GFX_COLORS = {
    LED_BLUE_COLOR: "#18FFFF",
    LED_GREEN_COLOR: "#76FF03",
    LED_RED_COLOR: "#d10000",
    RACK_LOAD_COLOR: "#18FFFF",
    STATION_BIND_COLOR: "#76FF03",
    GATE_BIND_COLOR: "#76FF03",
    CELL_HIGHLIGHT_COLOR: 0x4a4a4a,
    CELL_HIGHLIGHT_STROKE: 0xbababa,
};