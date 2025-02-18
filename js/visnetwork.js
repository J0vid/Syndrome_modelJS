 // create an array with nodes
 var DIR = "./images/mod_images/";

 var nodes = new vis.DataSet([
    {id: 1, label: 'Face', shape: "circularImage", image: DIR + "mod1.png", x: -500, y: -800},
    {id: 2, label: 'Posterior mandible', shape: "circularImage", image: DIR + "mod2.png" },
    {id: 3, label: 'Nose', shape: "circularImage", image: DIR + "mod3.png" },
    {id: 4, label: 'Anterior mandible', shape: "circularImage", image: DIR + "mod4.png" },
    {id: 5, label: 'Brow', shape: "circularImage", image: DIR + "mod5.png" },
    {id: 6, label: 'Zygomatic', shape: "circularImage", image: DIR + "mod6.png" },
    {id: 7, label: 'Premaxilla', shape: "circularImage", image: DIR + "mod7.png" }
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
    size: 40,
    color: {
      border: "#48298C",
      background: "#6AAFFF",
      highlight: {
        border: "#48298C"
      }
    },
    font: { 
      color: "black",
      size: 20
   },
    shapeProperties: {
      useBorderWithImage: true,
    },
    
  },
  edges: {
    color: "#48298C"
  },
};

// initialize your network!
var network = new vis.Network(container, data, options);
