# timestep

A datastore with undo/redo support

## install

```npm install timestep```

Use browserify if you want to use this in the browser

## use

```javascript

var Timestep = require('timestep');

var ts = new Timestep({ initial: 'data' });

ts.change(function(op) {
  // called whenever there is a change
  // op format: [timestamp, path, operator, value, oldvalue]
});

// change a value
ts.val('initial', 'data data');

// add a value
ts.val('another', 'test');

// delete a value
ts.del('another');

// now the interesting stuff

console.log(ts.val('another')) // undefined

ts.rewind(1); // rewind one step

console.log(ts.val('another')) // test


```

see test.js for more examples of use

## license

MIT
