# Fuzzinator

Fuzzinator is a fuzzy search package that uses vectors in order to score searches.
It is highly tuneable.

## Tuning (configuration)
### Scalars
* chars
    - This is a list of characters that are recognized and will have a unique scalar value.
    - The closer two letters are in the array, the closer their scalar values will be together. 
    - Capitals do not need to be included in this list, and including them will give them a unique scalar value at least 1 away their lower case equivalent. 
* capitalDistance
    - The difference in scalar value capital letters (that are not included in the chars list) will have compared to their lower case equivalents. Between 0 and 1 (exclusive)
* unrecognizableDefault
    - the scalar value for characters that are unrecognizable (not in char list)
### Scoring
* Multiplier
    - initial
        - The initial multiplier value applied to each component of the vector. Typically starts at 1
    - reducer
        - The amount to divide the multiplier by each subsequent value added to the vector
    - reductionDelimeter
        - The character that triggers a reduction in the multiplier (empty string "" means multiplier is reduced after each character)
    - resetReducer
        - The amount to divide the inital multiplier by when it is restored
    - resetDelimeter
        - The character that triggers the multiplier to be reset
* Formula
    - The formula for computing distance. Either "l1" or "l2"
        - "l1" is the Manhattan formula
        - "l2" is the Squared Euclidian formula 

## Usage
### Fuzzinator Class
To get started, create a new instance of the Fuzzinator class. To tune the fuzzinator, pass a configuration object during instantiation. 

Fuzzinator instances have a method `rank` attached to them. This method takes a "root" value (string), and a "space" value (string[]). The root value is compared to all of the values in the space. It returns an array of `VString` objects, which is an extension of the string class, which extra fields `distance`, `vector`, and `score` attached to them. The `score` field is a value ranging from 0 to 1, with 1 representing an identical match. 

The `rank` method can also take a distance threshold. This is the minimum distance a string must be from the root string.
#### Rank  
```typescript
import Fuzzinator from "fuzzinator";

const fz = new Fuzzinator({
    scalars : {
        chars: [' ','a','e','i','o','u','b','c','d','e', ...],
        capitalDistance: .001,
    },
    scoring : {
        multiplier : {
            initial : 1,
            reducer : 1.2,
            reductionDelimeter: ""
            resetDelimeter: " ",
            resetReducer: 1.1,
        },
        formula: "l2"
    }
});

const root = "Hello World"; 
const space = [
    "hello world",
    "HELLO WORLD",
    "Photos printed?",
    "Bogos binted"
];

const rankings = fz.rank({
    root,
    space
});

const filteredRankings = fz.rank({
    root,
    space,
    threshold: 10
})
```

#### Other Methods
##### computeVector
The `computeVector` method can be used to get the raw `Vector` for a string. 
```typescript
import Fuzzinator, {Vector} from "fuzzinator"; 

const fz = new Fuzzinator(); 

const myVector:Vector = fz.computeVector("George Goosington");
```

##### computeDistance
The `computeDistance` method can be used to calculate the distance between two `Vectors` or strings. 

```typescript
import Fuzzinator, {Vector} from "fuzzinator"; 

const fz = new Fuzzinator(); 

const v1:Vector = fz.computeVector("George Goosington");
const v2:Vector = fz.computeVector("Thomas Skunkerson");

const distance:number = fz.computeDistance(v1, v2); 
```
