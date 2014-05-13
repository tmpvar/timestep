var assert = require('assert');


var Timestep = require('./timestep')

// var ts = new Timestep();
// ts.op('+', 'something', []);

// ts.op('+', 'something/', 'a');
// ts.op('+', 'something/', 'b');
// ts.op('+', 'something/', 'c');
// ts.op('~', 'something/0', 'aa');

// console.log('first', ts.val('something'));

// ts.rewind(5);
// console.log('rewind(5)', ts.val('something'));

// ts.forward(5);
// console.log('forward(5)', ts.val('something'));

// ts.rewind(3);
// console.log('rewind(3)', ts.val('something'));

// ts.forward();
// console.log('forward()', ts.val('something'));

// ts.rewind()
// console.log('rewind()', ts.val('something'));

// ts.forward()
// console.log('forward()', ts.val('something'));

// console.log(ts);
// ts.rewind(1);
// ts.op('~', 'something/0', '0');
// console.log(ts.val('something'));
// console.log(ts);

describe('Timestep', function() {
  describe('#val', function() {
    it('add values to an array', function() {
      var ts = new Timestep();
      ts.val('something', []);
      ts.val('something/', 'a');
      assert.equal(ts.store.something[0], 'a');
    });

    it('updates values in an array', function() {
      var ts = new Timestep();
      ts.val('something', []);
      ts.val('something/', 'a');
      ts.val('something/0', 'b');
      assert.equal(ts.store.something[0], 'b');
    });

    it('updates object properties', function() {
      var ts = new Timestep();
      ts.val('something', []);
      ts.val('something/', 'a');
      ts.val('something', { test: true});
      assert.equal(ts.store.something.test, true);
    });
  });

  describe('#rewind', function() {
    it('rewinds .store by passed steps', function() {
      var ts = new Timestep();
      ts.val('something', []);
      ts.val('something/', 'a');
      ts.val('something/', 'b');
      ts.rewind(1);
      assert.ok(!ts.store.something[1]);
      assert.ok(ts.store.something[0]);
    });

    it('rewinds .store completely when no passed steps', function() {
      var ts = new Timestep();
      ts.val('something', []);
      ts.val('something/', 'a');
      ts.val('something/', 'b');
      ts.rewind();
      console.log(ts);
      assert.ok(!Object.keys(ts.store).length);
    });



  });

});
