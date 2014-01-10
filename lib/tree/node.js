(function(){
  var Node;
  Node = (function(){
    Node.displayName = 'Node';
    var prototype = Node.prototype, constructor = Node;
    function Node(arg$){
      var ref$, ref1$;
      ref$ = arg$ != null
        ? arg$
        : {}, this.id = ref$.id, this.parent = ref$.parent, this.children = (ref1$ = ref$.children) != null
        ? ref1$
        : {}, this.data = ref$.data;
    }
    return Node;
  }());
  module.exports = Node;
}).call(this);
