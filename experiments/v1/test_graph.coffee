isEven = (x) -> x % 2 is 0

class LiveTree
  constructor: (@d3doc) ->
    this.root = new Node(this, null, { id: -1, outer: '{root}' })

    this.nodes = { root: this.root }
    this.strategy = OriginStrategy

    this.select(this.root)

  root: -> this.root
  find: (id) -> this.nodes[id] ? null

  select: (node) ->
    ###
    if this.selection? and node.depth > this.selection.depth
      cursor = node
      (cursor = cursor.parent) while cursor? and cursor isnt this.selection
    ###

    this._unselect() # if !cursor?

    node.flagParents('selectedParent', true)
    node.flag('selected', true)
    node.flagChildren('selectedChild', true)

    this.selection = node
    this._draw()

  _unselect: ->
    if this.selection?
      this.selection.flagParents('selectedParent', false)
      this.selection.flag('selected', false)
      this.selection.flagChildren('selectedChild', false)
    null

  setStrategy: (strategy) ->
    this.strategy = strategy
    this._draw()

  links: -> this.root.links()

  _draw: ->
    this._draw$ ?= _.debounce((=> this.__draw()), 0)
    this._draw$()

  __draw: ->
    strategy = new this.strategy(this)

    # find links
    links = this.links()
    selection =
      this.d3doc.selectAll('.link').data(links, (d) -> "#{d.a.id}-#{d.b.id}")

    # add links
    selection
      .enter().append('line')
        .attr('class', 'link')

    # update link properties
    selection
      .attr('class', ( b: node ) -> [ 'link' ].concat(flag for flag, active of node.flags when active is true and flag isnt 'node').join(' '))

    # update link positions
    selection
      .transition()
        .duration(600)
        .delay(( b: node ) -> node.depth * 60 + node.index() * 40)
        .attr('x1', (d) -> strategy.place(d.a).x)
        .attr('y1', (d) -> strategy.place(d.a).y)
        .attr('x2', (d) -> strategy.place(d.b).x)
        .attr('y2', (d) -> strategy.place(d.b).y)
        .style('opacity', ( b: node ) -> 1.0 / node.depth)

    # remove dead links
    selection.exit().remove()

    # find nodes
    allNodes = (v for _, v of this.nodes)
    selection =
      this.d3doc.selectAll('.node').data(allNodes)

    # add nodes
    newNodes =
      selection
        .enter().append('g')
        .attr('class', 'node')
    newNodes.append('circle')
      .attr('r', 6)
      .attr('cx', 0)
      .attr('cy', 0)
      .on('click', (node) => this.select(node))
      .on('mouseout', (node) -> node.hover(false))
      .on('mouseover', (node) -> node.hover(true))
    newNodes.append('text')

    # update node class
    selection
      .attr('class', (node) -> (flag for flag, active of node.flags when active is true).join(' '))

    # update node text
    selection.selectAll('text')
      .text((node) -> node.outer)
      .attr('x', 11)
      .attr('y', 3)

    # update node positions
    selection
      .transition()
        .duration(600)
        .delay((node) -> node.depth * 60 + node.index() * 40)
        .attr('transform', (node) -> "translate(#{strategy.place(node).x}, #{strategy.place(node).y})")
        .selectAll('text')
          .attr('transform', (node) -> strategy.transformText(node))

    # remove dead nodes
    selection.exit().remove()

class Node
  constructor: (@tree, @parent, { @id, @outer, @inner, @type }) ->
    this.children = {}
    this.sortedChildren = []

    this.flags = { node: true }

    this.depth = (this.parent?.depth ? -1) + 1
    this.isRoot = this.depth is 0

  add: (data) ->
    node = new Node(this.tree, this, data)
    this.tree.nodes[node.id] = node
    this.children[node.id] = node

    this.sortedChildren = (v for _, v of this.children)
    this.sortedChildren.sort((a, b) -> a.outer.localeCompare(b.outer))

    node.flag('selectedChild', true) if this.flags.selected is true

    this.tree._draw()

    node

  remove: ->
    delete this.tree.nodes[this.id]
    delete this.parent.children[this.id]

    this.tree._draw()

    null

  index: ->
    if this.parent?
      this.parent.sortedChildren.indexOf(this) + 1
    else
      0

  flag: (name, active) -> this.flags[name] = (active is true)
  flagParents: (name, active) -> parent.flag(name, active) for parent in this.parents()
  flagChildren: (name, active) -> child.flag(name, active) for _, child of this.children

  previous: -> this.parent?.sortedChildren[this.index() - 2] ? null
  next: -> this.parent?.sortedChildren[this.index()] ? null

  hover: (active) ->
    this.flag('hovered', active)
    this.flagParents('hoveredParent', active)
    this.tree._draw()
    null

  parents: ->
    cursor = this
    (cursor = cursor.parent) while cursor.parent?

  links: ->
    result = []

    # self to first child
    result.push( a: this, b: this.sortedChildren[0] ) if this.sortedChildren.length > 0

    # our children
    result.push( a: this.sortedChildren[i], b: this.sortedChildren[i + 1] ) for i in [0...this.sortedChildren.length - 1] if this.sortedChildren.length > 1

    # our children's children
    result.concat((child.links() for _, child of this.children)...)

