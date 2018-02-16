import {vec3, mat4} from 'gl-matrix';

class LSystem {
    lsystem: string = "";
    rules: { [input: string]: string; } = {};
    iter: number = 0;

    constructor(position: vec3, axiom: string) {
        this.initRules();
        this.lsystem = axiom;
        console.log(this.lsystem);
        this.expandLSystem(2);
    }

    initRules() {
        this.rules["A"] = "AA";
        this.rules["B"] = "[BA]";
        this.rules["["] = "[";
        this.rules["]"] = "]";
    }

    expandLSystem(iters: number) {
        let new_string = "";
        for(let iter = 0; iter < iters; iter++) {
            for(let i = 0; i < this.lsystem.length; i++) {
                let s = this.rules[this.lsystem.substring(i, i+1)]
                new_string = new_string.concat(s);
            }
            this.lsystem = new_string;
            new_string = "";
            console.log(this.lsystem);
        }
    }

  };
  
export default LSystem;