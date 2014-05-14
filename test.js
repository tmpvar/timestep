var assert = require('assert');
var Timestep = require('./timestep')

describe('Timestep', function() {
  describe('#val', function() {
    it('add values to an array', function() {
      var ts = new Timestep();
      ts.val('something', []);
      ts.val('something/', 'a');
      assert.strictEqual(ts.store.something[0], 'a');
    });

    it('updates values in an array', function() {
      var ts = new Timestep();
      ts.val('something', []);
      ts.val('something/', 'a');
      ts.val('something/0', 'b');
      assert.strictEqual(ts.store.something[0], 'b');
    });

    it('updates object properties', function() {
      var ts = new Timestep();
      ts.val('something', []);
      ts.val('something/', 'a');
      ts.val('something', { test: true});
      assert.strictEqual(ts.store.something.test, true);
    });

    it('acts like a getter', function() {
      var ts = new Timestep();
      ts.val('something', []);
      ts.val('something/', 'a');

      assert.strictEqual(ts.val('something/0'), 'a');
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

    it('rewinds .store completely', function() {
      var ts = new Timestep();
      ts.val('something', []);
      ts.val('something/', 'a');
      ts.val('something/', 'b');
      ts.rewind();
      assert.ok(!Object.keys(ts.store).length);
    });

    it('aborts when out of range', function() {
      var ts = new Timestep();
      ts.val('root', {});
      ts.rewind(10);
      assert.strictEqual(ts.index, -1);
      assert.ok(!ts.store.root);
      ts.forward(1);
      assert.ok(ts.store.root);
    });

    it('applies the inverse', function() {
      var ts = new Timestep();

      ts.val('test', 1);
      ts.val('test', 2);
      ts.op('-', 'test');

      var _op = ts.op;
      var ops = [
        function(type, path, value, store) {
          assert.strictEqual(type, '+');
          assert.strictEqual(path, 'test');
          assert.strictEqual(value, 2);
          assert.strictEqual(store, false);
          _op.call(ts, type, path, value, store);
        },
        function(type, path, value, store) {
          assert.strictEqual(type, '+');
          assert.strictEqual(path, 'test');
          assert.strictEqual(value, 1);
          assert.strictEqual(store, false);
          _op.call(ts, type, path, value, store);
        },
        function(type, path, value, store) {
          assert.strictEqual(type, '-');
          assert.strictEqual(path, 'test');
          assert.strictEqual(value, null);
          assert.strictEqual(store, false);
          _op.call(ts, type, path, value, store);
        }
      ];

      while(ops.length) {
        var op = ops.shift();
        ts.op = op;
        ts.rewind(1);
      }
    });
  });

  describe('#forward', function() {
    it('moves index forward # of steps', function() {
      var ts = new Timestep();
      ts.val('things', []);
      ts.val('things/', 'cucumber');
      ts.val('things/', 'tomato');
      ts.val('things/', 'onion');

      ts.rewind();
      ts.forward(1);
      assert.strictEqual(ts.store.things.length, 0)
      ts.forward(1);
      assert.strictEqual(ts.store.things.length, 1)
      ts.forward(1);
      assert.strictEqual(ts.store.things.length, 2)
    });

    it('jumps to the end', function() {
      var ts = new Timestep();
      ts.val('things', []);
      ts.val('things/', 'cucumber');
      ts.val('things/', 'tomato');
      ts.val('things/', 'onion');
      var orig = ts.store.things.concat();
      ts.rewind();
      ts.forward();
      assert.deepEqual(orig, ts.store.things);
    });
  });

  describe('#op', function() {
    it('adds an addition operation (+)', function() {
      var ts = new Timestep();

      ts.op('+', 'monkey', 'value');
      assert.deepEqual(ts.ops[0], [
        Date.now(),
        'monkey',
        '+',
        'value',
        null
      ])

      assert.strictEqual(ts.ops.length, 1);
    });

    it('adds a deletion operation (-)', function() {
      var ts = new Timestep();

      ts.op('+', 'monkey', 'value');
      ts.op('-', 'monkey');
      assert.deepEqual(ts.ops[1], [
        Date.now(),
        'monkey',
        '-',
        undefined,
        'value'
      ]);

      assert.strictEqual(ts.ops.length, 2);
    });

    it('adds an update operation (~)', function() {
      var ts = new Timestep();

      ts.op('+', 'monkey', 'value');
      ts.op('~', 'monkey', 'new-value');
      assert.deepEqual(ts.ops[1], [
        Date.now(),
        'monkey',
        '~',
        'new-value',
        'value'
      ]);

      assert.strictEqual(ts.ops.length, 2);
    });

    it('applies without storing when store=false', function() {
      var ts = new Timestep();

      ts.op('+', 'monkey', 'value');
      ts.op('~', 'monkey', 'new-value', false);
      assert.ok(!ts.ops[1])
      assert.strictEqual(ts.ops.length, 1);
    });
  });

  describe('#path', function() {
    it('splits the passed path', function() {
      var ts = new Timestep();
      assert.deepEqual([ts.store, 'testing'], ts.path('testing'));
    });

    it('returns `undefined` if path does not exist', function() {
      var ts = new Timestep();
      assert.ok(typeof ts.path('monkey/test') === 'undefined');
    });
  });

  describe('#del', function() {
    it('removes the specified path', function() {
      var ts = new Timestep();
      ts.val('parent', {});
      ts.val('parent/child', {});
      ts.val('parent/child/grandchild', {});
      ts.val('parent/child/grandchild/another', {});

      assert.ok(ts.store.parent.child.grandchild.another);

      ts.del('parent/child/grandchild/another');
      assert.ok(!ts.store.parent.child.grandchild.another);
      assert.ok(ts.store.parent.child.grandchild);

      ts.del('parent/child');
      assert.ok(!ts.store.parent.child);
      assert.ok(ts.store.parent);
    });
  });

  describe('behavior', function() {

    it('uses a passed object as store', function() {
      var ts = new Timestep({ some : 'value' });
      assert.strictEqual('value', ts.store.some);
    });

    it('drops future when rewound and changed', function() {

      var ts = new Timestep();
      ts.val('array', []);
      ts.val('array/', 1);
      ts.val('array/', 2);
      ts.val('array/', 3);

      assert.ok(ts.store.array.join(',') === '1,2,3');

      ts.rewind(1);

      assert.equal(ts.index, ts.ops.length-2);
      assert.ok(ts.store.array.join(',') === '1,2');

      ts.val('array/', 'a');
      assert.ok(ts.store.array.join(',') === '1,2,a');
      assert.equal(ts.index, ts.ops.length-1);

    });

  });
});
