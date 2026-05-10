//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Particle class                                                        //
//A class to describe a particle, manages movement and rendering        //
//----------------------------------------------------------------------//


import { Vec2, Colour, lerp } from "./miscellaneous.mjs"
import { Game } from "../core/game.mjs";
import { Renderer } from "../core/renderer.mjs";
import { Time } from "./time.mjs";



export class Particle {
    constructor(pos, rot, vel, angVel, width, startColour, midColour, endColour, lifetime, update, onDeath) {
        this.pos = pos;
        this.rot = rot;
        this.vel = vel;
        this.angVel = angVel;
        this.width = width;
        this.currColour = startColour;
        this.startColour = startColour;
        this.midColour = midColour;
        this.endColour = endColour;
        this.lifetime = lifetime;
        this.update = update;
        this.onDeath = onDeath;
        this.frame = 0;
        this.id = Time.frame;
    }

    //----------------------------------------------------------------------//
    //Update()
    //Updates the particle position and other variables
    Update(dt) {
        //is the particle 'dead'?
        //>= because Game.mjs will not update it (to call OnDeath()) if frame > this.lifetime
        if (this.frame >= this.lifetime) {
            this.OnDeath();
            this.frame++; //Stop Game.mjs from updating this particle
            return;
        }

        //Update colour
        if (this.frame / this.lifetime < 0.5) {
            //Lerp between start and mid colours
            this.currColour = Colour.lerp(this.startColour, this.midColour, this.frame / this.lifetime * 2);

        } else {
            //lerp between mid and end colours
            this.currColour = Colour.lerp(this.midColour, this.endColour, this.frame / this.lifetime * 2 - 1);
        }
        


        //Integrate position based on velocity and delta time
        this.pos = this.pos.add(this.vel.mul(dt));

        //Integrate rotation based on angular velocity and delta time
        this.rot += this.angVel * dt;
        this.update(dt);
        this.frame += dt;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //OnDeath()
    //Called when particle is destroyed
    OnDeath() {
        this.onDeath();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Draw()
    //Draws the particle
    Draw() {
        //Draw a square with width this.width at this.pos
        var tl = new Vec2(-1, 1);
        var tr = new Vec2(1, 1);
        var bl = new Vec2(-1, -1);
        var br = new Vec2(1, -1);


        //Rotate
        tl = tl.rotate(this.rot);
        tr = tr.rotate(this.rot);
        bl = bl.rotate(this.rot);
        br = br.rotate(this.rot);


        //Scale
        tl = tl.mul(this.width / 2);
        tr = tr.mul(this.width / 2);
        bl = bl.mul(this.width / 2);
        br = br.mul(this.width / 2);


        //Translate
        tl = tl.add(this.pos);
        tr = tr.add(this.pos);
        bl = bl.add(this.pos);
        br = br.add(this.pos);


        //Draw
        Game.renderer.fill(this.currColour);
        Game.renderer.drawPolygon([tl, tr, br, bl], true, true);
        Game.renderer.fillShape();

        


    }
    //----------------------------------------------------------------------//
}


//----------------------------------------------------------------------//
//spawnExplosion()
//Spawns an explosion at position 'pos'
export function spawnExplosion(pos, vel, innerVel, outerVel, numParticles, randomness, startColour, midColour, endColour) {
    //----------------------------------------//
    //Outer, fast moving ring (shockwave?)
    for (var r = 0; r < Math.PI * 2; r += Math.PI * 2 / numParticles) {
        Game.addParticle(new Particle(
            pos, r + (Math.random() * 2 - 1) * randomness * Math.PI * 2, vel.add(
                new Vec2(
                    Math.sin(r) * outerVel //Determine the fraction of the movement taken up by the x axis
                     + (Math.random() * 2 - 1) * randomness, 

                    Math.cos(r) * outerVel //Determine the fraction of the movement taken up by the y axis
                     + (Math.random() * 2 - 1) * randomness
                )
            ), 
            1, 10, 
            startColour, 
            midColour, 
            endColour, 
            10 + (Math.random() * 2 - 1) * randomness * 10,
            function(){},
            function(){}
        ));
    }
    //----------------------------------------//

    //----------------------------------------//
    //Inner cloud
    for (var r = 0; r < Math.PI * 2; r += Math.PI * 2 / numParticles) {
        Game.addParticle(new Particle(
            pos, r + (Math.random() * 2 - 1) * randomness * Math.PI * 2, vel.add(
                new Vec2(
                    Math.sin(r) * innerVel //Determine the fraction of the movement taken up by the x axis
                     + (Math.random() * 2 - 1) * randomness, 

                    Math.cos(r) * innerVel //Determine the fraction of the movement taken up by the y axis
                     + (Math.random() * 2 - 1) * randomness
                )
            ), 
            1, 10, 
            startColour, 
            midColour, 
            endColour, 
            20 + (Math.random() * 2 - 1) * randomness * 10,
            function(){},
            function(){}
        ));
    }
    //----------------------------------------//
}