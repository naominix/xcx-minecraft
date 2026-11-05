/**
 * Minecraft (mcwss-microbit) extension for Xcratch.
 *
 * Where this file can live: the Xcratch editor is a public https
 * site, and browsers will not load a module from a plain http
 * address on the local network, so for classroom use this file
 * is hosted at a public https URL (GitHub Pages, like the other
 * Xcratch extensions). The app also serves it
 * (GET /scratch/extension.mjs, with the current token substituted
 * in), which remains handy for development.
 *
 * How it finds the app: the "start" block takes the app link the
 * Web UI shows (http://<pc-address>:8080/?token=...). The link is
 * stored in the project, and its origin and token become the API
 * destination. With no link given, the extension probes the
 * origin it was loaded from - which is the app itself in the
 * app-served case.
 *
 * The API calls themselves go from the https editor page to the
 * http app on the local network. Modern Chrome allows that once
 * the user grants the Local Network Access permission prompt;
 * declaring targetAddressSpace on the fetch is what tells the
 * browser the request is a local-network one.
 *
 * There are no reporter blocks: the Minecraft websocket protocol
 * cannot read game state back, and the turtle's state lives in
 * the app, not in the game.
 */

let formatMessage = message => message.defaultMessage || message.default;

const translate = (id, defaultText) => formatMessage({
    id: `mcwssMinecraft.${id}`,
    default: defaultText,
    defaultMessage: defaultText,
    description: id
});

const EXTENSION_ID = 'mcwssMinecraft';
const API_VERSION = 1;

// Replaced by the app when this file is served by it (the
// development route). In the publicly hosted copy the placeholder
// stays, and the token comes from the pasted app link instead.
const BRIDGE_TOKEN = '__MCWSS_TOKEN__';

let extensionURL = '';

const en = {
    'mcwssMinecraft.entry.name': 'Minecraft',
    'mcwssMinecraft.entry.description': 'Draw in Minecraft with a turtle, via the mcwss-microbit app',
    'mcwssMinecraft.init': 'connect to Minecraft and start with app link [LINK]',
    'mcwssMinecraft.forward': 'move forward [STEPS]',
    'mcwssMinecraft.backward': 'move backward [STEPS]',
    'mcwssMinecraft.right': 'turn right [DEGREES] degrees',
    'mcwssMinecraft.left': 'turn left [DEGREES] degrees',
    'mcwssMinecraft.up': 'look up [DEGREES] degrees',
    'mcwssMinecraft.down': 'look down [DEGREES] degrees',
    'mcwssMinecraft.setHeading': 'set heading to [DEGREES] degrees',
    'mcwssMinecraft.setVerticalHeading': 'set vertical heading to [DEGREES] degrees',
    'mcwssMinecraft.turtleSetPos': 'move turtle to x:[X] y:[Y] z:[Z]',
    'mcwssMinecraft.penDown': 'pen down',
    'mcwssMinecraft.penUp': 'pen up',
    'mcwssMinecraft.setPenBlock': 'set pen block to [BLOCK]',
    'mcwssMinecraft.setBlock': 'place a block at x:[X] y:[Y] z:[Z]',
    'mcwssMinecraft.mark1': 'set cuboid corner 1 to the turtle',
    'mcwssMinecraft.fillTo': 'fill to corner 2 (the turtle) with [BLOCK]',
    'mcwssMinecraft.setPos': 'move player to x:[X] y:[Y] z:[Z]',
    'mcwssMinecraft.chat': 'send [TEXT] to chat',
    'mcwssMinecraft.wait': 'wait until drawing finishes',
    'mcwssMinecraft.drawSphere': 'draw a sphere of radius [R] at the turtle with [BLOCK]',
    'mcwssMinecraft.drawCircle': 'draw a circle of radius [R] at the turtle with [BLOCK]',
    'mcwssMinecraft.drawLine': 'draw a line from the turtle to x:[X] y:[Y] z:[Z] with [BLOCK]',
    'mcwssMinecraft.addPoint': 'remember the turtle as a face vertex',
    'mcwssMinecraft.clearPoints': 'clear all remembered vertices',
    'mcwssMinecraft.drawFace': 'draw a face through the remembered vertices with [BLOCK] (fill [FILL])',
    'mcwssMinecraft.setPenRandom': 'set pen block to random',
    'mcwssMinecraft.setRate': 'set drawing speed to [RATE] blocks/sec'
};

