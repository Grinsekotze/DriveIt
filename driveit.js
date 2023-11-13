const cvs = document.getElementById("driveit");
const ctx = cvs.getContext("2d");

const gameWidth = cvs.clientWidth;
const gameHeight = cvs.clientHeight;
const margin_x = 400;
const margin_y = 150;

var pan_x = 0;
var pan_y = 0;

backgroundImg = new Image();
backgroundImg.src = "img/campus.jpg";
var back_x = 0;
var back_y = 0;

// ------------------------- pasting a background image ---------------

document.addEventListener('paste', function (e) { paste_auto(e); }, false);

function paste_auto(e) {
    if (e.clipboardData) {
        var items = e.clipboardData.items;
        if (!items) return;
        
        //access data directly
        var is_image = false;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                //image
                var blob = items[i].getAsFile();
                var URLObj = window.URL || window.webkitURL;
                var source = URLObj.createObjectURL(blob);
                pastedImage = new Image();
                pastedImage.src = source;
                backgroundImg = pastedImage;
                console.log("Image pasted! Created URL " + source);
                is_image = true;
            }
        }
        if(is_image == true){
            e.preventDefault();
        }
    }
}

// ------------------------- set up vehicles ----------------------------

var b_scale = 11; //world scale, px per meter
var d_scale = 30; //drawing scale, px per meter

player = new vehicle(car, 7, 50, 0, 0);
trailer1 = new vehicle(lightTrailer, 3, 50, 0, 0);
trailer2 = new vehicle(lightTrailer, 1, 50, 0, 0);
player.trail = trailer1;
trailer1.trail = trailer2;

// ----------------- game loop -------------------------

var isPressed = {};
for(k = 0; k < 120; k++) { isPressed[k] = false };

window.onkeyup = function(e) { isPressed[e.keyCode] = false; }
window.onkeydown = function(e) { isPressed[e.keyCode] = true; }

function game_update(delta) {
    
    acc_in   = isPressed[38]; //up
    brake_in = isPressed[40]; //down
    steer_in = isPressed[39] - isPressed[37]; //right - left. Note that since our y axis is flipped, positive angles are clockwise
    
    player.update(delta, acc_in, brake_in, steer_in);

    d_old = d_scale; b_old = b_scale;
    d_scale *= (1 + delta * 1.0 * (isPressed[83] - isPressed[65])); //zoom using A and S keys
    b_scale /= (1 + delta * 1.0 * (isPressed[87] - isPressed[81])); //scale background using Q and W keys
    pan_x = pan_x + d_old * player.x - d_scale * player.x; //offset canvas so zoom motion is towards the player
    pan_y = pan_y + d_old * player.y - d_scale * player.y;
    back_x = player.x - (b_old / b_scale) * (player.x - back_x); //offset background so player stays fixed
    back_y = player.y - (b_old / b_scale) * (player.y - back_y);
    
    // pan to keep the player on screen.
    if(d_scale * player.fx + pan_x >  gameWidth - margin_x) { pan_x =  gameWidth - margin_x - d_scale * player.fx; }
    if(d_scale * player.fy + pan_y > gameHeight - margin_y) { pan_y = gameHeight - margin_y - d_scale * player.fy; }
    if(d_scale * player.fx + pan_x < margin_x) { pan_x = margin_x - d_scale * player.fx; }
    if(d_scale * player.fy + pan_y < margin_y) { pan_y = margin_y - d_scale * player.fy; }

    // pan_x += delta * 40 * (isPressed[76] - isPressed[74]); //pan using IJKL
    // pan_y += delta * 40 * (isPressed[75] - isPressed[73]);
}

let lastLoop = new Date();

function draw() {

    var thisLoop = new Date();
    var delta = (thisLoop - lastLoop) / 1000;
    lastLoop = thisLoop;

    game_update(delta)
    
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 1600, 900);

    ctx.save();
    ctx.translate(pan_x, pan_y);
    ctx.scale(d_scale, d_scale);
    ctx.drawImage(backgroundImg, back_x, back_y, backgroundImg.width / b_scale, backgroundImg.height / b_scale);
    player.draw(true);
    ctx.restore();

    // visualize scale in bottom right corner
    scale_level = Math.floor(Math.log10(d_scale));
    scale_unit = 10 ** (1 - scale_level);
    if(d_scale * scale_unit < 20) { scale_unit *= 5; }
    if(d_scale * scale_unit < 50) { scale_unit *= 2; }
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    drawLine(gameWidth - 20, gameHeight - 20, gameWidth - 20 - d_scale * scale_unit, gameHeight - 20);
    drawLine(gameWidth - 20, gameHeight - 20, gameWidth - 20, gameHeight - 30);
    drawLine(gameWidth - 20 - d_scale * scale_unit, gameHeight - 20, gameWidth - 20 - d_scale * scale_unit, gameHeight - 30);
    drawLine(gameWidth - 20, gameHeight - 20, gameWidth - 20 - d_scale * scale_unit, gameHeight - 20);
    ctx.font = "14px Arial";
    ctx.fillText(scale_unit + "m", gameWidth - 30 - 0.5 * d_scale * scale_unit, gameHeight - 25);

    // ctx.font = "28px Arial";
    // for(k = 32; k <= 40; k++) {
    //     ctx.fillStyle = isPressed[k] ? "red" : "black";
    //     ctx.fillText(k, 40 * (k-30), 60);
    // }
    // ctx.fillStyle = "black";
    // ctx.fillText("d_scale: " + d_scale, 80, 100);
    // ctx.fillText("b_scale: " + b_scale, 80, 140);

}

// call draw function every few ms

let game = setInterval(draw, 10);