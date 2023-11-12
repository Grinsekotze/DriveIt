const cvs = document.getElementById("driveit");
const ctx = cvs.getContext("2d");

const gameWidth = cvs.clientWidth;
const gameHeight = cvs.clientHeight;
const margin_x = 400;
const margin_y = 150;

var pan_x = 0;
var pan_y = 0;

// load images
const carImg = new Image();
carImg.src = "img/car.png";
backgroundImg = new Image();
backgroundImg.src = "img/campus.jpg";
var back_x = 0;
var back_y = 0;

// ----------------- helper functions -----------------------

function drawRotScale(img, x, y, pivot_x, pivot_y, angle, factor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(-pivot_x * factor, -pivot_y * factor);
    ctx.drawImage(img, 0, 0, factor * img.width, factor * img.height);
    ctx.restore();
}

function drawLine(x1, y1, x2, y2) {
    ctx.save();
    ctx.beginPath(); 
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

function degtorad(angle_d) {
    return angle_d * Math.PI / 180.0;
}

function get_angle(x, y) {
    return (x == 0) ? 
        ( y > 0 ? degtorad(90) : degtorad(-90) ) : 
        ( x > 0 ? Math.atan(y / x) :
        Math.atan(y / x) + Math.PI );
}

function get_angle_from_to(x1, y1, x2, y2) {
    return get_angle(x2 - x1, y2 - y1);
}

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

// ------------------------- driving logic ----------------------------

var b_scale = 11; //world scale, px per meter
var d_scale = 30; //drawing scale, px per meter

class vehicle_type {
    constructor(img, scale, base_y, wheelbase, max_speed, acc, coast, brake, max_steer) {
        this.img = img;
        this.scale = scale;         // pixels per meter
        this.base_y = base_y;       // pixel y-value of rear axle
        this.wheelbase = wheelbase; // m
        this.max_speed = max_speed; // m/s
        this.acc = acc;             // m/s²
        this.coast = coast;         // m/s²
        this.brake = brake;         // m/s²
        this.max_steer = max_steer; // radians
    }
}

car = new vehicle_type(carImg, 60, 200, 2.5, 20, 6, 2, 8, degtorad(40));

class vehicle {

    constructor(type, x, y, angle, speed) { //all "physical" measurements in SI units
        this.type = type;
        this.x = x;
        this.y = y;
        this.angle = angle; //radians clockwise (since y axis is downwards)
        this.speed = speed;
        this.steer = 0;

        this.fx = x + Math.cos(angle) * type.wheelbase;
        this.fy = y + Math.sin(angle) * type.wheelbase;
        this.mode = "neutral";
    }

    update(delta, acc_in, brake_in, steer_in) {
        this.speed += delta * acc_in * this.type.acc;

        if(this.speed == 0 && !acc_in && !brake_in) { this.mode = "neutral"; }

        if(this.mode == "forward") {
            this.speed += delta * (acc_in * this.type.acc - this.type.coast - brake_in * this.type.brake);
            if(this.speed < 0) { this.speed = 0; }
            if(this.speed > this.type.max_speed) { this.speed = this.type.max_speed; }
        } else if(this.mode == "backward") {
            this.speed -= delta * (brake_in * this.type.acc - this.type.coast - acc_in * this.type.brake);
            if(this.speed > 0) { this.speed = 0; }
            if(this.speed < -this.type.max_speed) { this.speed = -this.type.max_speed; }
        } else if(this.mode == "neutral") {
            if(brake_in) { this.mode = "backward"; }
            if(acc_in) { this.mode = "forward"; }
        }
        
        this.steer += delta * degtorad(180) * steer_in * (Math.exp(-Math.log(2) / 15.0 * this.speed));
        if(this.steer >  this.type.max_steer) { this.steer =  this.type.max_steer; }
        if(this.steer < -this.type.max_steer) { this.steer = -this.type.max_steer; }
        this.steer *= (1 - delta * 3.0); 

        this.fx += delta * this.speed * Math.cos(this.angle + this.steer);
        this.fy += delta * this.speed * Math.sin(this.angle + this.steer);
        this.angle = get_angle_from_to(this.x, this.y, this.fx, this.fy);
        this.x = this.fx - this.type.wheelbase * Math.cos(this.angle);
        this.y = this.fy - this.type.wheelbase * Math.sin(this.angle);
    }

    draw() {
        drawRotScale(this.type.img, this.x, this.y, this.type.img.width / 2, this.type.base_y, this.angle + degtorad(90), 1.0 / this.type.scale)
        ctx.fillStyle = "red";
        ctx.fillRect(this.x - 0.05, this.y - 0.05, 0.15, 0.15);
        ctx.fillStyle = "yellow";
        ctx.fillRect(this.fx - 0.05, this.fy - 0.05, 0.15, 0.15);
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 0.05;
        drawLine(this.fx, this.fy, this.fx + 0.5 * Math.cos(this.angle + this.steer), this.fy + 0.5 * Math.sin(this.angle + this.steer));
    }

}

player = new vehicle(car, 7, 50, 0, 0)


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

    
    // player_px_on_bg_x = 

    d_old = d_scale; b_old = b_scale;
    d_scale *= (1 + delta * 1.0 * (isPressed[83] - isPressed[65])); //zoom using A and S keys
    b_scale /= (1 + delta * 1.0 * (isPressed[87] - isPressed[81])); //scale background using Q and W keys
    pan_x = pan_x + d_old * player.x - d_scale * player.x; //offset canvas so zoom motion is towards the player
    pan_y = pan_y + d_old * player.y - d_scale * player.y;
    back_x = player.x - (b_old / b_scale) * (-back_x + player.x); //offset background so player stays fixed
    back_y = player.y - (b_old / b_scale) * (-back_y + player.y);
    
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
    player.draw();
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