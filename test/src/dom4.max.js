/*!
Copyright (C) 2013 by WebReflection

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
(function(window){'use strict';
  /* jshint loopfunc: true, noempty: false*/
  // https://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html#interface-element
  // https://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html#dom-rootnode-prepend
  function textNodeIfString(node) {
    return typeof node === 'string' ? window.document.createTextNode(node) : node;
  }
  function mutationMacro(nodes) {
    if (nodes.length === 1) {
      return textNodeIfString(nodes[0]);
    }
    for (var
      fragment = window.document.createDocumentFragment(),
      list = slice.call(nodes),
      i = 0; i < nodes.length; i++
    ) {
      fragment.appendChild(textNodeIfString(list[i]));
    }
    return fragment;
  }
  for(var
    property,
    verifyToken,
    DOMTokenList,
    trim = /^\s+|\s+$/g,
    spaces = /\s+/,
    SPACE = '\x20',
    ElementPrototype = (window.Element || window.HTMLElement || window.Node).prototype,
    properties = [
      'prepend', function prepend() {
        var firstChild = this.firstChild,
            node = mutationMacro(arguments);
        if (firstChild) {
          this.insertBefore(node, firstChild);
        } else {
          this.appendChild(node);
        }
      },
      'append', function append() {
        this.appendChild(mutationMacro(arguments));
      },
      'before', function before() {
        var parentNode = this.parentNode;
        if (parentNode) {
          parentNode.insertBefore(
            mutationMacro(arguments), this
          );
        }
      },
      'after', function after() {
        var parentNode = this.parentNode,
            nextSibling = this.nextSibling,
            node = mutationMacro(arguments);
        if (parentNode) {
          if (nextSibling) {
            parentNode.insertBefore(node, nextSibling);
          } else {
            parentNode.appendChild(node);
          }
        }
      },
      'replace', function replace() {
        var parentNode = this.parentNode;
        if (parentNode) {
          parentNode.replaceChild(
            mutationMacro(arguments),
            this
          );
        }
      },
      'remove', function remove() {
        var parentNode = this.parentNode;
        if (parentNode) {
          parentNode.removeChild(this);
        }
      }
    ],
    slice = properties.slice,
    i = properties.length; i; i -= 2
  ) {
    property = properties[i - 2];
    if (!(property in ElementPrototype)) {
      ElementPrototype[property] = properties[i - 1];
    }
  }
  if (!('classList' in ElementPrototype)) {
    // http://www.w3.org/TR/domcore/#domtokenlist
    verifyToken = function (token) {
      if (!token) {
        throw 'SyntaxError';
      } else if (spaces.test(token)) {
        throw 'InvalidCharacterError';
      }
      return token;
    };
    DOMTokenList = function (node) {
      properties.push.apply(
        this,
        node.className.replace(trim, '').split(spaces)
      );
      this._ = node;
    };
    DOMTokenList.prototype = {
      length: 0,
      add: function add() {
        for(var j = 0, token; j < arguments.length; j++) {
          token = arguments[j];
          if(!this.contains(token)) {
            properties.push.call(this, property);
          }
        }
        this._.className = '' + this;
      },
      contains: (function(indexOf){
        return function contains(token) {
          i = indexOf.call(this, property = verifyToken(token));
          return -1 < i;
        };
      }([].indexOf || function (token) {
        i = this.length;
        while(i-- && this[i] !== token){}
        return i;
      })),
      item: function item(i) {
        return this[i] || null;
      },
      remove: function remove() {
        for(var j = 0, token; j < arguments.length; j++) {
          token = arguments[j];
          if(this.contains(token)) {
            properties.splice.call(this, i, 1);
          }
        }
        this._.className = '' + this;
      },
      toggle: function toggle(token, force) {
        if (this.contains(token)) {
          if (!force) {
            // force is not true (either false or omitted)
            this.remove(token);
          }
        } else if(force) {
          this.add(token);
        }
        return !!force;
      },
      toString: function toString() {
        return properties.join.call(this, SPACE);
      }
    };
    (Object.defineProperty || function (object, property, descriptor) {
      object.__defineGetter__(property, descriptor.get);
    })(ElementPrototype, 'classList', {
      get: function get() {
        return new DOMTokenList(this);
      }
    });
  }
}(window));