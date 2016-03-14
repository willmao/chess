
/**
 * Reset the array with specific value
 * @param {object} value to reset
 */
Array.prototype.reset = function(value) {
    for (var i = 0; i < this.length; i++) {
        this[i] = value;
    }
    return this;
}

Array.prototype.include = function(value) {
    return this.indexOf(value) > -1;
}


function Zobrist() {

}

Zobrist.get_random_32 = function() {
    return ((Math.random() * 65536 & 0xffff) << 15) | (Math.random() * 65536 & 0xffff);
}


//chess_ui.bind_click_event();
// utility functions
Array.prototype.to_hash = function(get_key, get_value) {
    var json = {};
    for (var i = 0; i < this.length; i++) {
        json[get_key(this[i], i)] = get_value ? get_value(this[i], i) : this[i];
    }
    return json;
}

Array.prototype.reset = function() {
    for (var i = 0; i < this.length; i++) {
        this[i] = 0;
    }
    return this;
}

Array.prototype.unzip = function(offset, length) {
    var a = new Array(length);
    for (var i = 0; i < this.length; i++) {
        a[offset + this[i][0]] = this[i][1];
    }
    return a;
}

Array.prototype.include = function(x) {
    return this.indexOf(x) >= 0;
}

// chessman encoding:
// color arms   no
//     1    3    4
//     x  xxx xxxx

function Chess() {
    this.square = new Array(256).reset();
    this.pieces = new Array(256).reset();
    this.moves = new Array(1 << 10).reset();
    this.scores = new Array(1 << 10).reset();
    this.move_path = new Array();
    this.max_depth = 5;
    this.static_search_limit = 5;
    this.current_best_move = null;
    this.maximum_color = 0;
    this.zobrists = Chess.generate_zobrist_table();
    this.zobrist_high = null;
    this.zobrist_low = null;
    this.history_table_mask = 0xfffff;
    this.history_table_length = (1 << 20);
    this.history_table = new Array(this.history_table_length * 8).reset();
    this.move_history = new Array(256 * 8).reset();
    this.move_history_pointer = 0;
    this.black_check_king = true;
    this.red_check_king = true;
    this.search_history = new Array(16).reset();
    this.search_history_pointer = 0;
}

Chess.color_names = [
    // 0 = 0x00
    'black',
    // 1 = 0x80
    'red'
];

Chess.arms_names = [
    // 0 = 0x00
    'king',
    // 1 = 0x10
    'rook',
    // 2 = 0x20
    'horse',
    // 3 = 0x30
    'cannon',
    // 4 = 0x40
    'guard',
    // 5 = 0x50
    'elephant',
    // 6 = 0x60
    'pawn',
];

Chess.arms_zh_names = [
    ['将', '車', '馬', '炮', '士', '象', '卒'],
    ['帅', '車', '馬', '炮', '士', '相', '兵']
];

Chess.arms_count = [
    // king
    1,
    // rook
    2,
    // horse
    2,
    // cannon
    2,
    // guard
    2,
    // elephant
    2,
    // pawn
    5,
]

Chess.arms_static_score = [
    // king
    5000,
    // rook
    1000,
    // horse
    400,
    // cannon
    500,
    // guard
    100,
    // elephant
    200,
    // pawn
    100,
];

Chess.arms_location_score = [
    // king
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    // rook
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    // horse
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    // cannon
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    // bishop
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    // elephant
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    // pawn
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
]

Chess.opening_square = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x11, 0x21, 0x51, 0x41, 0x01, 0x42, 0x52, 0x22, 0x12, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x31, 0x00, 0x00, 0x00, 0x00, 0x00, 0x32, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x61, 0x00, 0x62, 0x00, 0x63, 0x00, 0x64, 0x00, 0x65, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0xe1, 0x00, 0xe2, 0x00, 0xe3, 0x00, 0xe4, 0x00, 0xe5, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0xb1, 0x00, 0x00, 0x00, 0x00, 0x00, 0xb2, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x91, 0xa1, 0xd1, 0xc1, 0x81, 0xc2, 0xd2, 0xa2, 0x92, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];

Chess.board_mask = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,

    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

Chess.king_room_mask = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

Chess.horse_leg_delta = [
    [0x0e, -0x01],
    [0x1f, 0x10],
    [0x21, 0x10],
    [0x12, 0x01],
    [-0x0e, 0x01],
    [-0x1f, -0x10],
    [-0x21, -0x10],
    [-0x12, -0x01],
].unzip(0x22, 0x44);

Chess.valid_address = function(address) {
    //return (address & 0x0f) >= 0x03 && (address & 0x0f) <= 0x0b && (address & 0xf0) >= 0x30 && (address & 0xf0) <= 0xc0;
    return Chess.board_mask[address] > 0;
}

Chess.encode_chessman = function(color, arms, no) {
    return (color << 7) | (arms << 4) | no;
}

Chess.decode_chessman = function(chessman) {
    return [chessman >> 7, (chessman & 0x70) >> 4, chessman & 0x0f]
}

Chess.encode_move = function(src, dest, chessman, killed_chessman) {
    return src | (dest << 8) | (chessman << 16) | (killed_chessman << 24);
}

Chess.decode_move = function(move) {
    return [move & 0xff, (move & 0xff00) >> 8, (move & 0xff0000) >> 16, move >>> 24]
}

Chess.move_def_help = function(arm, delta_list, check_address, check_move) {
    var def = [new Array(256), new Array(256)];
    for (var color = 0; color < 2; color++) {
        for (var src = 0; src < 256; src++) {
            if (!Chess.valid_address(src) || check_address && !check_address(color, src))
                continue;
            def[color][src] = [];
            for (var i = 0; i < delta_list.length; i++) {
                var delta = delta_list[i];
                var dest = src + delta;
                if (!Chess.valid_address(dest) || check_address && !check_address(color, dest))
                    continue;
                if (check_move && !check_move(color, src, dest)) continue;
                var move = src | (dest << 8) | (((color << 7) | (arm << 4)) << 16);
                def[color][src].push(move);
            }
        }
    }
    return def;
}

