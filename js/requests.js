http://127.0.0.1:7181/similarity_scores?reference=Unaffected%20Unrelated&synd_comp=Costello%20Syndrome&facial_subregion=1

function getScores(){
// //Vanilla
// var httpRequest = new XMLHttpRequest()
// httpRequest.onreadystatechange = function (data) {
//   // code
// }
// httpRequest.open('GET', 'http://127.0.0.1:7181/similarity_scores?reference=Unaffected%20Unrelated&synd_comp=Costello%20Syndrome&facial_subregion=' + network.getSelectedNodes()[0])
// httpRequest.send()
// console.log(httpRequest.response)
// return(httpRequest.response)

fetch('http://127.0.0.1:3438/similarity_scores?reference=' + encodeURIComponent(document.getElementById("referenceComp").value) + '&synd_comp=' + document.getElementById("syndromeComp").value + '&facial_subregion=' + network.getSelectedNodes()[0])
  .then(response => response.json())
  .then(data => {
        console.log(data)
        console.log(data.subregion_scores[0].face_score)
        syndSimilarity = document.getElementById('similarityScores');

        subregionScores = [];
        wholefaceScores = [];
        syndNames = [];

        for(var i = 0; i < data.subregion_scores.length; i++) {
        subregionScores.push(data.subregion_scores[i].face_score)
        wholefaceScores.push(data.wholeface_scores[i].face_score)
        if(i < 5 | i > 85){
          syndNames.push(data.subregion_scores[i].Syndrome)
        } else {
          syndNames.push(" ")
        }
        }

        //figure out 5 biggest/smallest subregion scores and annotate
        var scoreData = [{
            x: subregionScores,
            y: wholefaceScores,
            mode: 'markers+text',
            type: 'scatter',
            text: syndNames,
            textposition: 'top',
                    textfont: {
                        color: '#48298C',
                        size: 8
                    },
            marker: {
                color: '#48298C'
            }
        }]

        var layout = {
            margin: { t: 0 }, 
            autosize: true,
            xaxis: {
              range: [-.02, .11],
              zeroline: false,
              automargin: true,
              title: {
                text: 'Subregion scores',
                font: {
                  size: 15,
                  color: '#48298C'
                }
              },
            },
            yaxis: {
              automargin: true,
              title: {
                text: 'Face scores',
                font: {
                  size: 15,
                  color: '#48298C'
                }
              }
            }
          };

        Plotly.newPlot(syndSimilarity, scoreData, layout);
    });
}



var submittedSyndromeComp = document.getElementById("submissionComp");
submittedSyndromeComp.onchange = function() {
    //delete last parent mesh before loading new one
    if(submissionScene.meshes.length > 2) submissionScene.getMeshByName("__root__").dispose()
    
    //api call for person-specific gestalt
    fetch('http://127.0.0.1:3438/predshapeMesh?selected.sex=' + document.getElementById('submissionSex').value + '&selected.age=' + document.getElementById('ageInput').value + '&selected.synd=' + document.getElementById('submissionComp').value + '&selected.severity=Typical&type=stream')
        .then(function(body){
            return body.text(); // <--- THIS PART WAS MISSING
        })
        .then(data => {
            // console.log(data)
            BABYLON.SceneLoaderFlags.ShowLoadingScreen = false;
            var base64_model_content = "data:;base64," + data
            meshTest = BABYLON.SceneLoader.Append("", base64_model_content, submissionScene, function(){
                //update personal heatmap
                submissionScene.meshes[3].setEnabled(false) //need to call by id, otherwise I'm disable scene when ref === comp

                personalHeatmap();
            })
    })  
}

//api call for mesh on file input
// var submitMesh = document.getElementById("meshUpload");
registerMesh = () => {
    // console.log("click");
    //delete last parent mesh before loading new one
    if (submissionScene.meshes.length > 0)
        submissionScene.getMeshByName("__root__").dispose();

    //api call for person-specific gestalt
    fetch('http://127.0.0.1:3438/registerMesh')
        .then(function (body) {
            return body.text(); // <--- THIS PART WAS MISSING
        })
        .then(data => {
            // console.log(data);
            BABYLON.SceneLoaderFlags.ShowLoadingScreen = false;
            var base64_model_content = "data:;base64," + data;
            personalMesh = BABYLON.SceneLoader.Append("", base64_model_content, submissionScene, function(){
              
                //get classifier bar plot
                fetch('http://127.0.0.1:3438/classifyMesh?selected.sex=' + document.getElementById('submissionSex').value + '&selected.age=' + document.getElementById('ageInput').value)
                .then(function (body) {
                    return body.json(); // <--- THIS PART WAS MISSING
                })
                .then(data => {
                  console.log(data)
                  // console.log(data.length)
                  // console.log(data[0][0])
                   
                  probabilities = [];
                  syndNames = [];

                  for(var i = 0; i < data[0].length; i++) {
                  probabilities.push(data[0][i].Probs)
                  syndNames.push(data[0][i].Syndrome)
                  }

                  var scoreData = [{
                      x: syndNames,
                      y: probabilities,
                      type: 'bar',
                      marker: {
                        color: '#e5e5e5'
                      }
                  }]
            
                  var layout = {
                      margin: { 
                        t: 0
                       },
                       pad:{
                        r: 50
                       }, 
                      autosize: true,
                      xaxis:{
                        automargin: true,
                        tickfont: {
                          size:14,
                          color: '#48298C'}
                      },
                      yaxis: {
                        title: {
                          text: 'Posterior probability',
                          font: {
                            size: 14,
                            color: '#48298C'
                          }
                        }
                      }
                    };

                  Plotly.newPlot(hdrdaResult, scoreData, layout);

                  //get personal morphospace plot
                  personalScores = [];
                  personalScores2 = [];
                  personalSyndNames = [];

                  for(var i = 0; i < data[1].length; i++) {
                  personalScores.push(data[1][i].Scores1)
                  personalScores2.push(data[1][i].Scores2)
                  personalSyndNames.push(data[1][i].Syndrome)
                  }

                  markerColors = Array(89).fill('#48298C')
                  markerColors.splice(0, 0, "red")
                  
                  var scoreDataPersonal = [{
                    x: personalScores,
                    y: personalScores2,
                    mode: 'markers+text',
                    type: 'scatter',
                    text: personalSyndNames,
                    textposition: 'top',
                    textfont: {
                        color: markerColors,
                        size: 10
                    },
                    marker: {
                        color: markerColors,
                        size: 9
                    }
                }]
        
                var layout = {
                    margin: { t: 0 }, 
                    autosize: true,
                    xaxis: {
                      title: {
                        text: 'PC1 score',
                        font: {
                          size: 15,
                          color: '#48298C'
                        }
                      },
                    },
                    yaxis: {
                      automargin: true,
                      title: {
                        text: 'PC2 score',
                        font: {
                          size: 15,
                          color: '#48298C'
                        }
                      }
                    }
                  };
                Plotly.newPlot(personalMorphospace, scoreDataPersonal, layout);
                })
            });
        });

}



