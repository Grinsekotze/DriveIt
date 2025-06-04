class vehicle_type {
    constructor(img, scale, base_y, wheelbase, max_speed, acc, coast, brake, max_steer, couple_pos) {
        this.img = img;
        this.scale = scale;         // pixels per meter
        this.base_y = base_y;       // pixel y-value of rear axle
        this.wheelbase = wheelbase; // m
        this.max_speed = max_speed; // m/s
        this.acc = acc;             // m/s²
        this.coast = coast;         // m/s²
        this.brake = brake;         // m/s²
        this.max_steer = max_steer; // radians
        this.couple_pos = couple_pos;   // distance from rear axle to coupling in m
    }
}

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
        this.cx = x - Math.cos(angle) * type.couple_pos;
        this.cy = y - Math.sin(angle) * type.couple_pos;
        this.mode = "neutral";
        this.trail = false;
    }

    pull(new_fx, new_fy) {
        this.fx = new_fx;
        this.fy = new_fy;
        this.angle = get_angle_from_to(this.x, this.y, this.fx, this.fy);
        this.x = this.fx - this.type.wheelbase * Math.cos(this.angle);
        this.y = this.fy - this.type.wheelbase * Math.sin(this.angle);
        this.cx = this.x - this.type.couple_pos * Math.cos(this.angle);
        this.cy = this.y - this.type.couple_pos * Math.sin(this.angle);
        if(this.trail) { this.trail.pull(this.cx, this.cy); }
    }

    update(delta, acc_in, brake_in, steer_in) {

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

        this.pull(
            this.fx + delta * this.speed * Math.cos(this.angle + this.steer),
            this.fy + delta * this.speed * Math.sin(this.angle + this.steer));
    }

    draw(with_points) {
        drawRotScale(this.type.img, this.x, this.y, this.type.img.width / 2, this.type.base_y, this.angle + degtorad(90), 1.0 / this.type.scale)
        if(with_points) {
            ctx.fillStyle = "red";
            ctx.fillRect(this.x - 0.05, this.y - 0.05, 0.15, 0.15);
            ctx.fillStyle = "yellow";
            ctx.fillRect(this.fx - 0.05, this.fy - 0.05, 0.15, 0.15);
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 0.05;
            drawLine(this.fx, this.fy, this.fx + 0.5 * Math.cos(this.angle + this.steer), this.fy + 0.5 * Math.sin(this.angle + this.steer));
        }

        if(this.trail) { this.trail.draw( false ); }
    }

}

const carImg = new Image();
carImg.src = "img/car.png";
const trailerImg = new Image();
trailerImg.src = "img/trailer.png";
const busImg = new Image();
busImg.src = "img/bus.png";
const busTrailerImg = new Image();
busTrailerImg.src = "img/bus_trailer.png";
const semiImg = new Image();
semiImg.src = "img/semi.png";
const semiTrailerImg = new Image();
semiTrailerImg.src = "img/semi_trailer.png";
const garbageImg = new Image();
garbageImg.src = "img/3achsigesMF.png";

car = new vehicle_type(
    carImg,         // image
    60,             // scale [px/meter]
    200,            // rear axle position [px]
    2.5,            // wheelbase [m]
    20,             // max speed [m/s]
    6,              // acceleration [m/s²]
    2,              // drag [m/s²]
    12,             // brake [m/s²]
    degtorad(40),   // steering lock
    0.9             // rear axle to coupling [m]
);
lightTrailer = new vehicle_type(
    trailerImg,
    92,
    380,
    3.75,
    100,
    100,
    0,
    100,
    degtorad(90),
    2.0
);
bus = new vehicle_type(
    busImg,         // image
    100,            // scale [px/meter]
    870,            // rear axle position [px]
    5.9,            // wheelbase [m]
    20,             // max speed [m/s]
    6,              // acceleration [m/s²]
    2,              // drag [m/s²]
    12,             // brake [m/s²]
    degtorad(40),   // steering lock
    3.4             // rear axle to coupling [m]
);
semi = new vehicle_type(
    semiImg,        // image
    71,             // scale [px/meter]
    382,            // rear axle position [px]
    3.95,            // wheelbase [m]
    20,             // max speed [m/s]
    6,              // acceleration [m/s²]
    2,              // drag [m/s²]
    12,             // brake [m/s²]
    degtorad(40),   // steering lock
    -0.73           // rear axle to coupling [m]
);
semiTrailer = new vehicle_type(
    semiTrailerImg, // image
    100,            // scale [px/meter]
    934,            // rear axle position [px]
    7.6,            // wheelbase [m]
    100,            // max speed [m/s]
    100,            // acceleration [m/s²]
    0,              // drag [m/s²]
    100,            // brake [m/s²]
    degtorad(90),   // steering lock
    5.25            // rear axle to coupling [m]
);
garbage = new vehicle_type(
    garbageImg,     // image
    940 / 9.90,     // scale [px/meter]
    (1.53 + 4.77) * (940 / 9.90),    // rear axle position [px]
    4.77,           // wheelbase [m]
    20,             // max speed [m/s]
    6,              // acceleration [m/s²]
    2,              // drag [m/s²]
    12,             // brake [m/s²]
    degtorad(40),   // steering lock
    3.6             // rear axle to coupling [m]
);
