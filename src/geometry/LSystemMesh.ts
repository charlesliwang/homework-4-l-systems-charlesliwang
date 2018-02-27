import {vec3, vec4, mat4, quat} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import Turtle from "../turtle";
import {gl} from '../globals';
import lsystem from '../lsystem';
import { lstat } from 'fs';

class LSystemMesh extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  idx: number[] = [];
  pos: number[] = [];
  nor: number[] = [];
  col: number[] = [];
  idx_off: number = 0;
  turtles: Turtle[] = [];
  lsystem: string = "[AAA[ABAA]AA]";
  flow_vertices: number[] = [];

  center: vec4;
  cylSubD: number = 8;

  constructor(center: vec3, lsystem: string) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    //this.lsystem = "[AAA[+AA[*AAA[*AAA]A]A]AA]";
    this.lsystem = lsystem;
    //this.createBranch(vec3.fromValues(0,0,0), vec3.fromValues(0,1,0), vec3.fromValues(0,0,1), 1, 0.5);
    //this.readLSystem(vec3.fromValues(0,0,0), vec3.fromValues(0,1,0), vec3.fromValues(0,0,1), 1, 0.5);
  }

  create() {
    this.readLSystem(vec3.fromValues(0,0,0), vec3.fromValues(0,1,0), vec3.fromValues(0,0,1), 1, 0.5);
    //this.pushFlowVBOs(vec3.fromValues(0,2,0), vec3.fromValues(0,0,-1), 1);
    console.log(this.pos);
    this.indices = new Uint32Array(this.idx);
    this.normals = new Float32Array(this.nor);
    this.positions = new Float32Array(this.pos);
    this.colors = new Float32Array(this.col);
    this.generateIdx();
    this.generatePos();
    this.generateNor();
    this.generateCol();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

    console.log(`Created LSystemMesh`);
  }

  storeFlowVerts(vertices: number[]) {
        this.flow_vertices = vertices;
  }

  pushFlowVBOs(center:vec3, dir: vec3, scale: number) {
        let count = 0;
        for(let i = 0; i < this.flow_vertices.length; i = i + 18) {
            let curr_idx = this.pos.length/4.0;
            for(let j = 0; j < 3; j++) {
                let v1 = this.flow_vertices[i + 6*j];
                let v2 = this.flow_vertices[i+1 + 6*j];
                let v3 = this.flow_vertices[i+2 + 6*j];
                let v = vec3.fromValues(v1,v2,v3);
                let angle = vec3.angle(vec3.fromValues(0,1,0),dir);
                let axis = vec3.create();
                vec3.cross(axis, vec3.fromValues(0,1,0),dir);
                let q = quat.create();
                quat.setAxisAngle(q, axis, angle );
                vec3.transformQuat(v,v,q);
                vec3.scale(v,v,scale);
                vec3.add(v,v,center);
                let n1 = this.flow_vertices[i+3 + 6*j];
                let n2 = this.flow_vertices[i+4 + 6*j];
                let n3 = this.flow_vertices[i+5 + 6*j];
                let n = vec3.fromValues(n1,n2,n3);
                vec3.transformQuat(n,n,q);
                this.pos.push(v[0],v[1],v[2],1);
                this.nor.push(n[0],n[0],n[0],0);
                this.col.push(1,0,0,1);
            }
            this.idx.push(curr_idx,curr_idx+1,curr_idx+2);
        }
  }


  hash(x: number) {
    let f = Math.sin(vec3.dot(vec3.fromValues(x,x,x), vec3.fromValues(12.9898, 78.233, 78.156))) * 43758.5453;
    return f - Math.floor(f);
    }

  createCylinderLoop(center: vec3, normc: vec3, dir: vec3, right: vec3, r: number, init: boolean){

    vec3.normalize(dir,dir);
    let p_idx = this.idx_off;
    this.idx_off = this.pos.length/4.0;
    let p1 = vec3.create();
    // if(vec3.dot(vec3.fromValues(0,0,1),dir) < 0.9) {
    //     vec3.cross(p1,dir, vec3.fromValues(0,0,1));
    // } else {
    //     vec3.cross(p1,dir, vec3.fromValues(1,0,0));
    // }
    let nnorm = vec3.create();
    vec3.copy(p1,right);
    vec3.normalize(p1,p1);
    vec3.scale(p1,p1,r);
    let idx = this.idx_off;
    let init_idx = idx;
    let init_p_idx = p_idx;
    for(let i = 0; i < this.cylSubD; i++) {
        let pi = vec3.create();
        let di = vec3.create();
        let q = quat.create();
        quat.setAxisAngle(q, dir, (i/this.cylSubD) * Math.PI * 2.0 );
        vec3.transformQuat(pi,p1,q);
        vec3.normalize(di,pi);
        vec3.add(pi,pi,center);
        
        vec3.subtract(nnorm,pi, normc);
        vec3.normalize(nnorm,nnorm);
        this.pos.push(pi[0],pi[1],pi[2], 1.0);
        this.nor.push(nnorm[0],nnorm[1],nnorm[2], 0.0);
        this.col.push(0,1,0,1);
        if(!init){
        if(i == this.cylSubD - 1) {
            this.idx.push(idx , p_idx , init_p_idx);
            this.idx.push(init_idx , idx , init_p_idx);
        } else{
            this.idx.push(idx,p_idx,p_idx+1);
            this.idx.push(idx+1,idx,p_idx+1);
        }
        }
        p_idx++;
        idx++;
    }
    idx = init_idx;
    p_idx = init_p_idx;
    for(let i = 0; i < this.cylSubD; i++) {
        let pi = vec3.create();
        let p2 = vec3.create();
        let p3 = vec3.create();
        let di = vec3.create();
        let q = quat.create();
        quat.setAxisAngle(q, dir, ((i/this.cylSubD) + this.hash(center[1] + i * 5) * 30) * Math.PI * 2.0 );
        vec3.transformQuat(pi,p1,q);
        vec3.normalize(di,pi);
        vec3.add(pi,pi,center);
        
        let norm_offset = vec3.create();
        let dir_offset = vec3.create();
        vec3.subtract(nnorm,pi, normc);
        vec3.scale(norm_offset, nnorm, -0.05);
        vec3.scale(dir_offset, dir, this.hash(center[1] + i * 5) * -0.3);
        vec3.normalize(nnorm,nnorm);
        vec3.add(pi,pi,norm_offset);
        //vec3.add(pi,pi,dir_offset);
        this.pos.push(pi[0],pi[1],pi[2], 1.0);
        vec3.add(p2,pi,vec3.fromValues(0,0.02,0));
        this.pos.push(p2[0],p2[1],p2[2], 1.0);
        vec3.scale(norm_offset, nnorm, 0.5 * r);
        vec3.add(p3,pi,norm_offset);
        this.pos.push(p3[0],p3[1],p3[2], 1.0);
        this.nor.push(nnorm[0],nnorm[1],nnorm[2], 0.0);
        this.nor.push(nnorm[0],nnorm[1],nnorm[2], 0.0);
        this.nor.push(nnorm[0],nnorm[1],nnorm[2], 0.0);
        this.col.push(1,1,1, 1);
        this.col.push(1,1,1, 1);
        this.col.push(1,1,1, 1);
        idx = this.pos.length/4.0;
        if(!init){
            this.idx.push(idx-3,idx-2,idx-1);
        }
        p_idx++;
        idx++;
    }

  }


  createBranch(center: vec3, dir: vec3, right: vec3, iters: number, r: number) {
    //set intial loop
    this.createCylinderLoop(center, center, dir, right,r, true);
    //extendloop
    
    let off = vec3.create();
    
    this.extendCylinder(center,dir,right,off, 1.0, r);
    this.extendCylinder(center,dir,right,off, 0.5, r);
    this.createJoint(center,dir, right, right, off, r, 4);
    this.createCylinderLoop(center, center, dir, right, r, false);
    this.extendCylinder(center,dir,right,off, 0.5, r);
    this.capCylinder(center,dir,right,off, 1.0, r, 4);

  }

  readLSystem(center: vec3, dir: vec3, right: vec3, iters: number, r: number) {
    let off = vec3.create();
    let new_branch = true;
    let depth = 0;
    for(let i = 0; i < this.lsystem.length; i++) {
        let up = vec3.create();
        let axis = vec3.create();
        vec3.cross(up,dir,right);
        
        let s = this.lsystem.substring(i, i+1);
        if(s == "A" || s== "E") {
            if(new_branch) {
                this.createCylinderLoop(center, center, dir, right, r, true);
            }
            r *=1.08;
            this.extendCylinder(center,dir,right,off, 1.0, r);   
            new_branch = false;
        }
        if(s == "B") {
            if(depth == 1) {
                continue;
            }
            vec3.copy(axis,right);
            vec3.cross(up,dir,right);
            if(vec3.dot(up, vec3.fromValues(0,1,0) ) > 0.99) {
                vec3.scale(axis,right,-1);
            }
            this.createJoint(center, dir, right, axis, off, r, 4);
            console.log(depth);
        }
        if(s == "[") {
            let turt = new Turtle(center, dir, right, r, depth++);
            this.turtles.push(turt);
            r = r*0.5;
            new_branch = true;
        } 
        if(s == "]") {
            this.capCylinder(center,dir,right,off, 1.0, r, 4);
            this.pushFlowVBOs(center,dir,r);
            let turt = this.turtles.pop();
            vec3.copy(center,turt.pos);
            vec3.copy(dir,turt.dir);
            vec3.copy(right,turt.right);
            depth = turt.depth;
            console.log(depth);
            r = turt.r;
            new_branch = true;
        }
        if(s == "+") {
            vec3.copy(axis,right);
            vec3.cross(up,dir,right);
            if(vec3.dot(up, vec3.fromValues(0,1,0) ) > 0.99) {
                vec3.scale(axis,right,-1);
            }
            this.rotateDir(center,dir,axis, off, r);
        }
        if(s == "*") {
            this.rotateDir(center,dir, up, off, r);
            vec3.cross(right,up,dir);
        }
        if(s == "-") {
            vec3.scale(dir,dir,-1);
            vec3.copy(axis,right);
            vec3.cross(up,dir,right);
            if(vec3.dot(up, vec3.fromValues(0,1,0) ) > 0.99) {
                vec3.scale(axis,right,-1);
            }
            this.rotateDir(center,dir,right, off, r);
        }
        if(s == "/") {
            vec3.scale(dir,dir,-1);
            this.rotateDir(center,dir, up, off, r);
            vec3.cross(right,up,dir);
        }
    }
  }
  
  capCylinder(center: vec3, dir: vec3, right: vec3, off:vec3, d: number, r: number, smoothness: number) {
      let new_r = r;
      let temp_c = vec3.create();
      vec3.copy(temp_c, center);
        for(let i = 0; i < smoothness; i++) {
            let t = (i + 1)/smoothness;
            t = Math.sqrt(1-(t*t));
            vec3.scale(off, dir, r * d * (i + 1) / smoothness);
            vec3.add(center, off ,temp_c);
            t = Math.max(0.2,t);
            new_r = t*r;
            this.createCylinderLoop(center, temp_c, dir, right, new_r, false);
        }
        
        //this.idx_off = this.pos.length/4.0;
        let piv = this.idx_off + (this.cylSubD - 1);
        let idx = this.idx_off;


        for(let i = 1; i < this.cylSubD - 1; i++) {
            this.idx.push(piv,idx,idx+1);
            idx++;
        }
  }
  extendCylinder(center: vec3, dir: vec3, right: vec3, off:vec3, d: number, r: number) {
        vec3.scale(off, dir, r * d * 0.8);
        vec3.add(center, off ,center);
        this.createCylinderLoop(center, center, dir, right, r, false);
  }

  createJoint(center: vec3, dir: vec3, right: vec3, axis: vec3, off: vec3, r: number, smoothness: number) {
        for(let i = 0; i < smoothness; i++) {
            this.rotateByAxis(center,dir, axis, off, r, smoothness);
            this.createCylinderLoop(center, center, dir, right, r, false);
        }
  }

  rotateByAxis(center: vec3, dir: vec3, axis: vec3, off: vec3, r: number, smoothness: number) {
        let piv_off= vec3.create();
        vec3.cross(piv_off,dir, axis);
        vec3.normalize(piv_off,piv_off);
        vec3.scale(piv_off,piv_off,r);
        let q = quat.create();
        let piv_pt = vec3.create();
        vec3.sub(piv_pt,center,piv_off);

        quat.setAxisAngle(q, axis, 90/smoothness * Math.PI /180.0 );
        vec3.transformQuat(piv_off,piv_off,q);
        vec3.transformQuat(dir,dir,q);
        vec3.add(center, piv_pt ,piv_off);
        off = vec3.create();
        vec3.scale(off, dir, r * 0.1);
        vec3.add(center, center ,off);
  }

  rotateDir(center: vec3, dir: vec3, axis: vec3, off: vec3, r: number){
        let q = quat.create();       
        quat.setAxisAngle(q, axis, 90 * Math.PI /180.0 );
        vec3.transformQuat(dir,dir,q);

        vec3.scale(off, dir, r * 1.5);
        vec3.add(center, center, off);
  }
};

export default LSystemMesh;