Chess.base_move_def = [
    // king
    Chess.move_def_help(0, [-0x01, 0x10, 0x01, -0x10],
        function(c, a) {
            return c == (a >> 7) && Chess.king_room_mask[a];
        }, null
    ),
    // rook
    Chess.move_def_help(1, [], null, null),
    // horse
    Chess.move_def_help(2, [0x0e, 0x1f, 0x21, 0x12, -0x0e, -0x1f, -0x21, -0x12], null, null),
    // cannon
    Chess.move_def_help(3, [], null, null),
    // bishop
    Chess.move_def_help(4, [0x0f, 0x11, -0x0f, -0x11],
        function(c, a) {
            return [0x36, 0x38, 0x47, 0x56, 0x58].include(a - c * 0x70);
        }, null
    ),
    // elephant
    Chess.move_def_help(5, [0x1e, 0x22, -0x1e, -0x22],
        function(c, a) {
            return [0x35, 0x53, 0x75, 0x57, 0x79, 0x5b, 0x39].include(a - c * 0x50);
        }, null
    ),
    // pawn
    Chess.move_def_help(6, [-0x01, 0x10, 0x01, -0x10],
        function(c, a) {
            return c != (a >> 7) || (a & 0x1) && (c ? a < 0x9f : a > 0x60);
        },
        function(c, s, d) {
            return (s & 0xf0) == (d & 0xf0) || (c == 0) == ((s & 0xf0) < (d & 0xf0));
        }
    ),
];


Chess.color_names_index_map = Chess.color_names.to_hash(
    function(x) { return x; },
    function(x, i) { return i; }
);

Chess.arms_names_index_map = Chess.arms_names.to_hash(
    function(x) { return x; },
    function(x, i) { return i; }
);

Chess.prototype.reset_square = function(square) {
    this.pieces.reset();
    for (var i = 0; i < square.length; i++) {
        this.square[i] = square[i];
        this.pieces[square[i]] = i;
    }
}

Chess.prototype.get_square = function() {
    return this.square;
}


Chess.prototype.reset = function() {
    this.reset_square(Chess.opening_square);
    var current_zobrist = this.get_zobrist();
    this.zobrist_high = current_zobrist[0];
    this.zobrist_low = current_zobrist[1];
    this.move_path = new Array();
}


Chess.prototype.generate_move = function(src, dest) {
    return Chess.encode_move(src, dest, this.square[src], this.square[dest]);
}

Chess.get_arm_info = function(arm) {
    if (arm == 0) {
        return '-';
    }
    var arm_info = Chess.decode_chessman(arm);
    return Chess.color_names[arm_info[0]] + '_' + Chess.arms_names[arm_info[1]] + '_' + arm_info[2];
}

Chess.get_addr_info = function(addr) {
    var pos_info = Chess.get_address(addr);
    return 'x:' + pos_info.x + ',y:' + pos_info.y;
}


Chess.print_move = function(move) {
    var move_info = Chess.decode_move(move);
    var from_info = Chess.get_addr_info(move_info[0]);
    var to_info = Chess.get_addr_info(move_info[1]);
    var chessman_info = Chess.get_arm_info(move_info[2]);
    var killed_chessman = Chess.get_arm_info(move_info[3]);
    console.log('move info: from :%s,to:%s,chessman:%s,killed_chessman:%s', from_info, to_info, chessman_info, killed_chessman);
}

Chess.prototype.valid_move = function(move) {
    var chessman = (move & 0xff0000) >> 16;
    var count = this.find_all_moves(chessman >> 7, 0, 0, false);
    for (var i = 0; i < count; i++) {
        if (this.moves[i] == move) return true;
    }
    return false;
}

Chess.prototype.game_over = function() {
    return this.pieces[0x01] == 0 || this.pieces[0x81] == 0;
}


Chess.prototype.check_king = function(color) {
    var c = color << 7, oc = (1 - color) << 7;
    var king_addr = this.pieces[c | 0x01];
    if (king_addr == 0) return true;

    return this.valid_king_kill(this.pieces[oc | 0x01], king_addr) ||
        this.valid_rook_kill(this.pieces[oc | 0x11], king_addr) ||
        this.valid_rook_kill(this.pieces[oc | 0x12], king_addr) ||
        this.valid_horse_kill(this.pieces[oc | 0x21], king_addr) ||
        this.valid_horse_kill(this.pieces[oc | 0x22], king_addr) ||
        this.valid_cannon_kill(this.pieces[oc | 0x31], king_addr) ||
        this.valid_cannon_kill(this.pieces[oc | 0x32], king_addr) ||
        this.valid_pawn_kill(this.pieces[oc | 0x61], king_addr) ||
        this.valid_pawn_kill(this.pieces[oc | 0x62], king_addr) ||
        this.valid_pawn_kill(this.pieces[oc | 0x63], king_addr) ||
        this.valid_pawn_kill(this.pieces[oc | 0x64], king_addr) ||
        this.valid_pawn_kill(this.pieces[oc | 0x65], king_addr);
}

Chess.prototype.valid_rook_kill = function(src, dest) {
    if (src == 0) return false;
    var delta = this.get_delta(src, dest);
    if (delta == 0) return false;

    for (var p = src + delta; p != dest; p += delta) {
        if (this.square[p]) {
            return false;
        }
    }
    return true;
}

Chess.prototype.valid_king_kill = function(src, dest) {
    return this.valid_rook_kill(src, dest);
}

Chess.prototype.valid_cannon_kill = function(src, dest) {
    if (src == 0) return false;
    var delta = this.get_delta(src, dest);
    if (delta == 0) return false;
    var count = 0;
    for (var p = src + delta; p != dest; p += delta) {
        if (this.square[p] > 0) {
            count++;
            if (count > 1) return false;
        }
    }
    return count == 1;
}

Chess.prototype.valid_horse_kill = function(src, dest) {
    if (src == 0) return false;
    var delta = dest - src;
    if (delta < -0x22 || delta > 0x22) return false;
    var leg_delta = Chess.horse_leg_delta[delta + 0x22];
    if (leg_delta == undefined) return false;
    return this.square[src + leg_delta] == 0;
}

Chess.prototype.valid_pawn_kill = function(src, dest) {
    if (src == 0) return false;
    return src - 0x01 == dest || src + 0x10 == dest || src - 0x01 == dest || src - 0x10 == dest;
}

Chess.prototype.get_delta = function(src, dest) {
    if ((src & 0x0f) == (dest & 0x0f)) {
        if (src < dest) {
            return 0x10;
        } else if (src > dest) {
            return -0x10;
        } else {
            return 0;
        }
    } else if ((src & 0xf0) == (dest & 0xf0)) {
        if (src < dest) {
            return 0x01;
        } else if (src > dest) {
            return -0x01;
        } else {
            return 0;
        }
    } else {
        return 0;
    }
}

