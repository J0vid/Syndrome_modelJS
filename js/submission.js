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

var submittedSyndromeComp = document.getElementById("submissionComp");
submittedSyndromeComp.onchange = function() {
    //delete last parent mesh before loading new one
    if(submissionScene.meshes.length > 2) submissionScene.getMeshByName("__root__").dispose()
    
    //api call for person-specific gestalt
    fetch('http://127.0.0.1:7181/predshapeMeshGLB?selected.sex=' + document.getElementById('submissionSex').value + '&selected.age=' + document.getElementById('ageInput').value + '&selected.synd=' + document.getElementById('submissionComp').value + '&selected.severity=Typical')
        .then(function(body){
            return body.text(); // <--- THIS PART WAS MISSING
        })
        .then(data => {
            
            BABYLON.SceneLoaderFlags.ShowLoadingScreen = false;
            var base64_model_content = "data:;base64," + data
            meshTest = BABYLON.SceneLoader.Append("", base64_model_content, submissionScene)

    })
    
}

//api call for mesh on file input



//plotly syndrome bar plot

//plotly personal morphospace