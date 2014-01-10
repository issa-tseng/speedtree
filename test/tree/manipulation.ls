expect = require('expect.js')

Node = require('../../lib/tree/node')
{ with-data, with-child, with-children, without-child } = require('../../lib/tree/manipulation').node

suite 'manipulation', ->

  suite 'with-data', ->

    test 'returns a new instance', ->
      x = new Node( data: 1 )
      y = with-data(2, x)

      expect(x).not.to.equal(y)

    test 'preserves other attrs', ->
      x = new Node( data: 1, id: \a )
      y = with-data(2, x)

      expect(y.id).to.equal(\a)

    test 'replaces data', ->
      x = new Node( data: 1 )
      y = with-data(2, x)

      expect(y.data).to.equal(2)

  suite 'with-child', ->

    test 'returns a new instance', ->
      x = new Node( data: 1 )
      y = with-child(new Node(), x)

      expect(x).not.to.equal(y)

    test 'preserves other attrs', ->
      x = new Node( data: 1 )
      y = new Node( id: \y )
      z = with-child(y, x)

      expect(z.data).to.equal(1)

    test 'adds the child by id', ->
      x = new Node()
      y = new Node( id: \y )
      z = with-child(y, x)

      expect(z.children).to.eql( y: y )

  suite 'with-children', ->

    test 'returns a new instance', ->
      x = new Node( data: 1 )
      z = with-children(( y: new Node() ), x)

      expect(x).not.to.equal(z)

    test 'preserves other attrs', ->
      x = new Node( data: 1 )
      y = new Node( id: \y )
      z = with-children(( y: y ), x)

      expect(z.data).to.equal(1)

    test 'adds the children by id', ->
      x = new Node()
      a = new Node( id: \a )
      b = new Node( id: \b )
      c = new Node( id: \c )
      z = with-children(( a: a, b: b, c: c ), x)

      expect(z.children).to.eql( a: a, b: b, c: c )

  suite 'without-child', ->

    test 'returns a new instance', ->
      x = new Node( data: 1 )
      y = with-child(x, new Node())
      z = without-child(x, y)

      expect(y).not.to.equal(z)

    test 'preserves other attrs', ->
      x = new Node( data: 1 )
      y = with-child(x, new Node( id: \y ))
      z = without-child(x, y)

      expect(z.id).to.equal(\y)

    test 'removes the child', ->
      x = new Node( id: \x )
      y = with-child(x, new Node())
      z = without-child(x, y)

      expect(z.children).to.eql({})

    test 'preserves other children', ->
      a = new Node( id: \a )
      b = new Node( id: \b )
      y = with-child(b, with-child(a, new Node()))
      z = without-child(a, y)

      expect(z.children).to.eql( b: b )