Chess.INFINITY = 10000;

Chess.generate_zobrist_table = function() {
    var def = new Array(65536 * 2);
    for (var i = 0; i < 65536; i++) {
        var high = Zobrist.get_random_32();
        var low = Zobrist.get_random_32();
        def[i * 2] = high;
        def[i * 2 + 1] = low;
    }

    return def;
}

// get the zobrist of the current game
Chess.prototype.get_zobrist = function() {
    var high = null, low = null;
    for (var i = 0; i < this.pieces.length; i++) {
        if (this.pieces[i] > 0) {
            var target = i * this.pieces[i] * 2;
            //var target_zobrist = this.zobrists[target];
            if (high == null) {
                high = this.zobrists[target];
                low = this.zobrists[target + 1];
            } else {
                high ^= this.zobrists[target];
                low ^= this.zobrists[target + 1];
            }
        }
    }

    return [high, low];
}

Chess.prototype.apply_move = function(move, real_move) {
    if (real_move) {
        this.move_path.push(move);
    }
    var from = (move & 0xff);
    var dest = ((move & 0xff00) >> 8);
    var chessman = ((move & 0xff0000) >> 16);
    var killed_chessman = (move >>> 24);

    if ((move >>> 24) > 0) {
        var color = (killed_chessman >> 7);
        if (color == this.search_color) {
            this.current_score -= Chess.arms_static_score[(killed_chessman & 0x70) >> 4];
        } else {
            this.current_score += Chess.arms_static_score[(killed_chessman & 0x70) >> 4];
        }
    }

    var killed_man_zobrist = this.zobrists[killed_chessman * dest];
    //this.zobrist_high ^= this.zobrists[killed_chessman * dest * 2];
    //this.zobrist_low ^= this.zobrists[killed_chessman * dest * 2 + 1];
    var chessman_old_zobrist = this.zobrists[chessman * from];
    var chessman_new_zobrist = this.zobrists[chessman * dest];
    this.zobrist_high ^= this.zobrists[chessman * from * 2];
    this.zobrist_low ^= this.zobrists[chessman * from * 2 + 1];
    this.zobrist_high ^= this.zobrists[chessman * dest * 2];
    this.zobrist_low ^= this.zobrists[chessman * dest * 2 + 1];
    //this.move_history[this.move_history_pointer] = new Object();
    this.move_history[this.move_history_pointer] = this.zobrist_high;
    this.move_history[this.move_history_pointer + 1] = this.zobrist_low;
    this.move_history_pointer += 2;
    this.pieces[move >>> 24] = 0;
    this.square[move & 0xff] = 0;
    this.square[(move & 0xff00) >> 8] = (move & 0xff0000) >> 16;
    this.pieces[(move & 0xff0000) >> 16] = (move & 0xff00) >> 8;
}

Chess.is_same_zobrist = function(zobrista, zobristb) {
    if (zobrista == null || zobristb == null || zobrista.high == undefined || zobristb.high == undefined || zobrista.low == undefined || zobristb.low == undefined) return false;
    return zobrista.high == zobristb.high && zobrista.low == zobristb.low;
}

Chess.prototype.check_repeat = function() {
    // repeat define: every one make the same step for twice
    if (this.move_history_pointer < 4) return false;
    //var result = true;
    var pointer = this.move_history_pointer;
    var game_high_1 = this.move_history[pointer - 2];
    var game_low_1 = this.move_history[pointer - 1];
    //var game_high_2 = this.move_history[pointer - 4];
    //var game_low_2 = this.move_history[pointer - 3];
    //var game_high_3 = this.move_history[pointer - 6];
    //var game_low_3 = this.move_history[pointer - 5];
    var game_high_4 = this.move_history[pointer - 8];
    var game_low_4 = this.move_history[pointer - 7];
    return game_high_1 == game_high_4 && game_low_1 == game_low_4;
}

Chess.prototype.user_reverse_move = function() {
    if (this.move_path.length >= 2) {
        this.reverse_move(this.move_path[this.move_path.length - 1]);
        this.reverse_move(this.move_path[this.move_path.length - 2]);
        this.move_path.pop();
        this.move_path.pop();
    }
}

Chess.prototype.can_reverse = function() {
    return this.move_path.length > 1;
}

Chess.prototype.reverse_move = function(move) {
    var from = (move & 0xff);
    var dest = ((move & 0xff00) >> 8);
    var chessman = ((move & 0xff0000) >> 16);
    var killed_chessman = (move >>> 24);

    var killed_man_zobrist = this.zobrists[killed_chessman * dest];
    this.zobrist_high ^= this.zobrists[killed_chessman * dest * 2];
    this.zobrist_low ^= this.zobrists[killed_chessman * dest * 2 + 1];
    //var chessman_old_zobrist = this.zobrists[chessman * from];
    //var chessman_new_zobrist = this.zobrists[chessman * dest];
    this.zobrist_high ^= this.zobrists[chessman * from * 2];
    this.zobrist_low ^= this.zobrists[chessman * from * 2 + 1];
    this.zobrist_high ^= this.zobrists[chessman * dest * 2];
    this.zobrist_low ^= this.zobrists[chessman * dest * 2 + 1];

    //this.move_history[this.move_history_pointer] = null;
    this.move_history_pointer -= 2;

    if (killed_chessman > 0) {
        var color = (killed_chessman >> 7);
        if (color == this.search_color) {
            this.current_score += Chess.arms_static_score[(killed_chessman & 0x70) >> 4];
        } else {
            this.current_score -= Chess.arms_static_score[(killed_chessman & 0x70) >> 4];
        }
    }

    this.square[move & 0xff] = (move & 0xff0000) >> 16;
    this.pieces[(move & 0xff0000) >> 16] = move & 0xff;
    this.square[(move & 0xff00) >> 8] = move >>> 24;
    if (move & 0xff000000) {
        this.pieces[move >>> 24] = (move & 0xff00) >> 8;
    }
}

Chess.prototype.update_history_table = function(depth, value, zobrist_high, zobrist_low, hashf, best_move) {
    var high = zobrist_high;
    var low = zobrist_low;
    var index = (high & this.history_table_mask) * 8;
    var history = this.history_table[index];
    //if (history.depth!=undefined && history.depth > depth) return;
    //if (history == 0) this.history_table[index] = new Object();
    this.history_table[index] = high;
    this.history_table[index + 1] = low;
    this.history_table[index + 2] = best_move;
    this.history_table[index + 3] = value;
    this.history_table[index + 4] = hashf;
    this.history_table[index + 5] = depth;
}

