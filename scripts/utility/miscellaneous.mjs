//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Miscellaneous classes                                                 //
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Page class
export class Page {
    constructor(title, href, hasCnv, onLoad) {
        this.title = title; //Identifying title
        this.href = href;
        this.hasCnv = hasCnv; //For r_core_setHasCnv
        this.OnLoad = onLoad; //Called on page load
    }
    OnLoad(){}
}
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//Vector 2
export class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    //----------------------------------------------------------------------//
    //add(other)
    //returns the vec2 representing this + other
    add(other) {
        var v = other;
        if (typeof other == "number") {
            v = new Vec2(other, other);
        }
        return new Vec2(this.x + v.x, this.y + v.y);
    }
    //----------------------------------------------------------------------//
    
    //----------------------------------------------------------------------//
    //sub(other)
    //returns the vec2 representing this - other
    sub(other) {
        var v = other;
        if (typeof other == "number") {
            v = new Vec2(other, other);
        }
        return new Vec2(this.x - v.x, this.y - v.y);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //mul(other)
    //returns the vec2 representing this * other
    mul(other) {
        var v = other;
        if (typeof other == "number") {
            v = new Vec2(other, other);
        }
        return new Vec2(this.x * v.x, this.y * v.y);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //div(other)
    //returns the vec2 representing this / other
    div(other) {
        var v = other;
        if (typeof other == "number") {
            v = new Vec2(other, other);
        }
        if (v.x == 0 || v.y == 0) {
            console.error("Vec2.div: divided by zero! Returning new vec2(0,0) - this might break things");
            return new Vec2(0,0);
        }
        return new Vec2(this.x / v.x, this.y / v.y);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //len()
    //returns the length of this
    len() {
        return Math.sqrt(this.sqrMag());
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //sqrMag()
    //returns the square magnitude of this
    sqrMag() {
        return (this.x * this.x + this.y * this.y);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //norm()
    //returns this divided by this.len()
    norm() {
        return this.div(this.len());
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //dir()
    //returns the direction of this
    dir() {
        return Math.atan2(-this.y, this.x) - Math.PI / 2;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //dot(a, b)
    //Dot product of two Vec2-s 'a' and 'b'
    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }
    //----------------------------------------------------------------------//
    
    //----------------------------------------------------------------------//
    //dist(a, b)
    //Distance between two Vec2-s 'a' and 'b'
    static dist(a, b) {
        var delta = a.sub(b);
        return delta.len();
    }
    //squared version (for performance)
    static sqrDist(a, b) {
        var delta = a.sub(b);
        return delta.sqrMag();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //rotatePoint(p, angle)
    //p: point
    //rotates point 'p' through angle 'angle'
    static rotatePoint(p, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        var px = p.x * cos - p.y * sin;
        var py = p.x * sin + p.y * cos;
        p.x = px;
        p.y = py;
        return p;
    }
    rotate(angle) {
        return Vec2.rotatePoint(this, -angle + Math.PI / 2);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //lerp(a, b, k)
    //lerp between two vec2's
    static lerp(a, b, k) {
        return a.add(b.sub(a).mul(k));
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //slerp(a, b, k)
    //spherical linear interpolation from a to b, by k
    static slerp(a, b, k) {
        const DIR_1 = normalizeAngle(a.dir());
        const DIR_2 = normalizeAngle(b.dir());

        const DIF = normalizeAngle(DIR_2 - DIR_1);
        
        const ANG = DIR_1 + DIF * k;
        return new Vec2(Math.sin(ANG), Math.cos(ANG));
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //angDiff(a, b)
    //the angle between two vectors (normalized angle)
    static angDiff(a, b) {
        const DIR_1 = normalizeAngle(a.dir());
        const DIR_2 = normalizeAngle(b.dir());

        const DIF = normalizeAngle(DIR_2 - DIR_1);
        return DIF;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //project(p, v)
    //project point 'p' along vector 'v'
    static project(p, v) {
        const DOT = Vec2.dot(p, v);
        return p.sub(v.mul(DOT));
    }
    //----------------------------------------------------------------------//

}
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//normalizeAngle(ang)
//normalizes the angle 'ang' between -Math.PI and Math.PI
export function normalizeAngle(ang) {
    while (ang > Math.PI) ang -= Math.PI * 2;
    while (ang < -Math.PI) ang += Math.PI * 2;
    return ang;
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//clamp(v, min, max)
//v: value
//clamps 'v' between 'min' and 'max'
export function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
}
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//lerp(a, b, k)
//linearly interpolate from a to b by k
export function lerp(a, b, k) {
    return a + (b - a) * k;
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Reference variable - used to pass a value as a reference
export class RefVar {
    constructor(name, get) {
        this.name = name;
        this.get = get;
    }
    get() {}
}
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//Colour class, for lerping and such.
export class Colour {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    //----------------------------------------------------------------------//
    //txt()
    //returns the text interpretation of the colour, needed for html canvas operations
    txt() {
        return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")";
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //lerp(a, b, k)
    //linearly interpolate between two colours
    static lerp(a, b, k) {
        return Colour.rgba(lerp(a.r, b.r, k), lerp(a.g, b.g, k), lerp(a.b, b.b, k), lerp(a.a, b.a, k));
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //rgb(r, g, b)
    //alternate constructor
    static rgb(r, g, b) {
        return new Colour(r, g, b, 1);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //rgba(r, g, b, a)
    //alternate constructor with alpha
    static rgba(r, g, b, a) {
        return new Colour(r, g, b, a);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //clone(other)
    //avoid changes to this affecting other (js passes classes as references)
    static clone(other) {
        return new Colour(other.r, other.g, other.b, other.a);
    }
    //----------------------------------------------------------------------//

}



//degrees to radians
export const DEG2RAD = Math.PI / 180;

//radians to degrees
export const RAD2DEG = 180 / Math.PI;