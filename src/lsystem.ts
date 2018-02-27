import {vec3, mat4} from 'gl-matrix';

class LSystem {
    lsystem: string = "";
    rules: { [input: string]: string; } = {};
    iter: number = 0;

    constructor(position: vec3, axiom: string) {
        this.initRules();
        this.lsystem = axiom;
        console.log(this.lsystem);
        this.expandLSystem(3);
    }

    initRules() {
        this.rules["A"] = "ACE";
        this.rules["B"] = "CAB";
        this.rules["C"] = "[+ABEA]";
        this.rules["E"] = "A";
        this.rules["["] = "[";
        this.rules["]"] = "]";
    }

    expandLSystem(iters: number) {
        let new_string = "";
        for(let iter = 0; iter < iters; iter++) {
            for(let i = 0; i < this.lsystem.length; i++) {
                let s = this.processRule(this.lsystem.substring(i, i+1), i + iters);
                new_string = new_string.concat(s);
            }
            this.lsystem = new_string;
            new_string = "";
            console.log(this.lsystem);
        }
    }
    
    hash(x: number) {
        let f = Math.sin(vec3.dot(vec3.fromValues(x,x,x), vec3.fromValues(12.9898, 78.233, 78.156))) * 43758.5453;
        return f - Math.floor(f);
    }

    processRule(s: string, iter: number) {
        let hash = this.hash(iter);
        let out = this.rules[s];
        let ss = "+";
        if(s == "C") {
            console.log(hash);
            if(hash < 0.25) {
                ss = "-";
            } else if(hash < 0.5) {
                ss = "*";
            } else if(hash < 0.75) {
                ss = "/";
            }
            out = out.replace("+",ss);
        }
        return out;
    }

  };
  
export default LSystem;