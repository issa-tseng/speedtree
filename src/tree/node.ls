# tree/node.ls -- dumb basic structy thing

class Node
  ({ @id, @parent, @children = {}, @data } = {}) ->

module.exports = Node

