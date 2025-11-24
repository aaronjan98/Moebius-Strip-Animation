# Animate Parameterization of the Möbius Strip

- Try out the animation [here](https://aaronjan98.github.io/Moebius-Strip-Animation/)

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
    pair.js        // points on the loop
    lift.js        // animation + lifted point + trail
    band.js        // transparent Möbius surface mesh
```
