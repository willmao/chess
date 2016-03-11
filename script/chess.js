"use strict";
/**
 * Reset the array with specific value
 * @param {object} value to reset
 */
Array.prototype.reset = function(value) {
    for (var i = 0; i < this.length; i++) {
        this[i] = value;
    }
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
        { x1: 5, y1: 9, x2: 3, y2: 7 },

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
    svg.setAttribute('class', basic_class);
    svg.setAttribute('data-class', basic_class);

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

ChessUI.prototype.create_game = function() {
    var game = this.create_svg_element('g');
    var docf = document.createDocumentFragment();
    for (var i = 0; i < this.arms.length; i++) {
        var arm_def = this.get_arm_def(this.arms[i]);
        var arm = this.create_arm(arm_def);
        docf.appendChild(arm);
    }

    game.appendChild(docf);

    var svg = document.getElementById(this.svg_id);
    svg.appendChild(game);
}

ChessUI.prototype.active_arm = function(id) {
    var arm = document.getElementById(id);
    var basic_class = arm.getAttribute('data-class');
    arm.setAttribute('class', basic_class + ' active');
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

var chess_ui = new ChessUI("chess_svg");
//chess_ui.create_board();
//chess_ui.create_game();
//chess_ui.bind_click_event();

function Chess() {
    this.square = new Array(256).reset(0);
    this.arms = new Array(256).reset(0);
    this.moves = new Array(1024).reset(0);
    this.move_history = new Array(256).reset(0);
}




Chess.arm_colors = [
    // 0x00
    'black',
    // 0x01
    'red'
];

Chess.arm_names = [
    'rook',
    'horse',
    'elephant',
    'guard',
    'king',
    'cannon',
    'pawn'
];

Chess.arm_counts = [
    2,
    2,
    2,
    2,
    1,
    2,
    5
];

Chess.arm_static_score = [
    100,
    400,
    200,
    100,
    1000,
    500,
    100
];

// chessman encoding:
// color arms   no
//     1    3    4
//     x  xxx xxxx
//     0  000 0001
10000001
Chess.basic_square = [
    0x01, 0x11, 0x21, 0x31, 0x41, 0x32, 0x22, 0x12, 0x02, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0x51, 0, 0, 0, 0, 0x52, 0, 0, 0, 0, 0, 0, 0, 0, 0,

    0x61, 0, 0x62, 0, 0x63, 0, 0x64, 0, 0x65, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0xe1, 0, 0xe2, 0, 0xe3, 0, 0xe4, 0, 0xe5, 0, 0, 0, 0, 0, 0, 0,


    0, 0xd1, 0, 0, 0, 0, 0xd2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0x81, 0x91, 0xa1, 0xb1, 0xc1, 0xb2, 0xa2, 0x92, 0x82, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

Chess.test_basic_square = function() {
    for (var i = 0; i < this.basic_square.length; i++) {
        if (this.basic_square[i] > 0) {
            var arm = this.basic_square[i];
           // console.log(arm);
            var color = (arm >> 7) ? 'red' : 'black';
            var type = this.arm_names[(arm >> 4)&0x7 ];
            //console.log(arm>>4);
            var no = (arm & 0x07);
            var id = color + "_" + type + "_" + no + "_" + i;
            console.log(id);
        }
    }
}

var chess = new Chess();

Chess.test_basic_square();