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

fetch('http://127.0.0.1:7181/similarity_scores?reference=' + encodeURIComponent(document.getElementById("referenceComp").value) + '&synd_comp=' + document.getElementById("syndromeComp").value + '&facial_subregion=' + network.getSelectedNodes()[0])
  .then(response => response.json())
  .then(data => {
        console.log(data.subregion_scores.length)
        console.log(data.subregion_scores[0].face_score)
        syndSimilarity = document.getElementById('similarityScores');

        subregionScores = [];
        wholefaceScores = [];
        syndNames = [];

        for(var i = 0; i < data.subregion_scores.length; i++) {
        subregionScores.push(data.subregion_scores[i].face_score)
        wholefaceScores.push(data.wholeface_scores[i].face_score)
        syndNames.push(data.subregion_scores[i].Syndrome)
        }

        //figure out 5 biggest/smallest subregion scores and annotate

        var scoreData = [{
            x: subregionScores,
            y: wholefaceScores,
            mode: 'markers',
            type: 'scatter',
            text: syndNames,
            marker: {
                color: '#48298C'
            }
        }]

        var layout = {
            margin: { t: 0 }, 
            autosize: true,
            xaxis: {
              title: {
                text: 'Subregion scores',
                font: {
                  size: 15,
                  color: '#48298C'
                }
              },
            },
            yaxis: {
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