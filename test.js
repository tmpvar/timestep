var Timestep = require('./timestep')
var test = require('tape');

test('Timestep#val add values to an array', function(t) {
  var ts = new Timestep();
  ts.val('something', []);
  ts.val('something/', 'a');
  t.equal(ts.store.something[0], 'a');

  t.end();
});

test('Timestep#val updates values in an array', function(t) {
  var ts = new Timestep();
  ts.val('something', []);
  ts.val('something/', 'a');
  ts.val('something/0', 'b');
  t.equal(ts.store.something[0], 'b');

  t.end();
});

test('Timestep#val updates object properties', function(t) {
  var ts = new Timestep();
  ts.val('something', []);
  ts.val('something/', 'a');
  ts.val('something', { test: true });
  t.equal(ts.store.something.test, true);

  t.end();
});

test('Timestep#val acts like a getter', function(t) {
  var ts = new Timestep();
  ts.val('something', []);
  ts.val('something/', 'a');

  t.equal(ts.val('something/0'), 'a');

  t.end();
});

test('Timestep#rewind rewinds .store by passed steps', function(t) {
  var ts = new Timestep();
  ts.val('something', []);
  ts.val('something/', 'a');
  ts.val('something/', 'b');
  ts.rewind(1);
  t.ok(!ts.store.something[1]);
  t.ok(ts.store.something[0]);

  t.end();
});

test('Timestep#rewind rewinds .store completely', function(t) {
  var ts = new Timestep();
  ts.val('something', []);
  ts.val('something/', 'a');
  ts.val('something/', 'b');
  ts.rewind();
  t.ok(!Object.keys(ts.store).length);

  t.end();
});

test('Timestep#rewind aborts when out of range', function(t) {
  var ts = new Timestep();
  ts.val('root', {});
  ts.rewind(10);
  t.equal(ts.index, -1);
  t.ok(!ts.store.root);
  ts.forward(1);
  t.ok(ts.store.root);

  t.end();
});

test('Timestep#rewind applies the inverse', function(t) {
  var ts = new Timestep();

  ts.val('test', 1);
  ts.val('test', 2);
  ts.op('-', 'test');

  var _op = ts.op;
  var ops = [
    function(type, path, value, store) {
      t.equal(type, '+');
      t.equal(path, 'test');
      t.equal(value, 2);
      t.equal(store, false);
      _op.call(ts, type, path, value, store);
    },
    function(type, path, value, store) {
      t.equal(type, '+');
      t.equal(path, 'test');
      t.equal(value, 1);
      t.equal(store, false);
      _op.call(ts, type, path, value, store);
    },
    function(type, path, value, store) {
      t.equal(type, '-');
      t.equal(path, 'test');
      t.equal(value, null);
      t.equal(store, false);
      _op.call(ts, type, path, value, store);
    }
  ];

  while(ops.length) {
    var op = ops.shift();
    ts.op = op;
    ts.rewind(1);
  }

  t.end();
});

test('Timestep#forward moves index forward # of steps', function(t) {
  var ts = new Timestep();
  ts.val('things', []);
  ts.val('things/', 'cucumber');
  ts.val('things/', 'tomato');
  ts.val('things/', 'onion');

  ts.rewind();
  ts.forward(1);
  t.equal(ts.store.things.length, 0)
  ts.forward(1);
  t.equal(ts.store.things.length, 1)
  ts.forward(1);
  t.equal(ts.store.things.length, 2)

  t.end();
});

test('Timestep#forward jumps to the end', function(t) {
  var ts = new Timestep();
  ts.val('things', []);
  ts.val('things/', 'cucumber');
  ts.val('things/', 'tomato');
  ts.val('things/', 'onion');
  var orig = ts.store.things.concat();
  ts.rewind();
  ts.forward();
  t.deepEqual(orig, ts.store.things);

  t.end();
});

test('adds an addition operation (+)', function(t) {
  var ts = new Timestep();

  ts.op('+', 'monkey', 'value');
  t.deepEqual(ts.ops[0], [
    Date.now(),
    'monkey',
    '+',
    'value',
    null
  ])

  t.equal(ts.ops.length, 1);

  t.end();
});

