const cvs = document.getElementById("driveit");
const ctx = cvs.getContext("2d");

// load images
const carImg = new Image();
carImg.src = "img/car.png";
const backgroundImg = new Image();
backgroundImg.src = "img/spielteppich.jpg";

function collision(x1, y1, x2, y2, r) {
    return (Math.abs(x1 - x2) + Math.abs(y1 - y2) < r);
}

// draw everything to the canvas

let lastLoop = new Date();

function draw() {

    var thisLoop = new Date();
    var delta = (thisLoop - lastLoop) / 1000;
    lastLoop = thisLoop;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 720, 720);

    ctx.drawImage(backgroundImg, 0, 0, 800, 600);

    ctx.fillStyle = "white";
    ctx.font = "24px Comic Sans MS";
    ctx.fillText("Hello World" + score, 0, 0);

}

// call draw function every 50 ms

let game = setInterval(draw, 15);