const ja = {
    'mcwssMinecraft.entry.name': 'マイクラ',
    'mcwssMinecraft.entry.description': 'mcwss-microbit アプリ経由で、タートルグラフィックスでマイクラに描きます',
    'mcwssMinecraft.init': 'アプリのリンク [LINK] でマイクラにつないで開始する',
    'mcwssMinecraft.forward': '前へ [STEPS] 進む',
    'mcwssMinecraft.backward': '後ろへ [STEPS] 進む',
    'mcwssMinecraft.right': '右へ [DEGREES] 度回る',
    'mcwssMinecraft.left': '左へ [DEGREES] 度回る',
    'mcwssMinecraft.up': '上へ [DEGREES] 度向く',
    'mcwssMinecraft.down': '下へ [DEGREES] 度向く',
    'mcwssMinecraft.setHeading': '向きを [DEGREES] 度にする',
    'mcwssMinecraft.setVerticalHeading': '上下の向きを [DEGREES] 度にする',
    'mcwssMinecraft.turtleSetPos': 'タートルを x:[X] y:[Y] z:[Z] へ移動',
    'mcwssMinecraft.penDown': 'ペンを下ろす',
    'mcwssMinecraft.penUp': 'ペンを上げる',
    'mcwssMinecraft.setPenBlock': 'ペンのブロックを [BLOCK] にする',
    'mcwssMinecraft.setBlock': 'x:[X] y:[Y] z:[Z] にブロックを置く',
    'mcwssMinecraft.mark1': '直方体の角1をタートルの場所にする',
    'mcwssMinecraft.fillTo': '角2（タートルの場所）まで [BLOCK] で埋める',
    'mcwssMinecraft.setPos': 'プレイヤーを x:[X] y:[Y] z:[Z] へ移動',
    'mcwssMinecraft.chat': 'チャットに [TEXT] と送る',
    'mcwssMinecraft.wait': '描き終わるまで待つ',
    'mcwssMinecraft.drawSphere': 'タートルの場所に半径 [R] の球を [BLOCK] で描く',
    'mcwssMinecraft.drawCircle': 'タートルの場所に半径 [R] の円を [BLOCK] で描く',
    'mcwssMinecraft.drawLine': 'タートルの場所から x:[X] y:[Y] z:[Z] まで線を [BLOCK] で引く',
    'mcwssMinecraft.addPoint': '頂点をタートルの場所に覚える',
    'mcwssMinecraft.clearPoints': '頂点を全部消す',
    'mcwssMinecraft.drawFace': '覚えた頂点の面を [BLOCK] で描く（塗りつぶし [FILL]）',
    'mcwssMinecraft.setPenRandom': 'ペンのブロックをランダムにする',
    'mcwssMinecraft.setRate': '描く速さを [RATE] ブロック/秒にする'
};

const translations = {en, ja, 'ja-Hira': ja};

const entry = {
    get name() {
        return formatMessage({
            id: 'mcwssMinecraft.entry.name',
            defaultMessage: 'マイクラ',
            description: 'name of the extension'
        });
    },
    extensionId: EXTENSION_ID,
    extensionURL: '',
    collaborator: 'naominix',
    get description() {
        return formatMessage({
            id: 'mcwssMinecraft.entry.description',
            defaultMessage: 'mcwss-microbit アプリ経由で、タートルグラフィックスでマイクラに描きます',
            description: 'description of the extension'
        });
    },
    tags: [],
    featured: true,
    disabled: false,
    bluetoothRequired: false,
    internetConnectionRequired: false,
    setFormatMessage: function (formatter) {
        formatMessage = formatter;
    },
    translationMap: translations
};

