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

//personal heatmap
var personalHeatmap = document.getElementById("submissionComp");
personalHeatmap.onchange = function() {
    if(document.getElementById("Submitted-tab").className === 'nav-link active') {
        updatePersonalHeatmap(submissionScene.meshes[1], submissionScene.meshes[3]);
    } 
}


