function showScores(){
    if(scene.getMeshByName("brow_plane") === null){
        let positions =  scene.getMeshByName("Achondroplasia_1_gestalt(1)").getVerticesData(BABYLON.VertexBuffer.PositionKind) //scene.meshes[1].getVerticesData(BABYLON.VertexBuffer.PositionKind);

        createScore("brow", "1", 281, positions, -44, 50, -15)
        createScore("nose", "2", 281, positions, -44, -5, 0);
        createScore("chin", "2", 281, positions, -44, -80, -10);
        createScore("cheek_l", "2", 281, positions, -95, -5, -40);
        createScore("cheek_r", "2", 281, positions, 10, -5, -40);
        createScore("jaw_l", "4", 281, positions, -100, -75, -75);
        createScore("jaw_r", "4", 281, positions, 10, -75, -75);
    }

    if(document.getElementById("scoreCheck").checked === false) {
        if(scene.getMeshByName("brow_plane") !== null){
            scene.getMeshByName("brow_plane").dispose()
            scene.getMeshByName("nose_plane").dispose()
            scene.getMeshByName("chin_plane").dispose()
            scene.getMeshByName("cheek_l_plane").dispose()
            scene.getMeshByName("cheek_r_plane").dispose()
            scene.getMeshByName("jaw_l_plane").dispose()
            scene.getMeshByName("jaw_r_plane").dispose()
        }
        }
}

function createScore(name, label, position, positions, xOffset, yOffset, zOffset) {
    const fontSize = 700;
    const fontColor = "#e73030";
    const fontFace = "bold";

    let plane = BABYLON.Mesh.CreatePlane(name + "_plane", 35, scene);
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    plane.position.x = xOffset + positions[position * 3 - 3];
    plane.position.y = yOffset + -1 * positions[position * 3 - 1];
    plane.position.z = zOffset + positions[position * 3 - 2];

    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane);
                var score = BABYLON.GUI.Button.CreateSimpleButton(name, label);
                score.color = fontColor;
                score.fontSize = fontSize;
                score.fontFamily = fontFace;
                advancedTexture.addControl(score); 
}

function updateScore(subregion, tmpValue){
    plane = scene.getMeshByName(subregion)
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane);
    var score = BABYLON.GUI.Button.CreateSimpleButton(subregion, Math.floor(tmpValue/10));
    score.color = "red";
    score.fontSize = 700;
    score.fontFamily = "bold";
    advancedTexture.addControl(score);
}

function femininityScore(subregion){
    
    xyz = [];
    for(var p = 0; p <= noseLM.length; p++) {
    xyz.push([(noseLM[p] * 3) - 3, (noseLM[p] * 3) - 2, (noseLM[p] * 3) - 1])
    }

    xyzFlattened = [].concat.apply([],xyz);
    
    // get current vertex values for the subregion
    currentInfluence = scene.getMeshByName("Achondroplasia_1_gestalt(1)").morphTargetManager.getTarget(0)._positions;;
    
    subregionVertices = [];
    for(var p = 0; p <= models.length; p++) {
        subregionVertices.push(currentInfluence[xyzFlattened[p]])
        }

    //subtract from mean

    //normalize coefficient vector
    let coefSum = 0;

    for (let i = 0; i < models.length; i++) {
        coefSum += models[i] ** 2;
    }

    normalizedModels = [];
    for(var p = 0; p <= models.length; p++) {
    normalizedModels.push(models[p]/Math.sqrt(coefSum))
    }
    
    //project residuals on vector
    finalScore = multiplyMatrices(subregionVertices, transpose(normalizedModels))

    //scale to sample data values



    // S <- get(paste0(model.suite[i]))
    // Snorm <- S/sqrt(sum(S^2))
    // scores[i] <- residuals2d %*% Snorm
    // models



}

let matrixProd = (A, B) =>
  A.map((row, i) =>
    B[0].map((_, j) =>
      row.reduce((acc, _, n) =>
        acc + A[i][n] * B[n][j], 0
      )
    )
  )
 
function transpose(matrix) {
    return matrix.reduce((prev, next) => next.map((item, i) =>
      (prev[i] || []).concat(next[i])
    ), []);
  }
  
