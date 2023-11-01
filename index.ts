type FuzzyConfig = {
    scalars : {
        chars : Array<string>,               // list of characters
        capitalDistance : number,            // scalar value added to capital version of letter
        unrecognizedDefault: number          // what should the scalar value of a char not in "chars" be
    },
    scoring : {
        multiplier : {
            initial : number,                // initial multiplier
            reducer : number,                // reduce the multiplier when reduction delimeter appears ("" means reduce on every character)
            reductionDelimeter: string|null, // delimeter to signal reduction in multiplier
            resetDelimeter: string|null,     // resets the multiplier when delimeter appears
            resetReducer: number,            // reduce the multiplier by amount when reduction delimeter appears
            
        },
        formula : "l1" | "l2"
    },
    [key:string] : any                       // to make type linter shut up 
}

type FuzzyConfigArgument = {
    scalars? : {
        chars? : Array<string>,
        capitalDistance? : number
    }
    scoring? : {
        multiplier? : {
            initial? : number,
            reducer? : number,
            resetDelimeter?: string|null,
            resetReducer?:number,
            reductionDelimeter?: string|null
        },
        formula: "l1" | "l2"
    },
    [key:string]: any
}

type SearchParams = {
    root: string,
    space: Array<string>,
    threshold?:number,
    sort?:boolean
}

const defaultFuzzyConfig:FuzzyConfig = {
    scalars : {
        chars: [' ','a', 'e', 'i', 'o', 'u', 'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z','0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', ']', '^', '_', '`', '{', '|', '}', '~'],
        capitalDistance: .001,
        unrecognizedDefault: 0
    },
    scoring : {
        multiplier : {
            initial: 1,
            reducer: 1,
            resetDelimeter: null,
            resetReducer: 1,
            reductionDelimeter: ""
        },
        formula: "l2" 
    }
}

export const Tunings = {
    default: defaultFuzzyConfig,
    focusDropFar: {
        scalars : {
            chars: [' ','a', 'e', 'i', 'o', 'u', 'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z','0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', ']', '^', '_', '`', '{', '|', '}', '~'],
            capitalDistance: 0.001,
            unrecognizedDefault: 0
        },
        scoring : {
            multiplier : {
                initial: 1,
                reducer: 1.1,
                reductionDelimeter: "",
                resetReducer: 1.1,
                resetDelimeter: " "
            },
            l2: {
                sqrt: false
            }
        }
    },
    focusDropNear: {
        scalars : {
            chars: [' ','a', 'e', 'i', 'o', 'u', 'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z','0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', ']', '^', '_', '`', '{', '|', '}', '~'],
            capitalDistance: 0.001,
            unrecognizedDefault: 0
        },
        scoring : {
            multiplier : {
                initial: 1,
                reducer: 1.5,
                reductionDelimeter: "",
                resetReducer: 2,
                resetDelimeter: " "
            },
            l2: {
                sqrt: false
            }
        }
    }
}

export class Vector extends Array<number> {
    constructor(elements?:Array<number>|number){
        if (Array.isArray(elements)){
            if (elements.length === 1){
                super(); 
                this.push(elements[0]); 
            } else super(...elements); 
        }
        else if (Number.isInteger(elements) && elements) {
            super(elements); 
        }
        else {
            super(); 
        }
    }

    static normalizeMut(vector1:Vector, vector2:Vector){
        const mutVector = (vector1.length > vector2.length) ? vector2 : vector1; 
        const initLen = mutVector.length;
        const lenAdd = Math.abs(vector1.length - vector2.length);
        mutVector.length = mutVector.length + lenAdd; 
        mutVector.fill(0, initLen, mutVector.length); 
    }

    static normalize(vector1:Vector, vector2:Vector){
        const [v1,v2] = [[...vector1], [...vector2]];
        const mutVector = (v1.length > v2.length) ? v2 : v1; 
        const initLen = mutVector.length;
        const lenAdd = Math.abs(v1.length - v2.length);
        mutVector.length = mutVector.length + lenAdd; 
        mutVector.fill(0, initLen, mutVector.length);

        return [new Vector(v1), new Vector(v2)]; 
    }
}

