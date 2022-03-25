function updateTexture(textureType) {
if(textureType === "lightgrey"){
    //new spotlight

    if(scene.lights[2] === undefined) var light3 = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0, -1, 0), scene);

    //define colors and push to mesh
    colors = [];
    for(var p = 0; p < scene.getMeshByName(document.getElementById("syndrome").value).getVerticesData(BABYLON.VertexBuffer.ColorKind).length; p++) {
        colors.push(211/255, 211/255, 211/255, 1);
    }
}

if(textureType === "generic1"){
    //define colors and push to mesh
    colors = genericTexture;
}

    return(scene.getMeshByName(document.getElementById("syndrome").value).setVerticesData(BABYLON.VertexBuffer.ColorKind, colors))

}
                    
                    


                   

    