function Timestep(initial) {
  if (!this.isTimestep) {
    return new Timestep(initial);
  }

  this.start = Date.now();
  this.ops = [];
  this.store = initial || {};
  this.index = -1;
  this.listeners = [];
}

Timestep.prototype.isTimestep = true;
Timestep.prototype.op = function(type, path, value, store) {
  var oldValue = null;
  var loc;
  if (Array.isArray(path)) {
    loc = path[0];
    path = path[1];
  } else {
    loc = this.path(path);
  }
  var time = Date.now();

  switch (type) {
    case '~':
      oldValue = loc[0][loc[1]];
    case '+':
      if (Array.isArray(loc[0])) {
        if (!loc[1].length) {
          loc[0].push(value);
        } else {
          var index = parseInt(loc[1]);
          if (!isNaN(index)) {
            loc[0].splice(index, 1, value);
          }
        }
      } else {
        loc[0][loc[1]] = value;
      }
    break;

    case '-':
      if (Array.isArray(loc[0])) {
        var index = parseInt(loc[1]);
        if (!isNaN(index)) {
          loc[0].splice(index, 1);
        } else {
          loc[0].pop();
        }
      } else {
        oldValue = loc[0][loc[1]];
        delete loc[0][loc[1]];
      }
    break;
  }

  if (store !== false) {
    if (this.index < this.ops.length - 1) {
      this.ops.splice(this.index+1, this.ops.length);
    }

    var op = [
      time,
      path,
      type,
      value,
      oldValue
    ];

    this.ops.push(op);

    this.notify(op)

    this.index++;
  }

  return this;
};

Timestep.prototype.rewind = function(steps) {
  if (!steps) {
    steps = this.index + 1;
  }

  for (var i = 0; i<steps; i++) {
    var c = this.ops[this.index];

    if (!c) {
      break;
    }

    switch (c[2]) {
      case '+':
        this.op('-', c[1], null, false);
      break;

      case '~':
      case '-':
        this.op('+', c[1], c[4], false);
      break;
    }

    this.index--;
  }
  return this;
}

Timestep.prototype.forward = function(steps) {
  if (!steps) {
    steps = (this.ops.length - this.index);
  }

  for (var i = 0; i<steps; i++) {
    if (!this.ops[this.index+1]) {
      break;
    }

    var c = this.ops[++this.index];

    this.op(c[2], c[1], c[3], false);
  }

  return this;
};

Timestep.prototype.path = function(path) {
  var parts = path.split('/');
  var c = this.store;

  while(parts.length-1) {
    var component = parts.shift();
    if (typeof c[component] !== 'undefined') {
      c = c[component];
    } else {
      return;
    }
  }

  parts.unshift(c);
  return parts;
};

Timestep.prototype.val = function(path, value) {
  var loc = this.path(path);
  var set = typeof value !== 'undefined';
  if (loc) {
    if (set) {
      var op = '+';
      if (typeof loc[0][loc[1]] !== 'undefined') {
        op = '~';
      }

      this.op(op, [loc, path], value);
    }

    return loc[0][loc[1]];
  } else if (set) {
    this.op('+', [loc, path], value);
  }
};

Timestep.prototype.change = function(fn) {
  if (typeof fn === 'function') {
    this.listeners.push(fn);
  }
  return this;
};

Timestep.prototype.ignore = function(fn) {

  if (fn) {
    var i = this.listeners.indexOf(fn);
    if (i>-1) {
      this.listeners.splice(i, 1);
    }
  } else {
    this.listeners = [];
  }

  return this;
};

Timestep.prototype.notify = function(op) {
  var l = this.listeners.length;
  if (l) {
    for (var i=0; i<l; i++) {
      this.listeners[i](op)
    }
  }
};

Timestep.prototype.del = function(path) {
  this.op('-', path);
  return this;
};

module.exports = Timestep;