class PlacementStrategy
  constructor: (@tree) ->
    this._place$ = {}
    this._initialize?()

  place: (node) -> this._place$[node.id] ?= this._place(node)
  _place: (node) ->

  transformText: (node) -> ''

class OriginStrategy extends PlacementStrategy
  _place: -> { x: 0, y: 0 }

class RectilinearStrategy extends PlacementStrategy
  __maxLength: 700
  __normDist: 95
  __minDist: 20

  _place: (node) ->
    if node.isRoot
      { x: 0, y: 0 }
    else
      length = node.parent.sortedChildren.length
      normDist = Math.max(this.__normDist - (node.depth * 8), this.__minDist)
      dist =
        if (length * normDist) <= this.__maxLength
          normDist
        else if (length * this.__minDist) <= this.__maxLength
          this.__maxLength / length
        else
          this.__minDist

      base = this.place(node.parent)
      index = node.index()

      if node.depth is 1
        { x: base.x, y: base.y + index * dist }
      else if isEven(node.depth)
        dist /= 1.4142135623730951 # diagonal

        if isEven(node.parent.index())
          { x: base.x + index * dist, y: base.y + index * dist }
        else
          { x: base.x - index * dist, y: base.y + index * dist }
      else
        if base.x < 0
          { x: base.x - index * dist, y: base.y }
        else
          { x: base.x + index * dist, y: base.y }

  transformText: (node) ->
    ops = []

    if node.depth < 2
      # do nothing
    else
      if isEven(node.depth)
        if isEven(node.parent.index())
          ops.push('rotate(-45)')
        else
          ops.push('rotate(45)')
      else
        ops.push('rotate(-45)')

    ops.join(' ')

class OrbitStrategy extends PlacementStrategy
  __maxAngle: 65
  __baseRadius: 200

  _initialize: ->
    this._angleFor$ = {}

  _angleFor: (node) -> this._angleFor$[node.id] ?=
    if node.isRoot
      180
    else
      incrAngle = Math.min(this.__maxAngle, 360.0 / node.parent.sortedChildren.length)
      siblingCount = node.parent.sortedChildren.length
      this._angleFor(node.parent) + incrAngle * (node.index() - 1) - (incrAngle * (siblingCount - 1.0) / 2.0)

  _place: (node) ->
    if node.isRoot
      { x: 0, y: 0 }
    else
      base = this.place(node.parent)
      angle = this._angleFor(node) * Math.PI / 180
      radius = this.__baseRadius / node.depth

      { x: base.x + Math.sin(angle) * radius, y: base.y - Math.cos(angle) * radius }

  transformText: (node) -> "rotate(#{this._angleFor(node) - 90})"

data =
  application:
    inner: 'SocrataApp'
    type: 'model'
    children:
      stores:
        inner: 'Library'
        type: 'klass'
        children:
          application:
            inner: 'SocrataApp'
            type: 'model'
      views:
        inner: 'Library'
        type: 'class'
      current_user:
        inner: 'User'
        type: 'model'
        children:
          login:
            inner: 'cxlt'
            type: 'string'
          followers:
            inner: '35'
            type: 'number'
          email:
            inner: 'clint@dontexplain.com'
            type: 'string'
          authenticated:
            inner: 'true'
            type: 'boolean'
          random_nest:
            inner: 'Nest'
            type: 'model'
            children:
              application:
                inner: 'SocrataApp'
                type: 'model'
                children:
                  stores:
                    inner: 'Library'
                    type: 'klass'
                  views:
                    inner: 'Library'
                    type: 'klass'
                  current_user:
                    inner: 'User'
                    type: 'model'
                    children:
                      login:
                        inner: 'cxlt'
                        type: 'string'
                      followers:
                        inner: '35'
                        type: 'number'
  currentPage:
    inner: 'GoalPage'
    type: 'model'
    children:
      goal:
        inner: 'Goal'
        type: 'model'

d3 = this.d3

svg = d3.select('.graph')
  .append('svg')

origin =
  x: 600
  y: 20
lastPosition = {}

g = svg.append('g')
  .attr('class', 'tree')
  .attr('transform', "translate(#{origin.x}, #{origin.y})")

dragDoc = d3.behavior.drag()
  .origin(-> origin)
  .on('drag', ->
    lastPosition.x = d3.event.x
    lastPosition.y = d3.event.y

    g.attr('transform', "translate(#{d3.event.x}, #{d3.event.y})")
  )
  .on('dragend', -> origin = lastPosition if lastPosition.x?)

svg.call(dragDoc)

tree = new LiveTree(g)

addChildren = (children, to) ->
  for name, datum of children
    datum.id ?= _.uniqueId()
    datum.outer = name # ??

    node = to.add(datum)
    addChildren(datum.children, node) if datum.children?
    null

addChildren(data, tree.root)

strategies = [ RectilinearStrategy, OrbitStrategy ]
currentStrategy = 0
window.setTimeout((-> tree.setStrategy(strategies[currentStrategy])), 10)

$('body').on 'keydown', (event) ->
  candidate =
    if event.which is 37 # left
      tree.selection.previous()
    else if event.which is 38 # up
      tree.selection.parent
    else if event.which is 39 # right
      tree.selection.next()
    else if event.which is 40 # down
      tree.selection.sortedChildren[0]

  tree.select(candidate) if candidate?

$('body').on 'keydown', (event) ->
  if event.which is 13
    tree.setStrategy(strategies[++currentStrategy % strategies.length])

