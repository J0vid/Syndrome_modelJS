
getGradientColor = function(start_color, end_color, percent) {
    // strip the leading # if it's there
    start_color = start_color.replace(/^\s*#|\s*$/g, '');
    end_color = end_color.replace(/^\s*#|\s*$/g, '');

    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if(start_color.length == 3){
        start_color = start_color.replace(/(.)/g, '$1$1');
    }

    if(end_color.length == 3){
        end_color = end_color.replace(/(.)/g, '$1$1');
    }

    // get colors
    var start_red = parseInt(start_color.substr(0, 2), 16),
    start_green = parseInt(start_color.substr(2, 2), 16),
    start_blue = parseInt(start_color.substr(4, 2), 16);

    var end_red = parseInt(end_color.substr(0, 2), 16),
    end_green = parseInt(end_color.substr(2, 2), 16),
    end_blue = parseInt(end_color.substr(4, 2), 16);

    // calculate new color
    var diff_red = end_red - start_red;
    var diff_green = end_green - start_green;
    var diff_blue = end_blue - start_blue;

    diff_red = ((diff_red * percent) + start_red).toString(16).split('.')[0];
    diff_green = ((diff_green * percent) + start_green).toString(16).split('.')[0];
    diff_blue = ((diff_blue * percent) + start_blue).toString(16).split('.')[0];

    // ensure 2 digits by color
    if(diff_red.length == 1) diff_red = '0' + diff_red
    if(diff_green.length == 1) diff_green = '0' + diff_green
    if(diff_blue.length == 1) diff_blue = '0' + diff_blue

    return '#' + diff_red + diff_green + diff_blue;
};

function arrayMin(arr) {
    var len = arr.length, min = Infinity;
    while (len--) {
        if (arr[len] < min) {
            min = arr[len];
        }
    }
    return min;
};

function arrayMax(arr) {
    var len = arr.length, max = -Infinity;
    while (len--) {
        if (arr[len] > max) {
            max = arr[len];
        }
    }
    return max;
};

function whichMin(a) {
    var lowest = 0;
        for (var i = 1; i < a.length; i++) {
            if (a[i] < a[lowest]) lowest = i;
        }
    return lowest;
};

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    
    return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
    } : null;
}

//iterate 10 steps red to white
gradient = [];
const nsteps = 20

for (let i = 0; i < nsteps; i++) { 
    gradient.push(getGradientColor('#0000FF', '#FFFFFF', (i + 1)/nsteps))
}

//iterate 10 steps white to blue
for (let i = 0; i < nsteps; i++) { 
    gradient.push(getGradientColor('#FFFFFF', '#FF0000', (i + 1)/nsteps))
}

//console.log(gradient) //check that gradient function actually makes a color ramp
    
dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);

function updateHeatmap(tmpValue) {

    compStart = comparisonScene.getMeshByName(document.getElementById("referenceComp").value)
    compCurrent = comparisonScene.getMeshByName(document.getElementById("referenceComp").value).morphTargetManager.getTarget(1);
    compCurrent.influence = compSlider.value/100

    ex_mesh = comparisonScene.getMeshByName(document.getElementById("syndromeComp").value);
    currentInfluence = comparisonScene.getMeshByName(document.getElementById("syndromeComp").value).morphTargetManager.getTarget(1);

    //currentInfluence = myInfluence//ex_mesh.morphTargetManager.getTarget(0); 

    startMesh = ex_mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
    startMesh2 = compStart.getVerticesData(BABYLON.VertexBuffer.PositionKind)

    startNormals = ex_mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind)
    // console.log(start_normals)

    // colors = ex_mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);

    let positions = startMesh//ex_mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

    x = [];
    y = [];

    for(var i = 0;i<=positions.length-1; i++){
        x.push(((currentInfluence._positions[i] - startMesh[i]) * currentInfluence.influence) + startMesh[i]);  
        y.push(((compCurrent._positions[i] - startMesh2[i]) * compCurrent.influence) + startMesh2[i]);  
    }

    //calculate diffs between meshes
    diff_mesh_raw = [];

    for(var p = 0; p <= positions.length; p++) {
        diff_mesh_raw.push(x[p] - y[p]) //mesh differences raw
    }

    diff_mesh = [];

    for(var p = 0; p <= positions.length / 3; p++) {
        tmp_diffs = [diff_mesh_raw[((1+p)*3)-3], diff_mesh_raw[((1+p)*3)-2], diff_mesh_raw[((1+p)*3)-1]]
        tmp_normal = [startNormals[((1+p)*3)-3], startNormals[((1+p)*3)-2], startNormals[((1+p)*3)-1]]
        diff_mesh.push(dot(tmp_diffs, tmp_normal))
        //diff_mesh.push(Math.sqrt((start_mesh[((1+p)*3)-3] - x[((1+p)*3)-3])**2 + (start_mesh[((1+p)*3)-2] - x[((1+p)*3)-2])**2 + (start_mesh[((1+p)*3)-1] - x[((1+p)*3)-1])**2)) //mesh differences raw
    }

    //console.log(diff_mesh) //are there differences between the meshes?

    var start = arrayMin(diff_mesh)
    var end = arrayMax(diff_mesh)
    var diff = ((end - start) / (2 * nsteps));

    // console.log(2*nsteps)
    // console.log((2*nsteps)-1)

    bins = [];
    bins[0] = start;
    for(var i=1; i<=(2*nsteps)-1; i++){
        bins.push(bins[i-1] + diff);
    }

    //console.log(arrayMin(diff_mesh))
    // console.log(bins)
    //console.log(Math.abs(bins[0] - diff_mesh[0]))

    //calculate final colors and push to mesh
    colors = [];

    for(var p = 0; p < diff_mesh.length; p++) {
        //for(var p = 0; p < 9 / 3; p++) {

        //We have to index colors based on the current node: network.getSelectedNodes()[0]

        //assign colors to value p based on nearest bin
        diff_bins = [];
        for(var i = 0; i < bins.length; i++) {
        diff_bins.push(Math.abs(bins[i] - diff_mesh[p]))
        // console.log(bins[i])
        //console.log(diff_mesh[p])
        }

        tmp_color = gradient[whichMin(diff_bins)];

        colors.push(hexToRgb(tmp_color).r/255, hexToRgb(tmp_color).g/255, hexToRgb(tmp_color).b/255, 1);
    }


    return(comparisonScene.getMeshByName(document.getElementById("referenceComp").value).setVerticesData(BABYLON.VertexBuffer.ColorKind, colors))

}
                    
                    


                   

    