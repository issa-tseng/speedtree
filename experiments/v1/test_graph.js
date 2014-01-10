(function() {
  var LiveTree, Node, OrbitStrategy, OriginStrategy, PlacementStrategy, RectilinearStrategy, addChildren, currentStrategy, d3, data, dragDoc, g, isEven, lastPosition, origin, strategies, svg, tree, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  isEven = function(x) {
    return x % 2 === 0;
  };

  LiveTree = (function() {
    function LiveTree(d3doc) {
      this.d3doc = d3doc;
      this.root = new Node(this, null, {
        id: -1,
        outer: '{root}'
      });
      this.nodes = {
        root: this.root
      };
      this.strategy = OriginStrategy;
      this.select(this.root);
    }

    LiveTree.prototype.root = function() {
      return this.root;
    };

    LiveTree.prototype.find = function(id) {
      var _ref;
      return (_ref = this.nodes[id]) != null ? _ref : null;
    };

    LiveTree.prototype.select = function(node) {
      /*
      if this.selection? and node.depth > this.selection.depth
        cursor = node
        (cursor = cursor.parent) while cursor? and cursor isnt this.selection
      */

      this._unselect();
      node.flagParents('selectedParent', true);
      node.flag('selected', true);
      node.flagChildren('selectedChild', true);
      this.selection = node;
      return this._draw();
    };

    LiveTree.prototype._unselect = function() {
      if (this.selection != null) {
        this.selection.flagParents('selectedParent', false);
        this.selection.flag('selected', false);
        this.selection.flagChildren('selectedChild', false);
      }
      return null;
    };

    LiveTree.prototype.setStrategy = function(strategy) {
      this.strategy = strategy;
      return this._draw();
    };

    LiveTree.prototype.links = function() {
      return this.root.links();
    };

    LiveTree.prototype._draw = function() {
      var _this = this;
      if (this._draw$ == null) {
        this._draw$ = _.debounce((function() {
          return _this.__draw();
        }), 0);
      }
      return this._draw$();
    };

    LiveTree.prototype.__draw = function() {
      var allNodes, links, newNodes, selection, strategy, v, _,
        _this = this;
      strategy = new this.strategy(this);
      links = this.links();
      selection = this.d3doc.selectAll('.link').data(links, function(d) {
        return "" + d.a.id + "-" + d.b.id;
      });
      selection.enter().append('line').attr('class', 'link');
      selection.attr('class', function(_arg) {
        var active, flag, node;
        node = _arg.b;
        return ['link'].concat((function() {
          var _ref, _results;
          _ref = node.flags;
          _results = [];
          for (flag in _ref) {
            active = _ref[flag];
            if (active === true && flag !== 'node') {
              _results.push(flag);
            }
          }
          return _results;
        })()).join(' ');
      });
      selection.transition().duration(600).delay(function(_arg) {
        var node;
        node = _arg.b;
        return node.depth * 60 + node.index() * 40;
      }).attr('x1', function(d) {
        return strategy.place(d.a).x;
      }).attr('y1', function(d) {
        return strategy.place(d.a).y;
      }).attr('x2', function(d) {
        return strategy.place(d.b).x;
      }).attr('y2', function(d) {
        return strategy.place(d.b).y;
      }).style('opacity', function(_arg) {
        var node;
        node = _arg.b;
        return 1.0 / node.depth;
      });
      selection.exit().remove();
      allNodes = (function() {
        var _ref, _results;
        _ref = this.nodes;
        _results = [];
        for (_ in _ref) {
          v = _ref[_];
          _results.push(v);
        }
        return _results;
      }).call(this);
      selection = this.d3doc.selectAll('.node').data(allNodes);
      newNodes = selection.enter().append('g').attr('class', 'node');
      newNodes.append('circle').attr('r', 6).attr('cx', 0).attr('cy', 0).on('click', function(node) {
        return _this.select(node);
      }).on('mouseout', function(node) {
        return node.hover(false);
      }).on('mouseover', function(node) {
        return node.hover(true);
      });
      newNodes.append('text');
      selection.attr('class', function(node) {
        var active, flag;
        return ((function() {
          var _ref, _results;
          _ref = node.flags;
          _results = [];
          for (flag in _ref) {
            active = _ref[flag];
            if (active === true) {
              _results.push(flag);
            }
          }
          return _results;
        })()).join(' ');
      });
      selection.selectAll('text').text(function(node) {
        return node.outer;
      }).attr('x', 11).attr('y', 3);
      selection.transition().duration(600).delay(function(node) {
        return node.depth * 60 + node.index() * 40;
      }).attr('transform', function(node) {
        return "translate(" + (strategy.place(node).x) + ", " + (strategy.place(node).y) + ")";
      }).selectAll('text').attr('transform', function(node) {
        return strategy.transformText(node);
      });
      return selection.exit().remove();
    };

    return LiveTree;

  })();

  Node = (function() {
    function Node(tree, parent, _arg) {
      var _ref, _ref1;
      this.tree = tree;
      this.parent = parent;
      this.id = _arg.id, this.outer = _arg.outer, this.inner = _arg.inner, this.type = _arg.type;
      this.children = {};
      this.sortedChildren = [];
      this.flags = {
        node: true
      };
      this.depth = ((_ref = (_ref1 = this.parent) != null ? _ref1.depth : void 0) != null ? _ref : -1) + 1;
      this.isRoot = this.depth === 0;
    }

    Node.prototype.add = function(data) {
      var node, v, _;
      node = new Node(this.tree, this, data);
      this.tree.nodes[node.id] = node;
      this.children[node.id] = node;
      this.sortedChildren = (function() {
        var _ref, _results;
        _ref = this.children;
        _results = [];
        for (_ in _ref) {
          v = _ref[_];
          _results.push(v);
        }
        return _results;
      }).call(this);
      this.sortedChildren.sort(function(a, b) {
        return a.outer.localeCompare(b.outer);
      });
      if (this.flags.selected === true) {
        node.flag('selectedChild', true);
      }
      this.tree._draw();
      return node;
    };

    Node.prototype.remove = function() {
      delete this.tree.nodes[this.id];
      delete this.parent.children[this.id];
      this.tree._draw();
      return null;
    };

    Node.prototype.index = function() {
      if (this.parent != null) {
        return this.parent.sortedChildren.indexOf(this) + 1;
      } else {
        return 0;
      }
    };

    Node.prototype.flag = function(name, active) {
      return this.flags[name] = active === true;
    };

    Node.prototype.flagParents = function(name, active) {
      var parent, _i, _len, _ref, _results;
      _ref = this.parents();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        parent = _ref[_i];
        _results.push(parent.flag(name, active));
      }
      return _results;
    };

    Node.prototype.flagChildren = function(name, active) {
      var child, _, _ref, _results;
      _ref = this.children;
      _results = [];
      for (_ in _ref) {
        child = _ref[_];
        _results.push(child.flag(name, active));
      }
      return _results;
    };

    Node.prototype.previous = function() {
      var _ref, _ref1;
      return (_ref = (_ref1 = this.parent) != null ? _ref1.sortedChildren[this.index() - 2] : void 0) != null ? _ref : null;
    };

    Node.prototype.next = function() {
      var _ref, _ref1;
      return (_ref = (_ref1 = this.parent) != null ? _ref1.sortedChildren[this.index()] : void 0) != null ? _ref : null;
    };

    Node.prototype.hover = function(active) {
      this.flag('hovered', active);
      this.flagParents('hoveredParent', active);
      this.tree._draw();
      return null;
    };

    Node.prototype.parents = function() {
      var cursor, _results;
      cursor = this;
      _results = [];
      while (cursor.parent != null) {
        _results.push(cursor = cursor.parent);
      }
      return _results;
    };

    Node.prototype.links = function() {
      var child, i, result, _, _i, _ref;
      result = [];
      if (this.sortedChildren.length > 0) {
        result.push({
          a: this,
          b: this.sortedChildren[0]
        });
      }
      if (this.sortedChildren.length > 1) {
        for (i = _i = 0, _ref = this.sortedChildren.length - 1; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          result.push({
            a: this.sortedChildren[i],
            b: this.sortedChildren[i + 1]
          });
        }
      }
      return result.concat.apply(result, (function() {
        var _ref1, _results;
        _ref1 = this.children;
        _results = [];
        for (_ in _ref1) {
          child = _ref1[_];
          _results.push(child.links());
        }
        return _results;
      }).call(this));
    };

    return Node;

  })();

  PlacementStrategy = (function() {
    function PlacementStrategy(tree) {
      this.tree = tree;
      this._place$ = {};
      if (typeof this._initialize === "function") {
        this._initialize();
      }
    }

    PlacementStrategy.prototype.place = function(node) {
      var _base, _name;
      return (_base = this._place$)[_name = node.id] != null ? (_base = this._place$)[_name = node.id] : _base[_name] = this._place(node);
    };

    PlacementStrategy.prototype._place = function(node) {};

    PlacementStrategy.prototype.transformText = function(node) {
      return '';
    };

    return PlacementStrategy;

  })();

  OriginStrategy = (function(_super) {
    __extends(OriginStrategy, _super);

    function OriginStrategy() {
      _ref = OriginStrategy.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    OriginStrategy.prototype._place = function() {
      return {
        x: 0,
        y: 0
      };
    };

    return OriginStrategy;

  })(PlacementStrategy);

  RectilinearStrategy = (function(_super) {
    __extends(RectilinearStrategy, _super);

    function RectilinearStrategy() {
      _ref1 = RectilinearStrategy.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    RectilinearStrategy.prototype.__maxLength = 700;

    RectilinearStrategy.prototype.__normDist = 95;

    RectilinearStrategy.prototype.__minDist = 20;

    RectilinearStrategy.prototype._place = function(node) {
      var base, dist, index, length, normDist;
      if (node.isRoot) {
        return {
          x: 0,
          y: 0
        };
      } else {
        length = node.parent.sortedChildren.length;
        normDist = Math.max(this.__normDist - (node.depth * 8), this.__minDist);
        dist = (length * normDist) <= this.__maxLength ? normDist : (length * this.__minDist) <= this.__maxLength ? this.__maxLength / length : this.__minDist;
        base = this.place(node.parent);
        index = node.index();
        if (node.depth === 1) {
          return {
            x: base.x,
            y: base.y + index * dist
          };
        } else if (isEven(node.depth)) {
          dist /= 1.4142135623730951;
          if (isEven(node.parent.index())) {
            return {
              x: base.x + index * dist,
              y: base.y + index * dist
            };
          } else {
            return {
              x: base.x - index * dist,
              y: base.y + index * dist
            };
          }
        } else {
          if (base.x < 0) {
            return {
              x: base.x - index * dist,
              y: base.y
            };
          } else {
            return {
              x: base.x + index * dist,
              y: base.y
            };
          }
        }
      }
    };

    RectilinearStrategy.prototype.transformText = function(node) {
      var ops;
      ops = [];
      if (node.depth < 2) {

      } else {
        if (isEven(node.depth)) {
          if (isEven(node.parent.index())) {
            ops.push('rotate(-45)');
          } else {
            ops.push('rotate(45)');
          }
        } else {
          ops.push('rotate(-45)');
        }
      }
      return ops.join(' ');
    };

    return RectilinearStrategy;

  })(PlacementStrategy);

  OrbitStrategy = (function(_super) {
    __extends(OrbitStrategy, _super);

    function OrbitStrategy() {
      _ref2 = OrbitStrategy.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    OrbitStrategy.prototype.__maxAngle = 65;

    OrbitStrategy.prototype.__baseRadius = 200;

    OrbitStrategy.prototype._initialize = function() {
      return this._angleFor$ = {};
    };

    OrbitStrategy.prototype._angleFor = function(node) {
      var incrAngle, siblingCount, _base, _name;
      return (_base = this._angleFor$)[_name = node.id] != null ? (_base = this._angleFor$)[_name = node.id] : _base[_name] = node.isRoot ? 180 : (incrAngle = Math.min(this.__maxAngle, 360.0 / node.parent.sortedChildren.length), siblingCount = node.parent.sortedChildren.length, this._angleFor(node.parent) + incrAngle * (node.index() - 1) - (incrAngle * (siblingCount - 1.0) / 2.0));
    };

    OrbitStrategy.prototype._place = function(node) {
      var angle, base, radius;
      if (node.isRoot) {
        return {
          x: 0,
          y: 0
        };
      } else {
        base = this.place(node.parent);
        angle = this._angleFor(node) * Math.PI / 180;
        radius = this.__baseRadius / node.depth;
        return {
          x: base.x + Math.sin(angle) * radius,
          y: base.y - Math.cos(angle) * radius
        };
      }
    };

    OrbitStrategy.prototype.transformText = function(node) {
      return "rotate(" + (this._angleFor(node) - 90) + ")";
    };

    return OrbitStrategy;

  })(PlacementStrategy);

  data = {
    application: {
      inner: 'SocrataApp',
      type: 'model',
      children: {
        stores: {
          inner: 'Library',
          type: 'klass',
          children: {
            application: {
              inner: 'SocrataApp',
              type: 'model'
            }
          }
        },
        views: {
          inner: 'Library',
          type: 'class'
        },
        current_user: {
          inner: 'User',
          type: 'model',
          children: {
            login: {
              inner: 'cxlt',
              type: 'string'
            },
            followers: {
              inner: '35',
              type: 'number'
            },
            email: {
              inner: 'clint@dontexplain.com',
              type: 'string'
            },
            authenticated: {
              inner: 'true',
              type: 'boolean'
            },
            random_nest: {
              inner: 'Nest',
              type: 'model',
              children: {
                application: {
                  inner: 'SocrataApp',
                  type: 'model',
                  children: {
                    stores: {
                      inner: 'Library',
                      type: 'klass'
                    },
                    views: {
                      inner: 'Library',
                      type: 'klass'
                    },
                    current_user: {
                      inner: 'User',
                      type: 'model',
                      children: {
                        login: {
                          inner: 'cxlt',
                          type: 'string'
                        },
                        followers: {
                          inner: '35',
                          type: 'number'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    currentPage: {
      inner: 'GoalPage',
      type: 'model',
      children: {
        goal: {
          inner: 'Goal',
          type: 'model'
        }
      }
    }
  };

  d3 = this.d3;

  svg = d3.select('.graph').append('svg');

  origin = {
    x: 600,
    y: 20
  };

  lastPosition = {};

  g = svg.append('g').attr('class', 'tree').attr('transform', "translate(" + origin.x + ", " + origin.y + ")");

  dragDoc = d3.behavior.drag().origin(function() {
    return origin;
  }).on('drag', function() {
    lastPosition.x = d3.event.x;
    lastPosition.y = d3.event.y;
    return g.attr('transform', "translate(" + d3.event.x + ", " + d3.event.y + ")");
  }).on('dragend', function() {
    if (lastPosition.x != null) {
      return origin = lastPosition;
    }
  });

  svg.call(dragDoc);

  tree = new LiveTree(g);

  addChildren = function(children, to) {
    var datum, name, node, _results;
    _results = [];
    for (name in children) {
      datum = children[name];
      if (datum.id == null) {
        datum.id = _.uniqueId();
      }
      datum.outer = name;
      node = to.add(datum);
      if (datum.children != null) {
        addChildren(datum.children, node);
      }
      _results.push(null);
    }
    return _results;
  };

  addChildren(data, tree.root);

  strategies = [RectilinearStrategy, OrbitStrategy];

  currentStrategy = 0;

  window.setTimeout((function() {
    return tree.setStrategy(strategies[currentStrategy]);
  }), 10);

  $('body').on('keydown', function(event) {
    var candidate;
    candidate = event.which === 37 ? tree.selection.previous() : event.which === 38 ? tree.selection.parent : event.which === 39 ? tree.selection.next() : event.which === 40 ? tree.selection.sortedChildren[0] : void 0;
    if (candidate != null) {
      return tree.select(candidate);
    }
  });

  $('body').on('keydown', function(event) {
    if (event.which === 13) {
      return tree.setStrategy(strategies[++currentStrategy % strategies.length]);
    }
  });

}).call(this);

/*
//@ sourceMappingURL=test_graph.js.map
*/