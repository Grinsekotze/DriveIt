const cvs = document.getElementById("driveit");
const ctx = cvs.getContext("2d");

const gameWidth = cvs.clientWidth;
const gameHeight = cvs.clientHeight;

// load images
const carImg = new Image();
carImg.src = "img/car.png";
const backgroundImg = new Image();
backgroundImg.src = "img/spielteppich.jpg";

// declarations and functions

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

class vehicle_type {
    constructor(img, steer_y, base_y, max_speed, acc, coast, brake) {
        this.img = img;
        this.steer_y = steer_y;
        this.base_y = base_y;
        this.max_speed = max_speed;
        this.acc = acc;
        this.coast = coast;
        this.brake = brake;

        this.wheelbase = base_y - steer_y;
    }
}

car = new vehicle_type(carImg, 50, 200, 10, 3, 1, 4);

class vehicle {

    constructor(type, x, y, angle, speed) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.steer = 0;

        this.fx = x + Math.cos(angle) * type.wheelbase;
        this.fy = y + Math.sin(angle) * type.wheelbase;
    }

    update(delta) {
        this.fx += delta * this.speed * Math.cos(this.angle + this.steer);
        this.fy += delta * this.speed * Math.sin(this.angle + this.steer);
        this.angle = get_angle_from_to(this.x, this.y, this.fx, this.fy);
        this.x = this.fx - this.type.wheelbase * Math.cos(this.angle);
        this.y = this.fy - this.type.wheelbase * Math.sin(this.angle);
    }

    draw() {
        drawRotated(this.type.img, this.x, this.y, this.type.img.width / 2, this.type.base_y, this.angle + degtorad(90))
        ctx.fillStyle = "red";
        ctx.fillRect(this.x - 1, this.y - 1, 3, 3);
        ctx.fillStyle = "yellow";
        ctx.fillRect(this.fx - 1, this.fy - 1, 3, 3);
        ctx.strokeStyle = "yellow";
        drawLine(this.fx, this.fy, this.fx + 30 * Math.cos(this.angle + this.steer), this.fy + 30 * Math.sin(this.angle + this.steer));
    }

}

player = new vehicle(car, 400, 300, 0, 60)
player.steer = degtorad(140);

// game loop

let x, y

function game_update(delta) {
    player.update(delta);
}

// draw everything to the canvas

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

    ctx.fillStyle = "black";
    ctx.font = "24px Comic Sans MS";
    ctx.fillText("Hello World", 20, 20);

}

// call draw function every 50 ms

let game = setInterval(draw, 15);