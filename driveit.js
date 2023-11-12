const cvs = document.getElementById("driveit");
const ctx = cvs.getContext("2d");

const gameWidth = cvs.clientWidth;
const gameHeight = cvs.clientHeight;

// load images
const carImg = new Image();
carImg.src = "img/car.png";
const backgroundImg = new Image();
backgroundImg.src = "img/spielteppich.jpg";

// ----------------- helper functions -----------------------

function drawRotated(img, x, y, pivot_x, pivot_y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(-pivot_x, -pivot_y);
    ctx.drawImage(img, 0, 0);
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

// ------------------------- driving logic ----------------------------

const scale = 60; //px per meter

class vehicle_type {
    constructor(img, steer_y, base_y, max_speed, acc, coast, brake) {
        this.img = img;
        this.steer_y = steer_y;     //in px
        this.base_y = base_y;       //in px
        this.max_speed = max_speed; //in m/s
        this.acc = acc;             //in m/s²
        this.coast = coast;         //in m/s²
        this.brake = brake;         //in m/s²

        this.wheelbase = (base_y - steer_y) / scale; //in m
    }
}

car = new vehicle_type(carImg, 50, 200, 10, 6, 2, 8);

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
        
        this.steer += delta * degtorad(180) * steer_in;
        if(this.steer >  degtorad(60)) { this.steer =  degtorad(60); }
        if(this.steer < -degtorad(60)) { this.steer = -degtorad(60); }
        this.steer *= (1 - delta * 2.0); 

        this.fx += delta * this.speed * Math.cos(this.angle + this.steer);
        this.fy += delta * this.speed * Math.sin(this.angle + this.steer);
        this.angle = get_angle_from_to(this.x, this.y, this.fx, this.fy);
        this.x = this.fx - this.type.wheelbase * Math.cos(this.angle);
        this.y = this.fy - this.type.wheelbase * Math.sin(this.angle);
    }

    draw() {
        drawRotated(this.type.img, scale * this.x, scale * this.y, this.type.img.width / 2, this.type.base_y, this.angle + degtorad(90))
        ctx.fillStyle = "red";
        ctx.fillRect(scale * this.x - 1, scale * this.y - 1, 3, 3);
        ctx.fillStyle = "yellow";
        ctx.fillRect(scale * this.fx - 1, scale * this.fy - 1, 3, 3);
        ctx.strokeStyle = "yellow";
        drawLine(scale * this.fx, scale * this.fy,
            scale * (this.fx + 0.5 * Math.cos(this.angle + this.steer)), scale * (this.fy + 0.5 * Math.sin(this.angle + this.steer)));
    }

}

player = new vehicle(car, 7, 5, 0, 1)
player.steer = degtorad(40);


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
}

let lastLoop = new Date();

function draw() {

    var thisLoop = new Date();
    var delta = (thisLoop - lastLoop) / 1000;
    lastLoop = thisLoop;

    game_update(delta)
    
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 1600, 900);

    ctx.drawImage(backgroundImg, 0, 0, 1280, 720);

    player.draw()

    // ctx.font = "24px Arial";
    // for(k = 32; k <= 40; k++) {
    //     ctx.fillStyle = isPressed[k] ? "red" : "black";
    //     ctx.fillText(k, 40 * (k-30), 60);
    // }
    // ctx.fillStyle = "black";
    // ctx.fillText("x: " + player.x, 80, 100);
    // ctx.fillText("y: " + player.y, 80, 140);
    // ctx.fillText("a: " + player.angle, 80, 180);
    // ctx.fillText("s: " + player.speed, 80, 220);

}

// call draw function every few ms

let game = setInterval(draw, 10);