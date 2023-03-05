
const canvas = document.getElementById("renderCanvas"); // Get the canvas element

const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
                    
const createScene = function () {
    
    const scene = new BABYLON.Scene(engine);  
    scene.useRightHandedSystem = false;
    
    // const axes = new BABYLON.AxesViewer(scene, 70);

    scene.clearColor = new BABYLON.Color4(0.988, 0.988, 0.988);
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI * .5, Math.PI * .5, 750, new BABYLON.Vector3(0, 15, 0));

    camera.attachControl(canvas, true);
    camera.fov = .75;
    camera.allowUpsideDown = false;
    camera.upperAlphaLimit = Math.PI;
    camera.lowerAlphaLimit = 0;
    camera.upperRadiusLimit = 450;
    camera.lowerRadiusLimit = 100;

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, 100));
    const light2 = new BABYLON.PointLight("light", new BABYLON.Vector3(40, 40, 100));
    
    // light2.diffuse = new BABYLON.Color3(1, 0, 0);
	// light2.specular = new BABYLON.Color3(0, 1, 0);
    return scene;
};

const scene = createScene(); //Call the createScene function

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
        engine.resize();
        engine2.resize();
});

// window.onresize = function() {network.fit();}

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    scene.getEngine().resize();
    scene.render();
});

// Define GESTALT selected morphtarget
var selectedSyndrome = document.getElementById("syndrome");
selectedSyndrome.onchange = function() {
    //delete last parent mesh before loading new one
    scene.getMeshByName("__root__").dispose()

    myMesh = BABYLON.SceneLoader.ImportMesh("", "./assets/", document.getElementById("syndrome").value + ".glb", scene, function (meshes) {
        
        //set age range and value upon imported mesh
        myInfluence = scene.getMeshByName(document.getElementById("syndrome").value).morphTargetManager.getTarget(1);

        document.getElementById("ageSlider").min = parseInt(myInfluence.name.split("_")[1])
        document.getElementById("ageSlider").max = parseInt(myInfluence.name.split("_")[2])
        document.getElementById("ageSlider").value = (parseInt(myInfluence.name.split("_")[1]) + parseInt(myInfluence.name.split("_")[2]) /2)
        document.getElementById("ageSliderLabel").innerHTML = document.getElementById("ageSlider").value + " y/o"

        myInfluence.influence = document.getElementById("ageSlider").value/100

        //reset masculinity slider for imported mesh
        document.getElementById("sexSlider").value = 0
        
        //reset & scale severity slider for imported mesh
        sevInfluence = scene.getMeshByName(document.getElementById("syndrome").value).morphTargetManager.getTarget(0);
        document.getElementById("sevSlider").max = parseFloat(sevInfluence.name.split("_")[1]) * 700
        document.getElementById("sevSlider").min = -parseFloat(sevInfluence.name.split("_")[1]) * 700
        document.getElementById("sevSlider").value = 0

        //set texture to currently selected value
        updateTexture(document.getElementById("texture").value);

        //apply supplementary texture to imported mesh
        // genericTexture = scene.getMeshByName(document.getElementById("syndrome").value).getVerticesData(BABYLON.VertexBuffer.ColorKind)
        // var mat = new BABYLON.PBRMaterial("skin", scene);
        // meshes[1].material.albedoTexture = new BABYLON.Texture("./syndromeModelTextures/genericBlackTexture1.jpg", scene);
        // mat.metallicTexture = new BABYLON.Texture("./syndromeModelTextures/UV_gloss_reg.jpg", scene);
        // mat.bumpTexture = new BABYLON.Texture("./syndromeModelTextures/UV_normal_reg2.jpg", scene);
        // meshes[1].material.microSurfaceTexture = new BABYLON.Texture("./syndromeModelTextures/Micro_Normal.jpg", scene);

        // meshes[1].material = mat

        // meshes[1].material.microSurfaceTexture.vScale = .1
        // meshes[1].material.microSurfaceTexture.uScale = .1


    }) //end loader   
}

//define selected texture
var selectedTexture = document.getElementById("texture");
selectedTexture.onchange = function() {
    updateTexture(selectedTexture.value);
}

// Define gestalt slider logic here because it impacts the morphtarget, the heatmap, and the scores
var slider = document.getElementById("ageSlider");
slider.oninput = function() {
    tmpValue = this.value
    myInfluence.influence = tmpValue/100;
}

var sliderSex = document.getElementById("sexSlider");
sliderSex.oninput = function() {
    tmpValue = this.value
    scene.getMeshByName(document.getElementById("syndrome").value).morphTargetManager.getTarget(2).influence = tmpValue/15;
}

var sliderSev = document.getElementById("sevSlider");
sliderSev.oninput = function() {
    tmpValue = this.value
    scene.getMeshByName(document.getElementById("syndrome").value).morphTargetManager.getTarget(0).influence = tmpValue/30;
}