Chess.hashf_exact = 0;
Chess.hashf_alpha = 1;
Chess.hashf_beta = 2;
Chess.UNKNOWN = Chess.INFINITY + 1;
Chess.prototype.probe_hash = function(depth, alpha, beta, zobrist_high, zobrist_low) {
    this.look_up_history_times++;
    var index = (zobrist_high & this.history_table_mask) * 8;
    var history_high = this.history_table[index];
    var history_low = this.history_table[index + 1];
    var history_best_move = this.history_table[index + 2];
    var history_value = this.history_table[index + 3];
    var history_hashf = this.history_table[index + 4];
    var history_depth = this.history_table[index + 5];
    if (history_high != 0 && history_high == zobrist_high && history_low == zobrist_low) {
        if (history_depth >= depth) {
            if (history_hashf == Chess.hashf_exact) {
                this.history_hit_times++;
                return history_value;
            }

            if (history_hashf == Chess.hashf_alpha && history_value <= alpha) {
                this.history_hit_times++;
                return alpha;
            }
            // cut pointer
            if (history_hashf == Chess.hashf_beta && history_value >= beta) {
                this.history_hit_times++;
                return beta;
            }
        }
        // TODO record best move
    }

    return Chess.UNKNOWN;
}

Chess.prototype.find_best_move = function(color) {
    this.current_best_move = null;
    this.maximum_color = color;
    this.max_depth = 7;

    // profile
    this.total_evaluated_times = 0;
    this.total_searched_nodes = 0;
    this.total_searched_moves = 0;
    this.total_static_searched_nodes = 0;
    this.look_up_history_times = 0;
    this.history_hit_times = 0;
    var start_time = new Date().getTime();

    // calculate current score
    this.current_score = this.evaluate(color);
    this.search_color = color;
    console.log('before search score:%s', this.current_score);
    var alpha = this.alpha_beta(color, this.max_depth, -1 * Chess.INFINITY, Chess.INFINITY, color, this.zobrist_high, this.zobrist_low);

    console.log('after search score:%s,search_history_pointer:%s', this.current_score, this.search_history_pointer);
    Chess.print_move(this.current_best_move);
    //console.log(this.move_history);
    // profile
    var end_time = new Date().getTime();
    console.debug("profile: duration = " + (end_time - start_time) + "ms" +
        ", total searched nodes = " + this.total_searched_nodes +
        ", total searched moves = " + this.total_searched_moves +
        ",total look up history times = " + this.look_up_history_times +
        ",total histor hit times = " + this.history_hit_times +
        ",hit percent(%) = " + (this.history_hit_times * 100 / this.look_up_history_times).toFixed(2) +
        ",history table size = " + this.history_table.length
    );

    return this.current_best_move;
}

Chess.prototype.statistics_history_table = function() {
    var count = 0;
    var has_best_move = 0;
    for (var i = 0; i < this.history_table.length; i++) {
        var history = this.history_table[i];
        if (history != 0) {
            count++;
            if (history.best_move != null || history.best_move != undefined) {
                has_best_move++;
            }
        }
    }

    console.log('history table snapshot, total:%s,valid:%s,has move:%s', this.history_table.length, count, has_best_move);
}

Chess.prototype.alpha_beta = function(color, depth, alpha, beta, offset, zobrist_high, zobrist_low) {
    var hashf = Chess.hashf_alpha;
    if (this.max_depth != depth) {
        var history_value = this.probe_hash(depth, alpha, beta, zobrist_high, zobrist_low);
        if (history_value != Chess.UNKNOWN) {
            //console.log('find history..');
            return history_value;
        }
    }

    var best_move = null;
    //profile
    this.total_searched_nodes++;
    if (depth < this.static_search_limit) this.total_static_searched_nodes++;

    if (depth == 0) {
        var score = this.current_score * -1;
        this.update_history_table(depth, score, this.zobrist_high, this.zobrist_low, Chess.hashf_exact, this.current_best_move);
        return score;
    }

    var new_offset = this.find_all_moves(color, depth, offset, false);
    if (new_offset == offset) {
        var score = this.current_score * -1;
        this.update_history_table(depth, score, zobrist_high, zobrist_low, Chess.hashf_exact, null);
        return score;
    }

    for (var i = offset; i < new_offset; i++) {
        var move = this.moves[i];

        var killed_chessman = (move >>> 24);
        if (((killed_chessman & 0x70) >> 4) == 0 && this.depth == this.max_depth) {
            this.current_best_move = move;
            alpha = Chess.INFINITY + 1;
            break;
        }

        var before_zobrist_high = this.zobrist_high;
        var before_zobrist_low = this.zobrist_low;
        this.apply_move(move);
        var current_zobrist_high = this.zobrist_high;
        var current_zobrist_low = this.zobrist_low;
        var is_repeat = this.check_repeat();
        if (is_repeat) {
            this.reverse_move(move);
            //console.log('find a repeat move...,skip it');
            continue;
        }
        if (!this.check_king(color)) {
            var king = (color << 7) | (0 << 4) | 1;
            var value = -this.alpha_beta(1 - color, depth - 1, -beta, -alpha, new_offset, current_zobrist_high, current_zobrist_low);
            this.reverse_move(move);

            if (this.max_depth == depth) {
                //console.debug('root search, alpha:%s,beta:%s,value:%s,move length:%s', alpha, beta, value, (new_offset - offset));
                //console.log("root search, current zobrist: high %s low:%s ,before zobrist: high %s low", current_zobrist_high, current_zobrist_low
                //    , before_zobrist_high, before_zobrist_low);
            }

            if (value >= beta) {
                this.update_history_table(depth, beta, current_zobrist_high, current_zobrist_low, Chess.hashf_beta, best_move);
                if (this.max_depth != depth)
                    return beta;
            }

            if (value > alpha) {
                alpha = value;
                best_move = move;
                hashf = Chess.hashf_exact;
            }
        } else {
            this.reverse_move(move);
        }
    }

    if (this.max_depth == depth) {
        this.current_best_move = best_move;
        //this.update_history_table(depth, alpha, this.zobrist_high, this.zobrist_low, hashf, best_move);
    }

    this.update_history_table(depth, alpha, zobrist_high, zobrist_low, hashf, best_move);
    return alpha;
}

