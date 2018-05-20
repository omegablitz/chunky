function getLoadedChunks() {
    // XXX This is static for now because we need to test stuff ;)
    return {
        server1: [[-18, 17], [-14, 14], [-17, 18], [-15, 15], [-12, 17], [-16, 20], [-12, 16], [-13, 15], [-17, 19], [-16, 16], [-16, 15], [-15, 20], [-18, 18], [-13, 19], [-13, 20], [-18, 20], [-14, 17], [-15, 16], [-17, 14], [-16, 17], [-13, 18], [-12, 14], [-17, 16], [-12, 19], [-18, 15], [-16, 19], [-13, 17], [-18, 19], [-12, 18], [-15, 19], [-17, 17], [-14, 20], [-16, 14], [-15, 14], [-14, 18], [-14, 16], [-17, 20], [-13, 14], [-12, 15], [-18, 16], [-17, 15], [-15, 18], [-16, 18], [-14, 15], [-18, 14], [-12, 20], [-13, 16], [-14, 19], [-15, 17]],
    };
}

var cameraX = 0;
var cameraY = 0;

var centerX = 0;
var centerY = 0;

var tileSize = 16; // 16x16 px tile for each chunk

let headerFont = "30px Arial";
let legendFont = "18px Arial";

var canvas = $('#canvas');
var context = canvas[0].getContext('2d');
var win = $(window);

let endpoint = "http://" + window.location.hostname + ":8080/chunks";

/**
 *   Resizes canvas to match window width and height
 */
function resize() {
    // canvas.width(win.width()).height(win.height());
    canvas.attr('width', win.width());
    canvas.attr('height', win.height());

    centerX = win.width() / 2;
    centerY = win.height() / 2;
}
win.resize(resize).resize();

/**
 *  Logic to load rpc's from manager
 */
let lastLoaded = 0;

function rpcLoader() {
    // lastLoaded = getLoadedChunks();
    // setTimeout(rpcLoader, 2000);
    $.get(endpoint, function(result) {
        console.log(result);
        lastLoaded = result;

        setTimeout(rpcLoader, 500);
    });
}

// Keep colors consistent
let colors = {};

/**
 *    Main render loop
 */
function renderLoop() {
    var w = canvas.width();
    var h = canvas.height();

    // Background is black
    context.fillStyle = 'black';
    context.fillRect(0, 0, w, h);

    if (lastLoaded !== 0) {
        // Fetch the meta-data to draw
        var meta = lastLoaded;

        // Draw the chunks by server
        for (var server in meta) {
            var chunks = meta[server];
            var color = colors[server];

            if (color == null) {
                colors[server] = getRndColor();
                color = colors[server];
            }

            context.fillStyle = color;

            for (var i = 0; i < chunks.length; i++) {
                var chunk = chunks[i];
                
                var chunkX = chunk[0];
                var chunkY = chunk[1];

                drawChunk(chunkX, chunkY);
            }
        }
    }

    // Draw legend
    var fh = 30;
    var p = 10;

    var sX = 20;
    var sY = 20;

    context.fillStyle = "rgb(40, 40, 40)";
    context.fillRect(sX, sY, 200, (fh+p) * Object.keys(lastLoaded).length)

    var currentY = p + sY;
    for (var server in lastLoaded) {
        context.fillStyle = colors[server];
        context.fillRect(sX + p, currentY, 20, 20);

        context.font = legendFont;
        context.fillStyle = "white";
        context.fillText(server, sX + p + 20 + p, currentY+fh/2);

        currentY += fh + p;
    }


    // Loop
    setTimeout(renderLoop, 10);
}

// Call the render loop once
$(document).ready(() => {
    renderLoop();
    rpcLoader();
});

/*
*   Get a random color
*/
function getRndColorA() {
    var r = 255*Math.random()|0,
        g = 255*Math.random()|0,
        b = 255*Math.random()|0;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}

var colorCount = 0;
var colorNames = ['red', 'blue', 'yellow', 'purple', 'brown'];

function getRndColor() {
    var name = colorNames[colorCount];
    if (colorCount >= colorNames.length) name = getRndColorA();
    colorCount++;

    return name;
}

/*
*   Draw a single chunk given its position
*/
function drawChunk(chunkX, chunkY) {
    var worldX = chunkX * tileSize;
    var worldY = chunkY * tileSize;

    var cameraObjX = worldX + cameraX;
    var cameraObjY = worldY + cameraY;

    var viewX = cameraObjX + centerX;
    var viewY = cameraObjY + centerY;

    context.fillRect(viewX, viewY, tileSize, tileSize);

    context.strokeStyle = "black";
    context.strokeRect(viewX, viewY, tileSize, tileSize);
}

let down = false;

let downX = 0;
let downY = 0;

let downCameraX = 0;
let downCameraY = 0;

/*
*   Mouse events for dragging
*/
canvas.mousedown((data) => {
    down = true;

    downX = data.pageX;
    downY = data.pageY;

    downCameraX = cameraX;
    downCameraY = cameraY;
});

canvas.mouseup((data) => {
    down = false;
});

canvas.mousemove((data) => {
    if (down) {
        cameraX = downCameraX + (data.pageX - downX);
        cameraY = downCameraY + (data.pageY - downY);
    }
});

canvas.mousewheel(function(event) {
    tileSize += event.deltaY;
});
