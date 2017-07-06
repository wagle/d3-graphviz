import * as Viz from "viz.js";
import * as d3 from "d3-selection";

export default function(src, rootElement) {

    function extractData(element) {

        var datum = {};
        var tag = element.node().nodeName;
        datum.tag = tag;
        datum.attributes = [];
        datum.children = [];
        var attributes = element.node().attributes;
        if (attributes) {
            for (var i = 0; i < attributes.length; i++) {
                var attribute = attributes[i];
                var name = attribute.name;
                var value = attribute.value;
                datum.attributes.push({'name': name, 'value': value});
            }
        }
        if (tag == '#text') {
            datum.text = element.text();
        } else if (tag == '#comment') {
            datum.comment = element.text();
        }
        var children = d3.selectAll(element.node().childNodes);
        children.each(function () {
            if (this !== null) {
                var childData = extractData(d3.select(this));
                if (childData) {
                    datum.children.push(childData);
                }
            }
        });
        return datum;
    }

    function insertSvg(element, data) {
        if (element.node().childNodes.length != 0) {
            var children = d3.selectAll(element.node().childNodes);
        } else if (data.length == 0) {
            return;
        } else {
            var children = element.selectAll('*');
        }
        children = children
          .data(data);
        var childrenEnter = children
          .enter()
          .append(function(d) {
              if (d.tag == '#text') {
                  return document.createTextNode(d.text);
              } else if (d.tag == '#comment') {
                  return document.createComment(d.comment);
              } else {
                  return document.createElementNS('http://www.w3.org/2000/svg', d.tag);
              }
          });

        children = childrenEnter
            .merge(children);
        children.each(function(childData) {
            var child = d3.select(this);
            childData.attributes.forEach(function(attribute) {
                child.attr(attribute.name, attribute.value);
            });
            insertSvg(child, childData.children);
        });
    }

    var svgDoc = Viz(src,
              {
                  format: "svg",
                  engine: "dot"
              }
             );

    var newDoc = d3.select(document.createDocumentFragment())
      .append('div');

    newDoc
        .html(svgDoc);

    var newSvg = newDoc
      .select('svg');

    var data = extractData(newSvg);

    var root = d3.select(rootElement);
    insertSvg(root, [data]);

};