Chess.prototype.evaluate = function(c, depth) {
    var score = 0, man, addr;
    for (var arm = 0; arm < 7; arm++) {
        for (var no = 1; no <= Chess.arms_count[arm]; no++) {
            man = (c << 7) | (arm << 4) | no;
            addr = this.pieces[man];
            if (addr != 0) {
                score += Chess.arms_static_score[arm]// + Chess.arms_location_score[arm][addr ^ ((0x100 - (c << 4)) & 0xff)];
            }

            man = ((1 - c) << 7) | (arm << 4) | no;
            addr = this.pieces[man];
            if (addr != 0) {
                score -= Chess.arms_static_score[arm]// + Chess.arms_location_score[arm][addr ^ ((0x100 - (c << 4)) & 0xff)];
            }
        }
    }
    //console.debug("evaluate: score = " + score + ", depth = " + depth + ", color = " + color);
    // profile
    this.total_evaluated_times++;

    return score;
}

Chess.prototype.get_move_length = function() {
    return this.move_path.length;
}

Chess.prototype.find_all_moves = function(color, depth, offset, only_kill) {
    var old_offset = offset;
    offset = this.find_all_moves_rook(color, depth, this.moves, offset, only_kill);
    offset = this.find_all_moves_cannon(color, depth, this.moves, offset, only_kill);
    offset = this.find_all_moves_king(color, depth, this.moves, offset, only_kill);
    offset = this.find_all_moves_base(color, depth, this.moves, offset, only_kill);

    this.sort_moves(color, depth, this.moves, this.scores, old_offset, offset);

    //profile
    this.total_searched_moves += offset - old_offset;

    return offset;
}

Chess.prototype.sort_temp = new Array(1024);

Chess.prototype.sort_moves = function(color, depth, moves, scores, offset, end) {
    for (var i = offset; i < end; i++) {
        var move = moves[i];
        scores[i] = ((move & 0xff000000 ? Chess.arms_static_score[(move >>> 28) & 07] : 0) << 8);
    }

    //this.sort_temp.reset();
    /* var index = 0;
     for (var i = offset; i < end; i++) {
         if (scores[i] == 0) {
             this.sort_temp[index++] = i;
         }
     }
 
     this.sort_temp[index] = -1;
     for (var i = end - 1; i >= offset && (end-1-i) < index; i--) {
         if (scores[i] > 0) {
             var target_index = this.sort_temp[end-1-i];
             moves[target_index] = moves[i];
             scores[target_index] = scores[i];
             moves[i] = moves[target_index];
             scores[i] = 0;
         }
     }
 
     for (var i = offset; i < offset + index; i++) {
         for (var j = i + 1; j < offset + index; j++) {
             if (scores[i] < scores[j]) {
                 var t = moves[i];
                 moves[i] = moves[j];
                 moves[j] = t;
                 t = scores[i];
                 scores[i] = scores[j];
                 scores[j] = t;
             }
         }
     }*/

    for (var i = offset; i < end; i++) {
        for (var j = i + 1; j < end; j++) {
            if (scores[i] < scores[j]) {
                var t = moves[i];
                moves[i] = moves[j];
                moves[j] = t;
                t = scores[i];
                scores[i] = scores[j];
                scores[j] = t;
            }
        }
    }
}

Chess.prototype.find_all_moves_rook = function(color, depth, moves, offset, only_kill) {
    for (var no = 1; no <= 2; no++) {
        var man = (color << 7) | (1 << 4) | no;
        var src = this.pieces[man];
        if (src == 0) continue;
        for (var shift = 0; shift < 4; shift++) {
            var delta = ((shift & 0x1) ? 1 : -1) * (1 << ((shift & 0x2) << 1));
            for (var dest = src; Chess.board_mask[(dest = dest + delta)];) {
                var killed_man = this.square[dest];
                if (killed_man > 0 && (killed_man >> 7) == color) break;
                if (killed_man || !only_kill) {
                    moves[offset++] = src | (dest << 8) | (man << 16) | (killed_man << 24);
                }
                if (killed_man > 0) break;
            }
        }
    }
    return offset;
}

Chess.prototype.find_all_moves_cannon = function(color, depth, moves, offset, only_kill) {
    for (var no = 1; no <= 2; no++) {
        var man = (color << 7) | (3 << 4) | no;
        var src = this.pieces[man];
        if (src == 0) continue;
        for (var shift = 0; shift < 4; shift++) {
            var delta = ((shift & 0x1) ? 1 : -1) * (1 << ((shift & 0x2) << 1));
            var mark = false;
            for (var dest = src; Chess.board_mask[(dest = dest + delta)];) {
                var killed_man = this.square[dest];
                if (mark) {
                    if (killed_man > 0) {
                        if ((killed_man >> 7) != color) {
                            moves[offset++] = src | (dest << 8) | (man << 16) | (killed_man << 24);
                        }
                        break;
                    }
                } else if (killed_man > 0) {
                    mark = true;
                } else if (!only_kill) {
                    moves[offset++] = src | (dest << 8) | (man << 16);
                }
            }
        }
    }
    return offset;
}

Chess.prototype.find_all_moves_base = function(color, depth, moves, offset, only_kill) {
    for (var arm = 0; arm < 7; arm++) {
        for (var no = 1; no <= Chess.arms_count[arm]; no++) {
            var man = (color << 7) | (arm << 4) | no;
            var src = this.pieces[man];
            if (src == 0) continue;
            var ms = Chess.base_move_def[arm][color][src];
            if (!ms) continue;
            for (var i = 0; i < ms.length; i++) {
                var m = ms[i];
                var dest = (m & 0xff00) >> 8;
                var killed_man = this.square[dest];
                if (killed_man > 0 && (killed_man >> 7) == color) continue;
                if (arm == 2) {
                    if (this.square[src + Chess.horse_leg_delta[dest - src + 0x22]] != 0) continue;
                } else if (arm == 5) {
                    if (this.square[(src + dest) >> 1] != 0) continue;
                }
                if (killed_man || !only_kill) {
                    moves[offset++] = m | (no << 16) | (killed_man << 24);
                }
            }
        }
    }
    return offset;
}