// The pen block menu. Values are the palette keys the app
// understands; the app owns the mapping to Bedrock block names.
const BLOCK_MENU = [
    ['石', 'stone'],
    ['草ブロック', 'grass'],
    ['土', 'dirt'],
    ['丸石', 'cobblestone'],
    ['木材（オーク）', 'planks'],
    ['木材（マツ）', 'planks_spruce'],
    ['木材（シラカバ）', 'planks_birch'],
    ['木材（ジャングル）', 'planks_jungle'],
    ['木材（アカシア）', 'planks_acacia'],
    ['木材（ダークオーク）', 'planks_dark_oak'],
    ['砂', 'sand'],
    ['砂利', 'gravel'],
    ['ガラス', 'glass'],
    ['ラピスラズリブロック', 'lapis'],
    ['金ブロック', 'gold'],
    ['鉄ブロック', 'iron'],
    ['ダイヤモンドブロック', 'diamond'],
    ['レンガ', 'bricks'],
    ['本棚', 'bookshelf'],
    ['黒曜石', 'obsidian'],
    ['岩盤', 'bedrock'],
    ['グロウストーン', 'glowstone'],
    ['羊毛（白）', 'wool_white'],
    ['羊毛（オレンジ）', 'wool_orange'],
    ['羊毛（マゼンタ）', 'wool_magenta'],
    ['羊毛（空色）', 'wool_light_blue'],
    ['羊毛（黄）', 'wool_yellow'],
    ['羊毛（黄緑）', 'wool_lime'],
    ['羊毛（ピンク）', 'wool_pink'],
    ['羊毛（灰）', 'wool_gray'],
    ['羊毛（薄灰）', 'wool_light_gray'],
    ['羊毛（水色）', 'wool_cyan'],
    ['羊毛（紫）', 'wool_purple'],
    ['羊毛（青）', 'wool_blue'],
    ['羊毛（茶）', 'wool_brown'],
    ['羊毛（緑）', 'wool_green'],
    ['羊毛（赤）', 'wool_red'],
    ['羊毛（黒）', 'wool_black'],
    ['コンクリート（白）', 'concrete_white'],
    ['コンクリート（オレンジ）', 'concrete_orange'],
    ['コンクリート（マゼンタ）', 'concrete_magenta'],
    ['コンクリート（空色）', 'concrete_light_blue'],
    ['コンクリート（黄）', 'concrete_yellow'],
    ['コンクリート（黄緑）', 'concrete_lime'],
    ['コンクリート（ピンク）', 'concrete_pink'],
    ['コンクリート（灰）', 'concrete_gray'],
    ['コンクリート（薄灰）', 'concrete_light_gray'],
    ['コンクリート（水色）', 'concrete_cyan'],
    ['コンクリート（紫）', 'concrete_purple'],
    ['コンクリート（青）', 'concrete_blue'],
    ['コンクリート（茶）', 'concrete_brown'],
    ['コンクリート（緑）', 'concrete_green'],
    ['コンクリート（赤）', 'concrete_red'],
    ['コンクリート（黒）', 'concrete_black']
];

// The app destination, resolved by resolveBridge(): either from
// the link pasted into the start block, or by probing the origin
// this module was loaded from (the app-served case).
let bridge = null;
let appLink = '';

const addressSpaceOf = (base) => {
    try {
        const host = new URL(base).hostname;
        return (host === 'localhost' || host === '127.0.0.1' || host === '::1') ? 'loopback' : 'local';
    } catch (e) {
        return 'local';
    }
};

const fetchToApp = (base, path, init) => fetch(base + path, Object.assign({}, init, {
    targetAddressSpace: addressSpaceOf(base)
}));

/**
 * Resolve where the app is. A pasted app link wins outright.
 * Otherwise probe the load origin's state endpoint: the app
 * answers it, a public hosting origin does not.
 */
