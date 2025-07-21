import {Particle} from "./particle.model.ts";
import {NB_COLORS, PARTICLE_SIZE} from "../config/config.ts";
import {MassService} from "../mass/mass.service.ts";
import {PositionService} from "../postion/position.service.ts";
import {Panel} from "../../panel/panel.ts";

export class ParticleService {
    private readonly _ctx: CanvasRenderingContext2D;
    private _particles: Particle[] = [];

    constructor(ctx: CanvasRenderingContext2D) {
        this._ctx = ctx;
        this.initParticles();
    }


    public start(): void {
        this.applyForces();
        this.draw();
    }

    public initParticles(): void {
        const particles: Particle[] = [];

        const nbParticlesPerColor: number = Panel.nbParticles / NB_COLORS;

        for (const color of Panel.colors) {
            const mass: number = MassService.generateMass();

            for (let i: number = 0; i < nbParticlesPerColor; i++) {
                const position: {
                    x: number,
                    y: number
                } = PositionService.generatePosition(this._ctx.canvas.width, this._ctx.canvas.height);
                particles.push(new Particle(position.x, position.y, mass, color));
            }
        }

        this._particles = particles;
    }

    private applyForces(): void {
        for (const particle of this._particles) {
            let forceX: number = 0;
            let forceY: number = 0;

            const width: number = this._ctx.canvas.width;
            const height: number = this._ctx.canvas.height;

            for (const otherParticle of this._particles) {
                if (particle === otherParticle) continue;

                if (particle.x > width - Panel.limitOffset && otherParticle.x < Panel.limitOffset) {
                    otherParticle.x += width;
                } else if (particle.x < Panel.limitOffset && otherParticle.x > width - Panel.limitOffset) {
                    otherParticle.x -= width;
                }

                if (particle.y > height - Panel.limitOffset && otherParticle.y < Panel.limitOffset) {
                    otherParticle.y += height;
                } else if (particle.y < Panel.limitOffset && otherParticle.y > height - Panel.limitOffset) {
                    otherParticle.y -= height;
                }

                const distanceX: number = otherParticle.x - particle.x;
                const distanceY: number = otherParticle.y - particle.y;
                const distance: number = Math.sqrt(distanceX ** 2 + distanceY ** 2);

                if (distance < Panel.limitOffset) {
                    const g: number = this.getGravitationalForce(particle, otherParticle);
                    const m1: number = otherParticle.mass;
                    const m2: number = particle.mass;
                    let force: number = (g * m1 * m2) / distance ** 2;

                    const scale: number = 8;
                    const collisionD: number = otherParticle.mass * scale + particle.mass * scale;

                    if (distance <= collisionD) {
                        force *= force < 0 ? 1 : -1;
                    }

                    forceX += (force * distanceX) / particle.mass;
                    forceY += (force * distanceY) / particle.mass;
                }
            }

            particle.vx += forceX;
            particle.vy += forceY;

            particle.vx *= Panel.velocity;
            particle.vy *= Panel.velocity;
        }

        for (const particle of this._particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < 0) particle.x += this._ctx.canvas.width;
            if (particle.y < 0) particle.y += this._ctx.canvas.height;
            if (particle.x > this._ctx.canvas.width) particle.x -= this._ctx.canvas.width;
            if (particle.y > this._ctx.canvas.height) particle.y -= this._ctx.canvas.height;
        }
    }

    private getGravitationalForce(particle: Particle, otherParticle: Particle): number {
        const indexColorParticle: number = Panel.colors.indexOf(particle.color);
        const indexColorOtherParticle: number = Panel.colors.indexOf(otherParticle.color);
        return Panel.forces[indexColorParticle][indexColorOtherParticle];
    }

    private draw(): void {
        if(Panel.erase) this._ctx.clearRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);

        this._ctx.shadowBlur = 0;
        this._ctx.shadowColor = 'transparent';
        this._ctx.shadowOffsetX = 0;
        this._ctx.shadowOffsetY = 0;

        for (const particle of this._particles) {
            this._ctx.beginPath();
            this._ctx.arc(particle.x, particle.y, PARTICLE_SIZE, 0, 2 * Math.PI);
            this._ctx.fillStyle = particle.color;

            if (Panel.displayBlur) {
                this._ctx.shadowBlur = 8;
                this._ctx.shadowColor = particle.color;
                this._ctx.shadowOffsetX = 0;
                this._ctx.shadowOffsetY = 0;
            }

            this._ctx.fill();
            this._ctx.closePath();
        }
    }
}