Chess.prototype.find_all_moves_king = function(color, depth, moves, offset, only_kill) {
    var king1 = (color << 7) | (0 << 4) | 1;
    var king2 = ((1 - color) << 7) | (0 << 4) | 1;
    var pking1 = this.pieces[king1], pking2 = this.pieces[king2];
    // TODO ADD MORE LIMIT
    if (pking1 == 0 || pking2 == 0) return;
    if ((pking1 & 0x0f) == (pking2 & 0x0f)) {
        var d = pking1 < pking2 ? 0x10 : -0x10;
        var found = false;
        for (var p = pking1; (p += d) != pking2;) {
            if (this.square[p] > 0) {
                found = true;
                break;
            }
        }
        if (!found) {
            moves[offset++] = pking1 | (pking2 << 8) | (king1 << 16) | (king2 << 24);
        }
    }
    return offset;
}

Chess.prototype.get_arms = function() {
    var data = [];
    for (var i = 0; i < this.square.length; i++) {
        if (this.square[i] > 0) {
            var chess = this.square[i];
            var color = (chess >> 7);
            var color_name = Chess.color_names[(chess >> 7)];
            var arm = (chess & 0x70) >> 4;
            var arm_name = Chess.arms_names[(chess & 0x70) >> 4];
            var no = (chess & 0x0f);
            var text = Chess.arms_zh_names[color][arm];
            var id = color_name + "_" + arm_name + "_" + no;
            var x = (i & 0xf);
            var y = (i >> 4);
            var arm_info = { x: x - 3, y: y - 3, id: id, text: text };
            data.push(arm_info);
        }
    }
    return data;
}

Chess.get_chessman_id = function(chessman) {
    var color = (chessman >> 7);
    var color_name = Chess.color_names[color];
    var arm = (chessman & 0x70) >> 4;
    var arm_name = Chess.arms_names[arm];
    var no = (chessman & 0xf);
    return color_name + "_" + arm_name + "_" + no;
}

Chess.get_address = function(logical_address) {
    return {
        x: (logical_address & 0xf) - 3,
        y: (logical_address >> 4) - 3
    };
}

function ChessUI(svg_id) {
    this.svg_id = svg_id;
    this.start = 60.5;
    this.space = 74;
    this.radius = 28;
    this.arm_offset_x = -50;
    this.arm_offset_y = -50;
    this.arm_circle_offset_x = 50;
    this.arm_circle_offset_y = 50;
    this.arm_text_offset_x = 30;
    this.arm_text_offset_y = 65;
    this.current_active_chessman_id = '';
    this.lines = [
        { x1: 0, y1: 0, x2: 8, y2: 0 },
        { x1: 0, y1: 1, x2: 8, y2: 1 },
        { x1: 0, y1: 2, x2: 8, y2: 2 },
        { x1: 0, y1: 3, x2: 8, y2: 3 },
        { x1: 0, y1: 4, x2: 8, y2: 4 },

        { x1: 0, y1: 5, x2: 8, y2: 5 },
        { x1: 0, y1: 6, x2: 8, y2: 6 },
        { x1: 0, y1: 7, x2: 8, y2: 7 },
        { x1: 0, y1: 8, x2: 8, y2: 8 },
        { x1: 0, y1: 9, x2: 8, y2: 9 },

        { x1: 0, y1: 0, x2: 0, y2: 4 },
        { x1: 1, y1: 0, x2: 1, y2: 4 },
        { x1: 2, y1: 0, x2: 2, y2: 4 },
        { x1: 3, y1: 0, x2: 3, y2: 4 },
        { x1: 4, y1: 0, x2: 4, y2: 4 },
        { x1: 5, y1: 0, x2: 5, y2: 4 },
        { x1: 6, y1: 0, x2: 6, y2: 4 },
        { x1: 7, y1: 0, x2: 7, y2: 4 },
        { x1: 8, y1: 0, x2: 8, y2: 4 },

        { x1: 0, y1: 5, x2: 0, y2: 9 },
        { x1: 1, y1: 5, x2: 1, y2: 9 },
        { x1: 2, y1: 5, x2: 2, y2: 9 },
        { x1: 3, y1: 5, x2: 3, y2: 9 },
        { x1: 4, y1: 5, x2: 4, y2: 9 },
        { x1: 5, y1: 5, x2: 5, y2: 9 },
        { x1: 6, y1: 5, x2: 6, y2: 9 },
        { x1: 7, y1: 5, x2: 7, y2: 9 },
        { x1: 8, y1: 5, x2: 8, y2: 9 },

        { x1: 3, y1: 0, x2: 5, y2: 2 },
        { x1: 5, y1: 0, x2: 3, y2: 2 },
        { x1: 3, y1: 7, x2: 5, y2: 9 },
        { x1: 5, y1: 7, x2: 3, y2: 9 },

        { x1: 0, y1: 4, x2: 0, y2: 5 },
        { x1: 8, y1: 4, x2: 8, y2: 5 },
    ];
    this.texts = [
        { x: 1.1, y: 4.75, text: '楚' },
        { x: 2.1, y: 4.75, text: '河' },
        { x: 5.2, y: 4.75, text: '汉' },
        { x: 6.2, y: 4.75, text: '界' },
    ];

    this.arms = [
        // black
        { x: 0, y: 0, text: '車', id: 'black_rook_1' },
        { x: 1, y: 0, text: '馬', id: 'black_horse_1' },
        { x: 2, y: 0, text: '象', id: 'black_elephant_1' },
        { x: 3, y: 0, text: '士', id: 'black_guard_1' },
        { x: 4, y: 0, text: '将', id: 'black_king_1' },
        { x: 5, y: 0, text: '士', id: 'black_guard_2' },
        { x: 6, y: 0, text: '象', id: 'black_elephant_2' },
        { x: 7, y: 0, text: '馬', id: 'black_horse_2' },
        { x: 8, y: 0, text: '車', id: 'black_rook_2' },
        { x: 1, y: 2, text: '砲', id: 'black_cannon_1' },
        { x: 7, y: 2, text: '砲', id: 'black_cannon_2' },
        { x: 0, y: 3, text: '卒', id: 'black_pawn_1' },
        { x: 2, y: 3, text: '卒', id: 'black_pawn_2' },
        { x: 4, y: 3, text: '卒', id: 'black_pawn_3' },
        { x: 6, y: 3, text: '卒', id: 'black_pawn_4' },
        { x: 8, y: 3, text: '卒', id: 'black_pawn_5' },
        // red
        { x: 0, y: 9, text: '俥', id: 'red_rook_1' },
        { x: 1, y: 9, text: '馬', id: 'red_horse_1' },
        { x: 2, y: 9, text: '相', id: 'red_elephant_1' },
        { x: 3, y: 9, text: '仕', id: 'red_guard_1' },
        { x: 4, y: 9, text: '帅', id: 'red_king_1' },
        { x: 5, y: 9, text: '仕', id: 'red_guard_2' },
        { x: 6, y: 9, text: '相', id: 'red_elephant_2' },
        { x: 7, y: 9, text: '馬', id: 'red_horse_2' },
        { x: 8, y: 9, text: '俥', id: 'red_rook_2' },
        { x: 1, y: 7, text: '炮', id: 'red_cannon_1' },
        { x: 7, y: 7, text: '炮', id: 'red_cannon_2' },
        { x: 0, y: 6, text: '兵', id: 'red_pawn_1' },
        { x: 2, y: 6, text: '兵', id: 'red_pawn_2' },
        { x: 4, y: 6, text: '兵', id: 'red_pawn_2' },
        { x: 6, y: 6, text: '兵', id: 'red_pawn_2' },
        { x: 8, y: 6, text: '兵', id: 'red_pawn_2' }
    ];
}