test('Timestep#op adds a deletion operation (-)', function(t) {
  var ts = new Timestep();

  ts.op('+', 'monkey', 'value');
  ts.op('-', 'monkey');
  t.deepEqual(ts.ops[1], [
    Date.now(),
    'monkey',
    '-',
    undefined,
    'value'
  ]);

  t.equal(ts.ops.length, 2);

  t.end();
});

test('Timestep#op adds an update operation (~)', function(t) {
  var ts = new Timestep();

  ts.op('+', 'monkey', 'value');
  ts.op('~', 'monkey', 'new-value');
  t.deepEqual(ts.ops[1], [
    Date.now(),
    'monkey',
    '~',
    'new-value',
    'value'
  ]);

  t.equal(ts.ops.length, 2);

  t.end();
});

test('Timestep#op applies without storing when store=false', function(t) {
  var ts = new Timestep();

  ts.op('+', 'monkey', 'value');
  ts.op('~', 'monkey', 'new-value', false);
  t.ok(!ts.ops[1])
  t.equal(ts.ops.length, 1);

  t.end();
});

test('Timestep#path splits the passed path', function(t) {
  var ts = new Timestep();
  t.deepEqual([ts.store, 'testing'], ts.path('testing'));

  t.end();
});

test('Timestep#path returns `undefined` if path does not exist', function(t) {
  var ts = new Timestep();
  t.ok(typeof ts.path('monkey/test') === 'undefined');

  t.end();
});

test('Timestep#path removes the specified path', function(t) {
  var ts = new Timestep();
  ts.val('parent', {});
  ts.val('parent/child', {});
  ts.val('parent/child/grandchild', {});
  ts.val('parent/child/grandchild/another', {});

  t.ok(ts.store.parent.child.grandchild.another);

  ts.del('parent/child/grandchild/another');
  t.ok(!ts.store.parent.child.grandchild.another);
  t.ok(ts.store.parent.child.grandchild);

  ts.del('parent/child');
  t.ok(!ts.store.parent.child);
  t.ok(ts.store.parent);

  t.end();
});

test('Timestep#change registers a new listener (no path)', function(t) {
  var ts = new Timestep();
  var fn = function(t) {};
  ts.change(fn);
  t.ok(ts.listeners[0] === fn);

  t.end();
});

test('registers a new listener (path)', function(t) {
  var ts = new Timestep();
  var fn = function(t) {};
  ts.change(fn);
  t.equal(ts.listeners[0], fn);

  t.end();
});

test('Timestep#ignore removes a listener', function(t) {
  var ts = new Timestep();
  var fn = function(t) {};
  ts.change(fn);
  ts.change(function(t) {});
  t.equal(ts.listeners.length, 2);

  ts.ignore(fn);
  t.equal(ts.listeners.length, 1);

  t.end();
});

test('Timestep#ignore removes all listeners if no fn is passed', function(t) {
  var ts = new Timestep();
  var fn = function(t) {};
  ts.change(fn);
  ts.change(function(t){});
  ts.ignore();
  t.ok(!ts.listeners.length);

  t.end();
});

test('Timestep#notify calls listeners', function(t) {
  var ts = new Timestep();
  var called = 0;
  ts.change(function(op) {
    t.equal(op.length, 5)
    called++;

  });
  ts.notify([1,2,3,4,5]);
  t.equal(called, 1);

  t.end();
});

test('notifies listeners when changed', function(t) {
  var ts = new Timestep({ val : 1 });
  ts.change(function(op) {

    t.deepEqual(op, [
      Date.now(),
      'val',
      '~',
      2,
      1
    ]);

  });

  ts.val('val', 2);

  t.end();
});


  // Consider:
  // - sync listener mutations with parent object 'ops'
  // - nested Timestep objects


test('uses a passed object as store', function(t) {
  var ts = new Timestep({ some : 'value' });
  t.equal('value', ts.store.some);

  t.end();
});

test('drops future when rewound and changed', function(t) {

  var ts = new Timestep();
  ts.val('array', []);
  ts.val('array/', 1);
  ts.val('array/', 2);
  ts.val('array/', 3);

  t.ok(ts.store.array.join(',') === '1,2,3');

  ts.rewind(1);

  t.equal(ts.index, ts.ops.length-2);
  t.ok(ts.store.array.join(',') === '1,2');

  ts.val('array/', 'a');
  t.ok(ts.store.array.join(',') === '1,2,a');
  t.equal(ts.index, ts.ops.length-1);

  t.end();
});
