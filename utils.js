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