ChessUI.prototype.create_svg_element = function(type) {
    return document.createElementNS('http://www.w3.org/2000/svg', type);
}

ChessUI.prototype.create_line = function(line_def) {
    var line = this.create_svg_element('line');
    line.setAttribute('x1', line_def.x1);
    line.setAttribute('x2', line_def.x2);
    line.setAttribute('y1', line_def.y1);
    line.setAttribute('y2', line_def.y2);
    return line;
}

ChessUI.prototype.get_coor = function(coor) {
    return this.start + this.space * coor;
}

ChessUI.prototype.get_lines_def = function(line) {
    var x1 = this.get_coor(line.x1);
    var x2 = this.get_coor(line.x2);
    var y1 = this.get_coor(line.y1);
    var y2 = this.get_coor(line.y2);
    return { x1: x1, y1: y1, x2: x2, y2: y2 };
}

ChessUI.prototype.get_text_def = function(text) {
    var x = this.get_coor(text.x);
    var y = this.get_coor(text.y);
    var content = text.text;
    return { x: x, y: y, text: content };
}

ChessUI.prototype.create_text = function(text_def) {
    var text = this.create_svg_element('text');
    text.setAttribute("x", text_def.x);
    text.setAttribute("y", text_def.y);
    text.setAttribute('class', 'unselectable');
    text.textContent = text_def.text;
    return text;
}

ChessUI.prototype.create_board = function() {
    var board = this.create_svg_element('g');
    var docf = document.createDocumentFragment();
    for (var i = 0; i < this.lines.length; i++) {
        var line_data = this.get_lines_def(this.lines[i]);
        var line = this.create_line(line_data);
        docf.appendChild(line);
    }

    for (var i = 0; i < this.texts.length; i++) {
        var text_data = this.get_text_def(this.texts[i]);
        var text = this.create_text(text_data);
        docf.appendChild(text);
    }
    board.appendChild(docf);
    var svg = document.getElementById(this.svg_id);
    svg.appendChild(board);
}

ChessUI.prototype.get_arm_def = function(arm) {
    var x = this.get_coor(arm.x);
    var y = this.get_coor(arm.y);
    var r = this.radius;
    var content = arm.text;
    var id = arm.id;
    return { x: x + this.arm_offset_x, y: y + this.arm_offset_y, text: content, id: id };
}

ChessUI.prototype.create_arm = function(arm_def) {
    var svg = this.create_svg_element('svg');
    svg.setAttribute('x', arm_def.x);
    svg.setAttribute('y', arm_def.y);
    svg.setAttribute('id', arm_def.id);
    var basic_class = arm_def.id.indexOf('red') > -1 ? 'red' : 'black';
    svg.setAttribute('class', basic_class + ' chessman');

    var circle = this.create_svg_element('circle');
    circle.setAttribute('r', this.radius);
    circle.setAttribute('cx', this.arm_circle_offset_x);
    circle.setAttribute('cy', this.arm_circle_offset_y);

    var text_def = { x: this.arm_text_offset_x, y: this.arm_text_offset_y, text: arm_def.text };
    var text = this.create_text(text_def);
    svg.appendChild(circle);
    svg.appendChild(text);

    return svg;
}

ChessUI.prototype.create_game = function(arms) {
    var game_container_id = this.svg_id + '_game';
    var game = document.getElementById(game_container_id);
    if (game == null) {
        game = this.create_svg_element('g');
        game.setAttribute('id', this.svg_id + '_game');
    } else {
        game.remove();
        game = this.create_svg_element('g');
        game.setAttribute('id', this.svg_id + '_game');
        var chessmem = document.querySelectorAll('.chessman');
        for (var i = 9; i < chessmem.leng; i++) {
            chessmem[i].remove();
        }
    }
    var docf = document.createDocumentFragment();
    for (var i = 0; i < arms.length; i++) {
        var arm_def = this.get_arm_def(arms[i]);
        var arm = this.create_arm(arm_def);
        docf.appendChild(arm);
    }

    game.appendChild(docf);

    var svg = document.getElementById(this.svg_id);
    svg.appendChild(game);
}

ChessUI.prototype.active_arm = function(id) {
    if (this.current_active_chessman_id != "") {
        this.deactive_arm(this.current_active_chessman_id);
    }
    var arm = document.getElementById(id);
    var basic_class = arm.getAttribute('data-class');
    arm.classList.add('active');
    this.current_active_chessman_id = id;
}

ChessUI.prototype.deactive_arm = function(id) {
    var arm = document.getElementById(id);
    //var basic_class = arm.getAttribute('data-class');
    arm.classList.remove('active');
    this.current_active_chessman_id = "";
}

ChessUI.prototype.get_click_coor = function(cx, cy) {
    var min_x = this.start - this.radius;
    var max_x = this.start + this.space * 8 + this.radius;
    var min_y = this.start - this.radius;
    var max_y = this.start + this.space * 9 + this.radius;
    if (cx < min_x || cx > max_x || cy < min_y || cy > max_y) {
        return { valid: false };
    }

    var offset = this.radius * 1.0 / this.space;
    var vx = (cx - this.start) / this.space;
    var rx = Math.round(vx);
    if (vx < (rx - offset) || (vx > (rx + offset))) {
        return { valid: false };
    }

    var vy = (cy - this.start) / this.space;
    var ry = Math.round(vy);

    if (vy < (ry - offset) || vy > (ry + offset)) {
        return { valid: false };
    }

    return { valid: true, x: rx, y: ry };
}