const resolveBridge = async () => {
    if (bridge) {
        return bridge;
    }
    if (appLink) {
        const url = new URL(appLink);
        bridge = {base: url.origin, token: url.searchParams.get('token') || ''};
        return bridge;
    }
    const origins = [];
    for (const candidate of [extensionURL, import.meta.url]) {
        try {
            const url = new URL(candidate);
            if ((url.protocol === 'http:' || url.protocol === 'https:') && !origins.includes(url.origin)) {
                origins.push(url.origin);
            }
        } catch (e) {
            // not a usable URL; skip it
        }
    }
    for (const origin of origins) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3000);
            const headers = {};
            // The placeholder literal is spelled in two parts so
            // the app's serve-time substitution (which replaces
            // the literal everywhere) cannot rewrite this check.
            if (BRIDGE_TOKEN && BRIDGE_TOKEN !== '__MCWSS' + '_TOKEN__') {
                headers['X-API-Token'] = BRIDGE_TOKEN;
            }
            const response = await fetchToApp(origin, '/api/scratch/state', {headers, signal: controller.signal});
            clearTimeout(timer);
            if (response.ok) {
                const data = await response.json();
                if (data && typeof data.gameConnected === 'boolean') {
                    bridge = {base: origin, token: headers['X-API-Token'] || ''};
                    return bridge;
                }
            }
        } catch (e) {
            // not the app; try the next origin
        }
    }
    throw new Error('mcwss-microbit: app not found. Paste the app link (shown in the app Web UI) into the start block.');
};

/**
 * Send one op to the app. A failure (app not running, game not
 * connected, queue full) is logged and rethrown so the block
 * visibly fails instead of pretending to succeed.
 */
