 // create an array with nodes
 var DIR = "./images/mod_images/";

 var nodes = new vis.DataSet([
    {id: 1, label: 'face', shape: "circularImage", image: DIR + "mod1.png", x: -500, y: -800},
    {id: 2, label: 'posterior_mandible', shape: "circularImage", image: DIR + "mod2.png" },
    {id: 3, label: 'nose', shape: "circularImage", image: DIR + "mod3.png" },
    {id: 4, label: 'anterior_mandible', shape: "circularImage", image: DIR + "mod4.png" },
    {id: 5, label: 'brow', shape: "circularImage", image: DIR + "mod5.png" },
    {id: 6, label: 'zygomatic', shape: "circularImage", image: DIR + "mod6.png" },
    {id: 7, label: 'premaxilla', shape: "circularImage", image: DIR + "mod7.png" }
]);

// create an array with edges
var edges = new vis.DataSet([
    {from: 1, to: 2},
    {from: 1, to: 3},
    {from: 1, to: 4},
    {from: 1, to: 5},
    {from: 1, to: 6},
    {from: 1, to: 7}
]);

// create a network
var container = document.getElementById('mynetwork');

// provide the data in the vis format
var data = {
    nodes: nodes,
    edges: edges
};
var options = {
  // autoResize: true,
  // height: '400px',
  // width: '300px',
  clickToUse: false,
  nodes: {
    borderWidth: 4,
    size: 30,
    color: {
      border: "#AE80E6",
      background: "#6AAFFF",
      highlight: {
        border: "#AE80E6"
      }
    },
    font: { color: "black" },
    shapeProperties: {
      useBorderWithImage: true,
    },
    
  },
  edges: {
    color: "#AE80E6"
  },
};

// initialize your network!
var network = new vis.Network(container, data, options);
