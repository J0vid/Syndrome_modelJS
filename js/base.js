
const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const comparisonCanvas = document.getElementById("renderCanvas2"); // Get the canvas element

const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
const engine2 = new BABYLON.Engine(comparisonCanvas, true); // Generate the BABYLON 3D engine
                    
const createScene = function () {
    
    const scene = new BABYLON.Scene(engine);  
    scene.useRightHandedSystem = false;
    
    // const axes = new BABYLON.AxesViewer(scene, 70);

    scene.clearColor = new BABYLON.Color4(0.988, 0.988, 0.988);
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI * .5, Math.PI * .5, 650, new BABYLON.Vector3(0, 15, 0));

    camera.attachControl(canvas, true);
    camera.fov = 0.5;
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(100, 100, 0));

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

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
        engine.resize();
        engine2.resize();
});

window.onresize = function() {network.fit();}

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    scene.render();
});

engine2.runRenderLoop(function () {
    comparisonScene.render();
});





// Define selected morphtarget
var selectedSyndrome = document.getElementById("syndrome");

selectedSyndrome.onchange = function() {
    //delete last parent mesh before loading new one
    scene.getMeshByName("__root__").dispose()

    myMesh = BABYLON.SceneLoader.ImportMesh("", "assets/", document.getElementById("syndrome").value + ".glb", scene, function (meshes) {
    
        myInfluence = scene.getMeshByName(document.getElementById("syndrome").value).morphTargetManager.getTarget(0);

        document.getElementById("ageSlider").min = parseInt(myInfluence.name.split("_")[1])
        document.getElementById("ageSlider").max = parseInt(myInfluence.name.split("_")[2])
        document.getElementById("ageSlider").value = (parseInt(myInfluence.name.split("_")[1]) + parseInt(myInfluence.name.split("_")[2]) /2)

        myInfluence.influence = document.getElementById("ageSlider").value/100

    }) //end loader

}

var selectedSyndrome2 = document.getElementById("referenceComp");

selectedSyndrome2.onchange = function() {
    //delete last parent mesh before loading new one
    if(comparisonScene.meshes.length > 0) comparisonScene.getMeshByName("__root__").dispose()
    if(comparisonScene.meshes.length > 0) comparisonScene.getMeshByName("__root__").dispose()

    refMesh = BABYLON.SceneLoader.ImportMesh("", "assets/", document.getElementById("referenceComp").value + ".glb", comparisonScene, function (meshes) {
    
        refInfluence = comparisonScene.getMeshByName(document.getElementById("referenceComp").value).morphTargetManager.getTarget(0);

        document.getElementById("compAgeSlider").min = parseInt(refInfluence.name.split("_")[1])
        document.getElementById("compAgeSlider").max = parseInt(refInfluence.name.split("_")[2])
        document.getElementById("compAgeSlider").value = (parseInt(refInfluence.name.split("_")[1]) + parseInt(refInfluence.name.split("_")[2]) /2)

        //set influence starting value to reset slider
        refInfluence.influence = document.getElementById("compAgeSlider").value/100

    }) //end loader


    compMesh = BABYLON.SceneLoader.ImportMesh("", "assets/", document.getElementById("syndromeComp").value + ".glb", comparisonScene, function (meshes) {
    
        comparisonScene.getMeshByName(document.getElementById("syndromeComp").value).setEnabled(false) //need to call by id, otherwise I'm disable scene when ref === comp
    
    compInfluence = comparisonScene.getMeshByName(document.getElementById("syndromeComp").value).morphTargetManager.getTarget(0);

}) //end loader




    // for (var i = 0; i < document.getElementById("referenceComp").options.length; i++) {
    //     comparisonScene.getMeshByName(document.getElementById("referenceComp").options[i].value).setEnabled(false)
    // }

    // if(comparisonScene.getMeshByName("Achondroplasia") !== null){
    //     comparisonScene.getMeshByName(document.getElementById("referenceComp").value).setEnabled(true)
    //     myInfluence2 = comparisonScene.getMeshByName(document.getElementById("referenceComp").value).morphTargetManager.getTarget(0);
    // }
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
    refInfluence.influence = tmpValue/100;
    compInfluence.influence = tmpValue/100;
    
    if(document.getElementById("Comparisons-tab").className === 'nav-link active show') {
        updateHeatmap(tmpValue);
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

        engine2.resize();
        // network.fit("network");


}

var rangeSlider = function(){
    var slider = $('.range-slider'),
        range = $('.range-slider__range'),
        value = $('.range-slider__value');
      
    slider.each(function(){
  
      value.each(function(){
        var value = $(this).prev().attr('value');
        $(this).html(value  + ' y/o');
      });
  
      range.on('input', function(){
        $(this).next(value).html(this.value + ' y/o');
      });
    });
  };

  rangeSlider();
  

// Set some startup values
document.getElementById("syndrome").value =  "Achondroplasia"
document.getElementById("referenceComp").value = "Achondroplasia"
document.getElementById("syndromeComp").value = "Nager Syndrome"
document.getElementById("Gestalts-tab").className = 'nav-link show active'

changeWell('gestaltContainer')


// Default mesh loading
myMesh = BABYLON.SceneLoader.ImportMesh("", "assets/", document.getElementById("syndrome").value + ".glb", scene, function (meshes) {
    
    myInfluence = scene.getMeshByName(document.getElementById("syndrome").value).morphTargetManager.getTarget(0);
}) //end loader

// refMesh = BABYLON.SceneLoader.ImportMesh("", "assets/", document.getElementById("referenceComp").value + ".glb", comparisonScene, function (meshes) {
    
//     refInfluence = comparisonScene.getMeshByName(document.getElementById("referenceComp").value).morphTargetManager.getTarget(0);
// }) //end loader

// compMesh = BABYLON.SceneLoader.ImportMesh("", "assets/", document.getElementById("syndromeComp").value + ".glb", comparisonScene, function (meshes) {
    
//     //comparisonScene.getMeshByName(document.getElementById("syndromeComp")).setEnabled(false)

// compInfluence = comparisonScene.getMeshByName(document.getElementById("syndromeComp").value).morphTargetManager.getTarget(0);

// }) //end loader

engine2.resize(); //resize comp window...maybe save for when it's rendered?
engine1.resize(); //resize comp window...maybe save for when it's rendered?
