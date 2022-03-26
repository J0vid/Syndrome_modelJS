const submissionCanvas = document.getElementById("submissionCanvas"); // Get the canvas element

const submissionEngine = new BABYLON.Engine(submissionCanvas, true); // Generate the BABYLON 3D engine
                    
const createSubmissionScene = function () {
    
    const submissionScene = new BABYLON.Scene(submissionEngine);  
    submissionScene.useRightHandedSystem = false;
    
    const axes = new BABYLON.AxesViewer(submissionScene, 70);

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

//load defult mesh for the moment
// submittedMesh = BABYLON.SceneLoader.ImportMesh("", "./assets/", "jovid.glb", submissionScene)

    // var base64_model_content = "data:;base64,Z2xURgIAAAD4CAAAlAUAAEpTT057ImFjY2Vzc29ycyI6W3sibmFtZSI6IjJmdHg0ZnRfMV9wb3NpdGlvbnMiLCJjb21wb25lbnRUeXBlIjo1MTI2LCJjb3VudCI6MjQsIm1pbiI6Wy0yNCwwLC0xMl0sIm1heCI6WzI0LDIsMTJdLCJ0eXBlIjoiVkVDMyIsImJ1ZmZlclZpZXciOjAsImJ5dGVPZmZzZXQiOjB9LHsibmFtZSI6IjJmdHg0ZnRfMV9ub3JtYWxzIiwiY29tcG9uZW50VHlwZSI6NTEyNiwiY291bnQiOjI0LCJtaW4iOlstMSwtMSwtMV0sIm1heCI6WzEsMSwxXSwidHlwZSI6IlZFQzMiLCJidWZmZXJWaWV3IjowLCJieXRlT2Zmc2V0IjoyODh9LHsibmFtZSI6IjJmdHg0ZnRfMV90ZXhjb29yZHMiLCJjb21wb25lbnRUeXBlIjo1MTI2LCJjb3VudCI6MjQsIm1pbiI6Wy0xLjM0MDcwMDAzMDMyNjg0MzMsLTEuNjgxMzk5OTQxNDQ0Mzk3XSwibWF4IjpbNS4zNjI4MDAxMjEzMDczNzMsMy42ODE0MDAwNjA2NTM2ODY1XSwidHlwZSI6IlZFQzIiLCJidWZmZXJWaWV3IjoxLCJieXRlT2Zmc2V0IjowfSx7Im5hbWUiOiIyZnR4NGZ0XzFfMF9pbmRpY2VzIiwiY29tcG9uZW50VHlwZSI6NTEyMywiY291bnQiOjM2LCJtaW4iOlswXSwibWF4IjpbMjNdLCJ0eXBlIjoiU0NBTEFSIiwiYnVmZmVyVmlldyI6MiwiYnl0ZU9mZnNldCI6MH1dLCJhc3NldCI6eyJnZW5lcmF0b3IiOiJvYmoyZ2x0ZiIsInZlcnNpb24iOiIyLjAifSwiYnVmZmVycyI6W3sibmFtZSI6ImlucHV0IiwiYnl0ZUxlbmd0aCI6ODQwfV0sImJ1ZmZlclZpZXdzIjpbeyJuYW1lIjoiYnVmZmVyVmlld18wIiwiYnVmZmVyIjowLCJieXRlTGVuZ3RoIjo1NzYsImJ5dGVPZmZzZXQiOjAsImJ5dGVTdHJpZGUiOjEyLCJ0YXJnZXQiOjM0OTYyfSx7Im5hbWUiOiJidWZmZXJWaWV3XzEiLCJidWZmZXIiOjAsImJ5dGVMZW5ndGgiOjE5MiwiYnl0ZU9mZnNldCI6NTc2LCJieXRlU3RyaWRlIjo4LCJ0YXJnZXQiOjM0OTYyfSx7Im5hbWUiOiJidWZmZXJWaWV3XzIiLCJidWZmZXIiOjAsImJ5dGVMZW5ndGgiOjcyLCJieXRlT2Zmc2V0Ijo3NjgsInRhcmdldCI6MzQ5NjN9XSwibWF0ZXJpYWxzIjpbeyJuYW1lIjoid2lyZV8xOTExOTExOTEiLCJwYnJNZXRhbGxpY1JvdWdobmVzcyI6eyJiYXNlQ29sb3JGYWN0b3IiOlswLjUsMC41LDAuNSwxXSwibWV0YWxsaWNGYWN0b3IiOjAsInJvdWdobmVzc0ZhY3RvciI6MX0sImVtaXNzaXZlRmFjdG9yIjpbMCwwLDBdLCJhbHBoYU1vZGUiOiJPUEFRVUUiLCJkb3VibGVTaWRlZCI6ZmFsc2V9XSwibWVzaGVzIjpbeyJuYW1lIjoiMmZ0eDRmdF8xIiwicHJpbWl0aXZlcyI6W3siYXR0cmlidXRlcyI6eyJQT1NJVElPTiI6MCwiTk9STUFMIjoxLCJURVhDT09SRF8wIjoyfSwiaW5kaWNlcyI6MywibWF0ZXJpYWwiOjAsIm1vZGUiOjR9XX1dLCJub2RlcyI6W3sibmFtZSI6IjJmdHg0ZnQiLCJtZXNoIjowfV0sInNjZW5lIjowLCJzY2VuZXMiOlt7Im5vZGVzIjpbMF19XX1IAwAAQklOAAAAwMEAAACAAABAQQAAwMEAAABAAABAwQAAwMEAAAAAAABAwQAAwMEAAABAAABAQQAAwMEAAAAAAABAwQAAwEEAAABAAABAwQAAwEEAAAAAAABAwQAAwMEAAABAAABAwQAAwEEAAAAAAABAwQAAwEEAAABAAABAQQAAwEEAAACAAABAQQAAwEEAAABAAABAwQAAwEEAAACAAABAQQAAwMEAAABAAABAQQAAwMEAAACAAABAQQAAwEEAAABAAABAQQAAwEEAAABAAABAQQAAwMEAAABAAABAwQAAwMEAAABAAABAQQAAwEEAAABAAABAwQAAwEEAAACAAABAQQAAwMEAAAAAAABAwQAAwEEAAAAAAABAwQAAwMEAAACAAABAQQAAgL8AAAAAAAAAgAAAgL8AAAAAAAAAgAAAgL8AAAAAAAAAgAAAgL8AAAAAAAAAgAAAAIAAAIC/AAAAgAAAAIAAAIC/AAAAgAAAAIAAAIC/AAAAgAAAAIAAAIC/AAAAgAAAgD8AAACAAAAAgAAAgD8AAACAAAAAgAAAgD8AAACAAAAAgAAAgD8AAACAAAAAgAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPw+cK0AAAIA/AAAAALTIRj8AAAAAAACAPw+cK0C0yEY/D5yrQAAAgD8AAAAAtMhGPwAAAAAAAIA/D5yrQLTIRj8PnCtAAACAPwAAAIC0yEY/AAAAgAAAgD8PnCtAtMhGPw+cq0AAAIA/AAAAALTIRj8AAAAAAACAPw+cq0C0yEY/D5yrPx04178PnKu/D5xrQA+cqz8PnGtAD5yrvx04178Xt9E4HTjXv7KdK0APnGtAsp0rQB04178Xt9E4D5xrQAAAAQACAAEAAAADAAQABQAGAAUABAAHAAgACQAKAAkACAALAAwADQAOAA0ADAAPABAAEQASABEAEAATABQAFQAWABUAFAAXAA==";
//    console.log(base64_model_content)
    // BABYLON.SceneLoader.Append("", base64_model_content, submissionScene);

submissionScene.ShowLoadingScreen = false;
fetch('http://127.0.0.1:7181/predshapeMeshGLB?selected.sex=Female&selected.age=12&selected.synd=Achondroplasia&selected.severity=Typical')
    .then(function(body){
        return body.text(); // <--- THIS PART WAS MISSING
    })
    .then(data => {
        console.log("data:;base64," + data)
        var base64_model_content = "data:;base64," + data
        meshTest = BABYLON.SceneLoader.Append("", base64_model_content, submissionScene)

  })
//api call for mesh on file input

//api call for person-specific gestalt

//plotly syndrome bar plot

//plotly personal morphospace