const sendOp = async (op, args) => {
    const isWait = op === 'wait';
    const target = await resolveBridge();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), isWait ? 300000 : 15000);
    try {
        const headers = {'Content-Type': 'application/json'};
        if (target.token) {
            headers['X-API-Token'] = target.token;
        }
        const response = await fetchToApp(target.base, '/api/scratch/command', {
            method: 'POST',
            headers,
            body: JSON.stringify({v: API_VERSION, op, args: args || {}}),
            signal: controller.signal
        });
        if (!response.ok) {
            let detail = `HTTP ${response.status}`;
            try {
                const data = await response.json();
                if (data && data.error) detail += ` (${data.error})`;
            } catch (e) {
                // keep the status-only detail
            }
            throw new Error(`mcwss-microbit: ${op} failed: ${detail}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`[mcwssMinecraft] ${op} failed`, error);
        throw error;
    } finally {
        clearTimeout(timer);
    }
};

const num = value => {
    const n = Number(value);
    if (!Number.isFinite(n)) {
        throw new Error(`mcwss-microbit: not a number: ${value}`);
    }
    return n;
};

class McwssMinecraftBlocks {
    constructor(runtime) {
        this.runtime = runtime;
    }

    static set formatMessage(formatter) {
        formatMessage = formatter;
    }

    static get EXTENSION_NAME() {
        return translate('entry.name', 'マイクラ');
    }

    static get EXTENSION_ID() {
        return EXTENSION_ID;
    }

    static get extensionURL() {
        return extensionURL;
    }

    static set extensionURL(url) {
        extensionURL = url;
    }

    getInfo() {
        const number = (defaultValue) => ({type: 'number', defaultValue});
        const posArgs = () => ({
            X: number(0),
            Y: number(1),
            Z: number(0)
        });
        const blockArg = () => ({
            type: 'string',
            menu: 'blockMenu',
            defaultValue: 'stone'
        });
        return {
            id: EXTENSION_ID,
            name: translate('entry.name', 'マイクラ'),
            blocks: [
                {
                    opcode: 'init',
                    blockType: 'command',
                    text: translate('init', 'アプリのリンク [LINK] でマイクラにつないで開始する'),
                    arguments: {LINK: {type: 'string', defaultValue: ''}}
                },
                {
                    opcode: 'forward',
                    blockType: 'command',
                    text: translate('forward', '前へ [STEPS] 進む'),
                    arguments: {STEPS: number(10)}
                },
                {
                    opcode: 'backward',
                    blockType: 'command',
                    text: translate('backward', '後ろへ [STEPS] 進む'),
                    arguments: {STEPS: number(10)}
                },
                {
                    opcode: 'right',
                    blockType: 'command',
                    text: translate('right', '右へ [DEGREES] 度回る'),
                    arguments: {DEGREES: number(90)}
                },
                {
                    opcode: 'left',
                    blockType: 'command',
                    text: translate('left', '左へ [DEGREES] 度回る'),
                    arguments: {DEGREES: number(90)}
                },
                {
                    opcode: 'up',
                    blockType: 'command',
                    text: translate('up', '上へ [DEGREES] 度向く'),
                    arguments: {DEGREES: number(45)}
                },
                {
                    opcode: 'down',
                    blockType: 'command',
                    text: translate('down', '下へ [DEGREES] 度向く'),
                    arguments: {DEGREES: number(45)}
                },
                {
                    opcode: 'setHeading',
                    blockType: 'command',
                    text: translate('setHeading', '向きを [DEGREES] 度にする'),
                    arguments: {DEGREES: number(0)}
                },
                {
                    opcode: 'setVerticalHeading',
                    blockType: 'command',
                    text: translate('setVerticalHeading', '上下の向きを [DEGREES] 度にする'),
                    arguments: {DEGREES: number(0)}
                },
                {
                    opcode: 'turtleSetPos',
                    blockType: 'command',
                    text: translate('turtleSetPos', 'タートルを x:[X] y:[Y] z:[Z] へ移動'),
                    arguments: posArgs()
                },
                {
                    opcode: 'penDown',
                    blockType: 'command',
                    text: translate('penDown', 'ペンを下ろす'),
                    arguments: {}
                },
                {
                    opcode: 'penUp',
                    blockType: 'command',
                    text: translate('penUp', 'ペンを上げる'),
                    arguments: {}
                },
                {
                    opcode: 'setPenBlock',
                    blockType: 'command',
                    text: translate('setPenBlock', 'ペンのブロックを [BLOCK] にする'),
                    arguments: {BLOCK: blockArg()}
                },
                {
                    opcode: 'setBlock',
                    blockType: 'command',
                    text: translate('setBlock', 'x:[X] y:[Y] z:[Z] にブロックを置く'),
                    arguments: posArgs()
                },
                {
                    opcode: 'mark1',
                    blockType: 'command',
                    text: translate('mark1', '直方体の角1をタートルの場所にする'),
                    arguments: {}
                },
                {
                    opcode: 'fillTo',
                    blockType: 'command',
                    text: translate('fillTo', '角2（タートルの場所）まで [BLOCK] で埋める'),
                    arguments: {BLOCK: blockArg()}
                },
                {
                    opcode: 'setPos',
                    blockType: 'command',
                    text: translate('setPos', 'プレイヤーを x:[X] y:[Y] z:[Z] へ移動'),
                    arguments: posArgs()
                },
                {
                    opcode: 'chat',
                    blockType: 'command',
                    text: translate('chat', 'チャットに [TEXT] と送る'),
                    arguments: {TEXT: {type: 'string', defaultValue: 'こんにちは！'}}
                },
                {
                    opcode: 'wait',
                    blockType: 'command',
                    text: translate('wait', '描き終わるまで待つ'),
                    arguments: {}
                },
                {
                    opcode: 'drawSphere',
                    blockType: 'command',
                    text: translate('drawSphere', 'タートルの場所に半径 [R] の球を [BLOCK] で描く'),
                    arguments: {R: number(5), BLOCK: blockArg()}
                },
                {
                    opcode: 'drawCircle',
                    blockType: 'command',
                    text: translate('drawCircle', 'タートルの場所に半径 [R] の円を [BLOCK] で描く'),
                    arguments: {R: number(5), BLOCK: blockArg()}
                },
                {
                    opcode: 'drawLine',
                    blockType: 'command',
                    text: translate('drawLine', 'タートルの場所から x:[X] y:[Y] z:[Z] まで線を [BLOCK] で引く'),
                    arguments: Object.assign(posArgs(), {BLOCK: blockArg()})
                },
                {
                    opcode: 'addPoint',
                    blockType: 'command',
                    text: translate('addPoint', '頂点をタートルの場所に覚える'),
                    arguments: {}
                },
                {
                    opcode: 'clearPoints',
                    blockType: 'command',
                    text: translate('clearPoints', '頂点を全部消す'),
                    arguments: {}
                },
                {
                    opcode: 'drawFace',
                    blockType: 'command',
                    text: translate('drawFace', '覚えた頂点の面を [BLOCK] で描く（塗りつぶし [FILL]）'),
                    arguments: {
                        BLOCK: blockArg(),
                        FILL: {type: 'string', menu: 'fillMenu', defaultValue: 'yes'}
                    }
                },
                {
                    opcode: 'setPenRandom',
                    blockType: 'command',
                    text: translate('setPenRandom', 'ペンのブロックをランダムにする'),
                    arguments: {}
                },
                {
                    opcode: 'setRate',
                    blockType: 'command',
                    text: translate('setRate', '描く速さを [RATE] ブロック/秒にする'),
                    arguments: {RATE: number(240)}
                }
            ],
            menus: {
                blockMenu: {
                    acceptReporters: false,
                    items: BLOCK_MENU.map(([text, value]) => ({text, value}))
                },
                fillMenu: {
                    acceptReporters: false,
                    items: [
                        {text: 'する', value: 'yes'},
                        {text: 'しない', value: 'no'}
                    ]
                }
            }
        };
    }

    init(args) {
        // The link field holds the app link from the Web UI
        // (origin plus token). An empty link re-resolves from
        // the load origin, for the app-served case.
        appLink = String((args && args.LINK) || '').trim();
        bridge = null;
        return sendOp('init');
    }

    forward(args) {
        return sendOp('turtle.forward', {steps: num(args.STEPS)});
    }

    backward(args) {
        return sendOp('turtle.backward', {steps: num(args.STEPS)});
    }

    right(args) {
        return sendOp('turtle.right', {degrees: num(args.DEGREES)});
    }

    left(args) {
        return sendOp('turtle.left', {degrees: num(args.DEGREES)});
    }

    up(args) {
        return sendOp('turtle.up', {degrees: num(args.DEGREES)});
    }

    down(args) {
        return sendOp('turtle.down', {degrees: num(args.DEGREES)});
    }

    setHeading(args) {
        return sendOp('turtle.setHeading', {degrees: num(args.DEGREES)});
    }

    setVerticalHeading(args) {
        return sendOp('turtle.setVerticalHeading', {degrees: num(args.DEGREES)});
    }

    turtleSetPos(args) {
        return sendOp('turtle.setPos', {x: num(args.X), y: num(args.Y), z: num(args.Z)});
    }

    penDown() {
        return sendOp('turtle.penDown');
    }

    penUp() {
        return sendOp('turtle.penUp');
    }

    setPenBlock(args) {
        return sendOp('turtle.setPenBlock', {block: String(args.BLOCK)});
    }

    setBlock(args) {
        return sendOp('setBlock', {x: num(args.X), y: num(args.Y), z: num(args.Z)});
    }

    mark1() {
        return sendOp('setBlocks.mark1');
    }

    fillTo(args) {
        return sendOp('setBlocks.fillTo', {block: String(args.BLOCK)});
    }

    setPos(args) {
        return sendOp('setPos', {x: num(args.X), y: num(args.Y), z: num(args.Z)});
    }

    chat(args) {
        return sendOp('chat', {text: String(args.TEXT)});
    }

    wait() {
        return sendOp('wait');
    }

    drawSphere(args) {
        return sendOp('stuff.drawSphere', {r: num(args.R), block: String(args.BLOCK)});
    }

    drawCircle(args) {
        return sendOp('stuff.drawCircle', {r: num(args.R), block: String(args.BLOCK)});
    }

    drawLine(args) {
        return sendOp('stuff.drawLine', {x: num(args.X), y: num(args.Y), z: num(args.Z), block: String(args.BLOCK)});
    }

    addPoint() {
        return sendOp('stuff.addPoint');
    }

    clearPoints() {
        return sendOp('stuff.clearPoints');
    }

    drawFace(args) {
        return sendOp('stuff.drawFace', {block: String(args.BLOCK), filled: String(args.FILL)});
    }

    setPenRandom() {
        return sendOp('turtle.setPenRandom');
    }

    setRate(args) {
        return sendOp('turtle.setRate', {rate: num(args.RATE)});
    }
}

export {entry, McwssMinecraftBlocks as blockClass};
