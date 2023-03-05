const comparisonCanvas = document.getElementById("renderCanvas2"); // Get the canvas element

const engine2 = new BABYLON.Engine(comparisonCanvas, true); // Generate the BABYLON 3D engine

const createScene1 = function () {
    
    const scene1 = new BABYLON.Scene(engine2);  
    
    // const axes = new BABYLON.AxesViewer(scene1, 70);

    scene1.clearColor = new BABYLON.Color4(0.988, 0.988, 0.988);
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI * .5, Math.PI * .5, 750, new BABYLON.Vector3(0, 15, 0));

    camera.attachControl(comparisonCanvas, true);
    camera.fov = .75;
    camera.allowUpsideDown = false;
    camera.upperAlphaLimit = Math.PI;
    camera.lowerAlphaLimit = 0;
    camera.upperRadiusLimit = 450;
    camera.lowerRadiusLimit = 100;

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, 100));
    const light2 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(40, 40, 100));
    light.specular = new BABYLON.Color3(0, 0, 0);
    light2.specular = new BABYLON.Color3(0, 0, 0);

    return scene1;
};

const comparisonScene = createScene1();

engine2.runRenderLoop(function () {
    comparisonScene.getEngine().resize();
    comparisonScene.render();
    network.fit();
});

//define comparison selection
var selectedSyndrome2 = document.getElementById("referenceComp");
selectedSyndrome2.onchange = function() {
    //if either ref or comp change, delete last parent meshes and load new ones
    if(comparisonScene.meshes.length > 0) comparisonScene.getMeshByName('__root__').dispose()
    if(comparisonScene.meshes.length > 0) comparisonScene.getMeshByName('__root__').dispose()
 
    refMesh = BABYLON.SceneLoader.ImportMesh("", "./assets/", document.getElementById("referenceComp").value + ".glb", comparisonScene, function (meshes) {
    
        refInfluence = comparisonScene.getMeshByName(document.getElementById("referenceComp").value).morphTargetManager.getTarget(1);

        document.getElementById("compAgeSlider").min = parseInt(refInfluence.name.split("_")[1])
        document.getElementById("compAgeSlider").max = parseInt(refInfluence.name.split("_")[2])
        document.getElementById("compAgeSlider").value = (parseInt(refInfluence.name.split("_")[1]) + parseInt(refInfluence.name.split("_")[2]) /2)
        document.getElementById("compAgeSliderLabel").innerHTML = document.getElementById("compAgeSlider").value + " y/o"

        //set influence starting value to reset slider
        refInfluence.influence = document.getElementById("compAgeSlider").value/100

        //set masculinity to neutral
        comparisonScene.getMeshByName(document.getElementById("referenceComp").value).morphTargetManager.getTarget(2).influence = -1;

        //get rid of skin material
        meshes[1].material.dispose()

        if(document.getElementById("Comparisons-tab").className === 'nav-link active') {
            updateHeatmap();
        } 
    }) //end loader


    compMesh = BABYLON.SceneLoader.ImportMesh("", "./assets/", document.getElementById("syndromeComp").value + ".glb", comparisonScene, function (meshes) {
        compInfluence = comparisonScene.getMeshByName(document.getElementById("syndromeComp").value).morphTargetManager.getTarget(1);    
        compInfluence.influence = document.getElementById("compAgeSlider").value/100
        comparisonScene.getMeshByName(document.getElementById("syndromeComp").value).setEnabled(false) //need to call by id, otherwise I'm disable scene when ref === comp
        comparisonScene.getMeshByName(document.getElementById("syndromeComp").value).morphTargetManager.getTarget(2).influence = -1;

        if(document.getElementById("Comparisons-tab").className === 'nav-link active') {
            updateHeatmap();
        } 
    }) //end loader
}

var selectedSyndromeComp = document.getElementById("syndromeComp");

selectedSyndromeComp.onchange = function() {
    if(comparisonScene.meshes.length > 0) comparisonScene.getMeshByName('__root__').dispose()
    if(comparisonScene.meshes.length > 0) comparisonScene.getMeshByName('__root__').dispose()
 
    refMesh = BABYLON.SceneLoader.ImportMesh("", "./assets/", document.getElementById("referenceComp").value + ".glb", comparisonScene, function (meshes) {
    
        refInfluence = comparisonScene.getMeshByName(document.getElementById("referenceComp").value).morphTargetManager.getTarget(1);

        document.getElementById("compAgeSlider").min = parseInt(refInfluence.name.split("_")[1])
        document.getElementById("compAgeSlider").max = parseInt(refInfluence.name.split("_")[2])
        document.getElementById("compAgeSlider").value = (parseInt(refInfluence.name.split("_")[1]) + parseInt(refInfluence.name.split("_")[2]) /2)
        document.getElementById("compAgeSliderLabel").innerHTML = document.getElementById("compAgeSlider").value + " y/o"

        //set influence starting value to reset slider
        refInfluence.influence = document.getElementById("compAgeSlider").value/100

        comparisonScene.getMeshByName(document.getElementById("referenceComp").value).morphTargetManager.getTarget(2).influence = -1;

        //get rid of skin material
        meshes[1].material.dispose()

        if(document.getElementById("Comparisons-tab").className === 'nav-link active') {
            updateHeatmap();
        } 
    }) //end loader

    compMesh = BABYLON.SceneLoader.ImportMesh("", "./assets/", document.getElementById("syndromeComp").value + ".glb", comparisonScene, function (meshes) {
        compInfluence = comparisonScene.getMeshByName(document.getElementById("syndromeComp").value).morphTargetManager.getTarget(1);    
        compInfluence.influence = document.getElementById("compAgeSlider").value/100
        comparisonScene.getMeshByName(document.getElementById("syndromeComp").value).setEnabled(false) //need to call by id, otherwise I'm disable scene when ref === comp
        comparisonScene.getMeshByName(document.getElementById("syndromeComp").value).morphTargetManager.getTarget(2).influence = -1;

        if(document.getElementById("Comparisons-tab").className === 'nav-link active') {
            throttledHeatmap();
        } 
    }) //end loader
  
}

// Define comparison slider logic here because it impacts the morphtarget, the heatmap, and the scores
var compSlider = document.getElementById("compAgeSlider");
compSlider.oninput = function() {
    tmpValue = this.value
    refInfluence.influence = tmpValue/100;
    compInfluence.influence = tmpValue/100;
    
    if(document.getElementById("Comparisons-tab").className === 'nav-link active') {
        updateHeatmap(tmpValue);
    } 
}

//initial loading of reference mesh
refMesh = BABYLON.SceneLoader.ImportMesh("", "assets/", document.getElementById("referenceComp").value + ".glb", comparisonScene, function (meshes) {

    refInfluence = comparisonScene.getMeshByName(document.getElementById("referenceComp").value).morphTargetManager.getTarget(0);
      //get rid of skin material
      meshes[1].material.dispose()
}) //end loader

// compMesh = BABYLON.SceneLoader.ImportMesh("", "assets/", document.getElementById("syndromeComp").value + ".glb", comparisonScene, function (meshes) {
    
//     //comparisonScene.getMeshByName(document.getElementById("syndromeComp")).setEnabled(false)

// compInfluence = comparisonScene.getMeshByName(document.getElementById("syndromeComp").value).morphTargetManager.getTarget(0);

// }) //end loader