ChessUI.prototype.arm_click_handler = function(e) {
    var cx = e.pageX;
    var cy = e.pageY;
    var coor = this.get_click_coor(cx, cy);
    if (!coor.valid) {
        return false;
    }
}

ChessUI.prototype.bind_click_event = function() {
    var svg = document.getElementById(this.svg_id);
    svg.addEventListener('click', this.arm_click_handler.bind(this));
}

ChessUI.prototype.init = function(arms) {
    this.create_board();
    this.create_game(arms);
}

ChessUI.prototype.killed_chessman = function(killed_chessman_id) {
    var killed_chessman = document.getElementById(killed_chessman_id);
    if (killed_chessman != null) {
        killed_chessman.remove();
    }
}

ChessUI.prototype.move_chessman = function(chessman_id, x, y) {
    var cx = this.get_coor(x) + this.arm_offset_x;
    var cy = this.get_coor(y) + this.arm_offset_y;
    var chessman = document.getElementById(chessman_id);
    if (chessman != null) {
        chessman.setAttribute('x', cx);
        chessman.setAttribute('y', cy);
    }
}

ChessUI.prototype.apply_move = function(from_chessman_id, killed_chessman_id, x, y) {
    var chessmem = document.querySelectorAll('.chessman');
    for (var i = 0; i < chessmem.length; i++) {
        chessmem[i].classList.remove('active');
    }

    this.active_arm(from_chessman_id);
    this.killed_chessman(killed_chessman_id);
    this.move_chessman(from_chessman_id, x, y);
}

function Game() {
    this.user_turn = true;
    this.user_color = 1;
    this.chess = new Chess();
    this.ui = new ChessUI("chess_svg");
    this.selected_chessman = 0;
    this.game_over = this.chess.game_over();
    this.red_check = true;
    this.black_check = true;
}

Game.prototype.on_board_click = function(e) {
    if (this.chess.game_over()) return;
    if (!this.user_turn) return;
    var ex = e.pageX;
    var ey = e.pageY;
    var coor = this.ui.get_click_coor(ex, ey);
    if (!coor.valid) return;
    var addr = (coor.x + 3) + (coor.y + 3) * 16;
    if (!Chess.valid_address(addr)) return;
    var chessman = this.chess.get_square()[addr];
    //if (chessman == 0) return;
    var color = Chess.decode_chessman(chessman)[0];
    // user select own chessman
    if (chessman != 0 && color == this.user_color) {
        if (this.selected_chessman != 0) {
            var selected_chessman_id = Chess.get_chessman_id(this.selected_chessman);
            this.ui.deactive_arm(selected_chessman_id);
        }
        this.selected_chessman = chessman;
        this.src = addr;

        var chessman_id = Chess.get_chessman_id(chessman);
        this.ui.active_arm(chessman_id);
    } else {
        if (this.selected_chessman != 0) {
            // selected_chessman is not null, check for move
            var move = this.chess.generate_move(this.src, addr);

            // apply move
            if (!this.chess.valid_move(move)) return;
            this.apply_move(move, this.user_color);
            var select_id = Chess.get_chessman_id(chessman);
            this.selected_chessman = 0;
            //this.src = addr;
        }
    }
}

Game.prototype.apply_ui_move = function(move) {
    var move_info = Chess.decode_move(move);
    var killed_chessman = move_info[3];
    var killed_chessman_id = null;
    if (killed_chessman) {
        killed_chessman_id = Chess.get_chessman_id(killed_chessman);
    }

    var dest = Chess.get_address(move_info[1]);
    var chessman_id = Chess.get_chessman_id(move_info[2]);
    this.ui.apply_move(chessman_id, killed_chessman_id, dest.x, dest.y);
}

Game.prototype.rep_status = function() {
    return 1 + (this.red_check ? 2 : 0) + (this.black_check ? 4 : 0);
}

Game.prototype.apply_move = function(move, color) {
    this.apply_ui_move(move);
    this.chess.apply_move(move, true);
    this.user_turn = false;
    if (this.chess.game_over()) {
        this.user_turn = true;
        this.update_status('你赢了');
    } else {
        if (this.chess.check_king(1 - color)) {
            this.red_check = true
            if (this.rep_status() == 3) {
                this.update_status('红方长将,你输了...');
            } else {
                this.update_status('红方将军,程序正在思考...');
            }
        } else {
            this.red_check = false;
            this.update_status('程序正在思考...');
        }
        setTimeout(function() {
            var ai_move = this.chess.find_best_move(1 - this.user_color);
            if (ai_move == null || ai_move == 0) {

            } else {
                this.apply_ui_move(ai_move);
                if (ai_move == null || ai_move == 0) {
                    //alert('game is over');
                    this.update_status('程序已经认输...');
                    this.user_turn = true;
                    return false;
                }
                this.chess.apply_move(ai_move, true);
                this.user_turn = true;
                if (this.chess.game_over()) {
                    this.update_status('你输了');
                } else {
                    if (this.chess.check_king(color)) {
                        this.black_check = true;
                        if (this.rep_status() == 3) {
                            this.update_status('程序长将,你赢了...');
                        } else {
                            this.update_status('程序将军...');
                        }
                    } else {
                        this.black_check = false;
                        this.update_status();
                    }
                }
            }
        }.bind(this), 100);
    }
}

Game.prototype.on_back_click = function(e) {
    if (!this.user_turn) {
        this.update_status('程序正在思考,不能悔棋...');
        return false;
    }

    if (!this.chess.can_reverse()) {
        this.update_status('已经回到棋局开始...');
        return false;
    }

    this.chess.user_reverse_move();
    this.ui.create_game(this.chess.get_arms());
    this.update_status();
}

Game.prototype.on_restart_click = function() {
    this.chess.reset();
    this.ui.init(this.chess.get_arms());
    this.update_status();
}

Game.prototype.update_status = function(status_text) {
    var status_div = document.getElementById('status');
    status_div.textContent = '比赛第:' + (this.chess.get_move_length() + 1) + '步,' + (!status_text ? "请走棋" : status_text);
}

Game.prototype.init = function() {
    this.chess.reset();
    this.ui.init(this.chess.get_arms());
    document.getElementById('chess_svg').addEventListener('click', this.on_board_click.bind(this));
    document.getElementById('btn_back').addEventListener('click', this.on_back_click.bind(this));
    document.getElementById('btn_restart').addEventListener('click', this.on_restart_click.bind(this));
    this.update_status();
}

var game = new Game();
game.init();
