const submissionCanvas = document.getElementById("submissionCanvas"); // Get the canvas element
const submissionEngine = new BABYLON.Engine(submissionCanvas, true); // Generate the BABYLON 3D engine
                    
const createSubmissionScene = function () {
    
    const submissionScene = new BABYLON.Scene(submissionEngine);  
    submissionScene.useRightHandedSystem = false;
    
    // const axes = new BABYLON.AxesViewer(submissionScene, 70);

    submissionScene.clearColor = new BABYLON.Color4(0.988, 0.988, 0.988);
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI * .5, Math.PI * .5, 750, new BABYLON.Vector3(0, 15, 0));

    camera.attachControl(canvas, true);
    camera.fov = .75;
    camera.allowUpsideDown = false;
    camera.upperAlphaLimit = Math.PI;
    camera.lowerAlphaLimit = 0;
    camera.upperRadiusLimit = 450;
    camera.lowerRadiusLimit = 100;

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, 100));
    const light2 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(40, 40, 100));
    light.intensity = .3
    light2.intensity = .3
    
    return submissionScene;
};

const submissionScene = createSubmissionScene(); //Call the createScene function

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    submissionEngine.resize();
});

// Register a render loop to repeatedly render the submissionScene
submissionEngine.runRenderLoop(function () {
    submissionScene.getEngine().resize();
    submissionScene.render();
});

//load personal heatmap comparison mesh
// var selectedSyndromeComp = document.getElementById("syndromeComp");

// selectedSyndromeComp.onchange = function() {
   
//         // if(document.getElementById("Comparisons-tab").className === 'nav-link active') {
//         //     throttledHeatmap();
//         // } 
//     }) //end loader
  
// }

//personal heatmap
var personalHeatmap = document.getElementById("submissionComp");
personalHeatmap.onchange = function() {
    if(document.getElementById("Submitted-tab").className === 'nav-link active') {
        if(submissionScene.meshes.length > 1) submissionScene.getMeshByName('__root__').dispose()
    
        subCompMesh = BABYLON.SceneLoader.ImportMesh("", "./assets/", document.getElementById("submissionComp").value + ".glb", submissionScene, function (meshes) {
            compInfluence = submissionScene.getMeshByName(document.getElementById("submissionComp").value).morphTargetManager.getTarget(1);    
            ageInputValue = parseInt(document.getElementById("ageInput").value)
            //get age range
            minAge = parseInt(compInfluence.name.split("_")[1])
            maxAge = parseInt(compInfluence.name.split("_")[2])
            ageRange = maxAge - minAge
            //express influence relative to morphtarget range
            compInfluence.influence = (ageInputValue - minAge)/ageRange

            compSexInfluence = submissionScene.getMeshByName(document.getElementById("submissionComp").value).morphTargetManager.getTarget(2);    
            if(document.getElementById("submissionComp").value === "Female") compSexInfluence.influence = -2
            if(document.getElementById("submissionComp").value === "Male") compSexInfluence.influence = 2
            // submissionScene.getMeshByName(document.getElementById("submissionComp").value).setEnabled(false) //need to call by id, otherwise I'm disable scene when ref === comp
            updatePersonalHeatmap(refMesh = submissionScene.meshes[0], compMesh = meshes[1]);
        })//end loader
        
    } 
}


