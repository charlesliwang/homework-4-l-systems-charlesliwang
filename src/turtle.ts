import {vec3, vec4, mat4} from 'gl-matrix';

class Turtle {

    pos: vec3 = vec3.create();
    dir: vec3 = vec3.create();
    right: vec3 = vec3.create();
    depth: number;
    r: number;

    constructor(pos: vec3, dir:vec3 , right:vec3, r: number, depth: number) {
        vec3.copy(this.pos,pos);
        vec3.copy(this.dir,dir);
        vec3.copy(this.right,right);
        this.depth = depth;
        this.r  = r;
    }

};
  
export default Turtle;