export class VString extends String {
    vector:Vector; 
    distance:number; 
    score:number;
    constructor({value, vector, distance}:{value:string, vector:Vector, distance:number}){
        super(value);
        this.vector = vector;
        this.distance = distance; 
        this.score = Fuzzinator.bound(distance); 
    }

}

export class Fuzzinator {
    private config:FuzzyConfig = defaultFuzzyConfig; 
    private scalars:{[key:string]:number} = {}; 

    constructor(configuration:FuzzyConfigArgument=defaultFuzzyConfig){
        this.configure(configuration); 
        this.computeScalars(); 
    }

    private configure(configuration:FuzzyConfigArgument){
        for (const _key in configuration){
            for (const key in configuration[_key]){
                if (key === "capitalDistance") {
                    const capdist = configuration[_key][key];
                    if (capdist >= 1 || capdist < 0){
                        throw new RangeError('"capitalDistance" configuration value must be inbetween 0 and 1'); 
                    }
                }
                this.config[_key][key] = configuration[_key][key];
            }
        }
    }

    private computeScalars() {
        const scalars: { [key: string]: number } = {};
        const chars = this.config.scalars.chars;
        for (const i in chars) {
            const sval = parseInt(i) + 1;
            scalars[chars[i]] = sval;
            const upper = chars[i].toUpperCase();
            if (chars.includes(upper)) continue; 
            if (upper !== chars[i]) scalars[chars[i].toUpperCase()] = sval + this.config.scalars.capitalDistance;
        }
        this.scalars = scalars; 
    }

    setScalars(scalars:{[key:string]:number}){
        this.scalars = scalars; 
    }

    computeVector(str: string){
        const vector = new Vector();
        const chars = str.split(""); // delimeter
        const {resetDelimeter, reducer, reductionDelimeter, resetReducer, initial} = this.config.scoring.multiplier; 
        let multiplier = initial;
        let resetMultiplier = initial; 

        for (const char of chars) {
            if (resetDelimeter && char === resetDelimeter){
                resetMultiplier /= resetReducer; 
                multiplier = resetMultiplier
            }
            let score = 0;
            if (!(char in this.scalars)) score = this.config.scalars.unrecognizedDefault;
            else score = (this.scalars[char] * multiplier);
            vector.push(score * multiplier);
            if (typeof this.config.scoring.multiplier.reductionDelimeter === "string"){
                if (char === reductionDelimeter || reductionDelimeter === ""){
                    multiplier /= reducer; 
                }
            }
        }
        return vector;
    }

    computeVectors(strings:Array<string>){
        return strings.map(str => this.computeVector(str));
    }

    computeDistance(vector1:Vector|string, vector2:Vector|string) {
        if (typeof vector1 === "string"){
            vector1 = this.computeVector(vector1); 
        }
        if (typeof vector2 === "string"){
            vector2 = this.computeVector(vector2); 
        }

        const [v1, v2] = Vector.normalize(vector1, vector2); 
        
        if (this.config.scoring.formula === "l2"){
            let distance = 0; 
            for (const i in v1){
                distance += (v1[i] - v2[i]) ** 2; 
            }
            return distance; 
        }
        else if (this.config.scoring.formula === "l1"){
            let distance = 0; 
            for (const i in v1){
                distance += Math.abs(v1[i] - v2[i]); 
            }
            return distance;
        }
        else {
            throw new Error('Formula must be either "l1" or "l2" not '+this.config.scoring.formula)
        }
    }

    rank({root,space,threshold,sort=true}:SearchParams) : Array<VString> {
        const rootVector = this.computeVector(root); 
        const spaceVectors = this.computeVectors(space);

        const distances = spaceVectors.map(vector => this.computeDistance(rootVector, vector));

        let vstrings = distances.map((distance, index) => new VString({
            value: space[index],
            vector: spaceVectors[index],
            distance
        }));

        if (threshold) vstrings = vstrings.filter(vstr => vstr.distance <= threshold);
        if (sort) vstrings = vstrings.sort((a,b) => a.distance - b.distance);
        
        return vstrings; 
    }

    static bound(distance:number, scaler:number=10){
        return 1 / (1 + (distance/scaler)); 
    }
}

export default Fuzzinator; 
