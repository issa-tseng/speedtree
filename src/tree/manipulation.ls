# manipulation.ls -- functions for returning modified versions of trees.

{ compact, map } = require('prelude-ls').Obj

# node manipulation:
with-data = (data, node) --> node with data: data
with-child = (child, node) --> node with children: node.children with ((child.id): child)
with-children = (children, node) --> node with children: node.children with children
without-child = (child, node) --> node with children: compact(node.children with ((child.id): null))

# tree manipulation:
with-node = (node, root) -->
  | node is root => root
  | otherwise    => with-node(with-child(node, node.parent), root)

map-all = (f, node) --> f(node) with children: map(f >> map-all(f), node.children)
map-children = (f, node) --> node with children: map(f, node.children)
map-parents = (f, node) -->
  | !node.parent? => node
  | otherwise     => node with parent: map-parents(f, f(node.parent))

# export.
module.exports =
  node: { with-data, with-child, with-children, without-child }
  tree: { with-node, map-all, map-children, map-parents }

