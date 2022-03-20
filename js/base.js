
const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const comparisonCanvas = document.getElementById("renderCanvas2"); // Get the canvas element

const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
const engine2 = new BABYLON.Engine(comparisonCanvas, true); // Generate the BABYLON 3D engine
                    
const createScene = function () {
    
    const scene = new BABYLON.Scene(engine);  
    scene.useRightHandedSystem = false;
    
    const axes = new BABYLON.AxesViewer(scene, 70);

    scene.clearColor = new BABYLON.Color4(0.988, 0.988, 0.988);
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI * .5, Math.PI * .5, 650, new BABYLON.Vector3(0, 15, 0));

    camera.attachControl(canvas, true);
    camera.fov = 0.5;
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));

    return scene;
};

const createScene1 = function () {
    
    const scene1 = new BABYLON.Scene(engine2);  
    
    // const axes = new BABYLON.AxesViewer(scene1, 70);

    scene1.clearColor = new BABYLON.Color4(0.988, 0.988, 0.988);
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI * .5, Math.PI * .5, 650, new BABYLON.Vector3(0, 15, 0));

    camera.attachControl(comparisonCanvas, true);
    camera.fov = 0.5;
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));

    return scene1;
};

const scene = createScene(); //Call the createScene function

const comparisonScene = createScene1();

myMesh = BABYLON.SceneLoader.ImportMesh("", "assets/", "syndrome_model.glb", scene, function (meshes) {
    
    for (var i = 0; i < document.getElementById("syndrome").options.length; i++) {
        console.log(scene.getMeshByName(document.getElementById("syndrome").options[i].value))
        scene.getMeshByName(document.getElementById("syndrome").options[i].value).setEnabled(false)
    }
    
    scene.getMeshByName(document.getElementById("syndrome").value).setEnabled(true)
    myInfluence = scene.getMeshByName("Achondroplasia_1_gestalt(1)").morphTargetManager.getTarget(0);
}) //end loader

compMesh = BABYLON.SceneLoader.ImportMesh("", "assets/", "syndrome_model.glb", comparisonScene, function (meshes) {
    
    for (var i = 0; i < document.getElementById("syndrome").options.length; i++) {
        comparisonScene.getMeshByName(document.getElementById("syndrome").options[i].value).setEnabled(false)
    }
    
    comparisonScene.getMeshByName(document.getElementById("syndrome").value).setEnabled(true)
    myInfluence2 = comparisonScene.getMeshByName("Achondroplasia_1_gestalt(1)").morphTargetManager.getTarget(0);
}) //end loader

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    scene.render();
});

engine2.runRenderLoop(function () {
    comparisonScene.render();
});


// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
        engine.resize();
        engine2.resize();
});

window.onresize = function() {network.fit();}


// Define selected morphtarget
var selectedSyndrome = document.getElementById("syndrome");

selectedSyndrome.onchange = function() {
    for (var i = 0; i < document.getElementById("syndrome").options.length; i++) {
        console.log(scene.getMeshByName(document.getElementById("syndrome").options[i].value))
        scene.getMeshByName(document.getElementById("syndrome").options[i].value).setEnabled(false)
    }

    if(scene.getMeshByName("Achondroplasia_1_gestalt(1)") !== null){
        scene.getMeshByName(document.getElementById("syndrome").value).setEnabled(true)
        myInfluence = scene.getMeshByName(document.getElementById("syndrome").value).morphTargetManager.getTarget(0);
    }
}

var selectedSyndrome2 = document.getElementById("referenceComp");

selectedSyndrome2.onchange = function() {
    for (var i = 0; i < document.getElementById("referenceComp").options.length; i++) {
        console.log(comparisonScene.getMeshByName(document.getElementById("referenceComp").options[i].value))
        comparisonScene.getMeshByName(document.getElementById("referenceComp").options[i].value).setEnabled(false)
    }

    if(comparisonScene.getMeshByName("Achondroplasia_1_gestalt(1)") !== null){
        comparisonScene.getMeshByName(document.getElementById("referenceComp").value).setEnabled(true)
        myInfluence2 = comparisonScene.getMeshByName(document.getElementById("referenceComp").value).morphTargetManager.getTarget(0);
    }
}

// Define slider logic here because it impacts the morphtarget, the heatmap, and the scores
var slider = document.getElementById("ageSlider");
slider.oninput = function() {
    tmpValue = this.value
    myInfluence.influence = tmpValue/100;

}

// Define slider logic here because it impacts the morphtarget, the heatmap, and the scores
var compSlider = document.getElementById("compAgeSlider");
compSlider.oninput = function() {
    tmpValue = this.value
    myInfluence2.influence = tmpValue/100;
    
    if(document.getElementById("heatmapCheck").checked) {
        updateHeatmap(tmpValue);
    } else if(document.getElementById("heatmapCheck").checked === false){
        if(comparisonScene.getMeshByName("Achondroplasia_1_gestalt(1)") !== null){
            //need to remove the color changes when the checkbox is unclicked
        }
    }
}


function changeWell(divName){

    if(divName === 'gestaltContainer'){
    document.getElementById("gestaltContainer").style.display = ""
    document.getElementById("comparisonContainer").style.display = "none"
    }

    if(divName === 'comparisonContainer'){
        document.getElementById("gestaltContainer").style.display = "none"
        document.getElementById("comparisonContainer").style.display = ""
        }
}


