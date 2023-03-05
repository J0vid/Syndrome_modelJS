function updateTexture(textureType) {
    if(textureType !== "lightgrey"){
        if(scene.meshes[1].material.getClassName() == "StandardMaterial"){
            scene.meshes[1].material = origPBR
        }
       
        //define material and push to mesh
        generic = new BABYLON.PBRMaterial("gen2", scene);
        // https://forum.babylonjs.com/t/wrong-texture-tiling-when-feeding-texture-inside-texture-block-via-code/36602/3
        generic.albedoTexture = new BABYLON.Texture(textureType, scene, undefined, false);
        scene.meshes[1].material.albedoTexture = generic.albedoTexture
        // scene.meshes[1].material = generic
    }
    
    if(textureType === "lightgrey"){
    //new spotlight

    // if(scene.lights[2] === undefined) var light3 = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0, -1, 0), scene);

    //define colors and push to mesh
    // colors = [];
    // for(var p = 0; p < scene.getMeshByName(document.getElementById("syndrome").value).getVerticesData(BABYLON.VertexBuffer.PositionKind).length; p++) {
    //     colors.push(211/255, 211/255, 211/255, 1);
    // }
    // scene.getMeshByName(document.getElementById("syndrome").value).setVerticesData(BABYLON.VertexBuffer.ColorKind, colors)
    greyMat = new BABYLON.StandardMaterial("greyMat", scene, undefined, false)
    greyMat.diffuseColor =  BABYLON.Color3.FromHexString("#b0b0b0").toLinearSpace()
    greyMat.specularColor = BABYLON.Color3.FromHexString("#000000").toLinearSpace()
    origPBR = scene.meshes[1].material
    scene.meshes[1].material = greyMat
}
    return(null)
}
                    
                    


                   

    