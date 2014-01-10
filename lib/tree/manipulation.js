(function(){
  var ref$, compact, map, withData, withChild, withChildren, withoutChild, withNode, mapAll, mapChildren, mapParents;
  ref$ = require('prelude-ls').Obj, compact = ref$.compact, map = ref$.map;
  withData = curry$(function(data, node){
    var ref$;
    return ref$ = clone$(node), ref$.data = data, ref$;
  });
  withChild = curry$(function(child, node){
    var ref$, ref1$;
    return ref$ = clone$(node), ref$.children = import$(clone$(node.children), (ref1$ = {}, ref1$[child.id] = child, ref1$)), ref$;
  });
  withChildren = curry$(function(children, node){
    var ref$;
    return ref$ = clone$(node), ref$.children = import$(clone$(node.children), children), ref$;
  });
  withoutChild = curry$(function(child, node){
    var ref$, ref1$;
    return ref$ = clone$(node), ref$.children = compact(import$(clone$(node.children), (ref1$ = {}, ref1$[child.id] = null, ref1$))), ref$;
  });
  withNode = curry$(function(node, root){
    switch (false) {
    case node !== root:
      return root;
    default:
      return withNode(withChild(node, node.parent), root);
    }
  });
  mapAll = curry$(function(f, node){
    var ref$;
    return ref$ = clone$(f(node)), ref$.children = map(function(){
      return mapAll(f)(f.apply(this, arguments));
    }, node.children), ref$;
  });
  mapChildren = curry$(function(f, node){
    var ref$;
    return ref$ = clone$(node), ref$.children = map(f, node.children), ref$;
  });
  mapParents = curry$(function(f, node){
    var ref$;
    switch (false) {
    case node.parent != null:
      return node;
    default:
      return ref$ = clone$(node), ref$.parent = mapParents(f, f(node.parent)), ref$;
    }
  });
  module.exports = {
    node: {
      withData: withData,
      withChild: withChild,
      withChildren: withChildren,
      withoutChild: withoutChild
    },
    tree: {
      withNode: withNode,
      mapAll: mapAll,
      mapChildren: mapChildren,
      mapParents: mapParents
    }
  };
  function clone$(it){
    function fun(){} fun.prototype = it;
    return new fun;
  }
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
