# Animate Parameterization of the Möbius Strip

## Structure of the Code

I've split up the code into small ES modules:

```mathematica
mobius-pairviz/
  index.html
  package.json
  src/
    main.js        // scene, camera, controls, lights, GUI shells
    loop.js        // everything about loops: clicks, smoothing, random generation
    state.js       // shared app state (for later steps too)
```
