function changeWell(divName){

    if(divName === 'gestaltContainer'){
        document.getElementById("gestaltContainer").style.display = ""
        document.getElementById("comparisonContainer").style.display = "none"
        document.getElementById("submissionContainer").style.display = "none"
        document.getElementById("aboutContainer").style.display = "none"
        }

    if(divName === 'comparisonContainer'){
        document.getElementById("gestaltContainer").style.display = "none"
        document.getElementById("comparisonContainer").style.display = ""
        document.getElementById("submissionContainer").style.display = "none"    
        document.getElementById("aboutContainer").style.display = "none"
        }

    if(divName === 'submissionContainer'){
        document.getElementById("gestaltContainer").style.display = "none"
        document.getElementById("comparisonContainer").style.display = "none"
        document.getElementById("submissionContainer").style.display = ""
        document.getElementById("aboutContainer").style.display = "none"
        }      

    if(divName === 'aboutContainer'){
        document.getElementById("gestaltContainer").style.display = "none"
        document.getElementById("comparisonContainer").style.display = "none"
        document.getElementById("submissionContainer").style.display = "none"
        document.getElementById("aboutContainer").style.display = ""
        }  
}

// Set some startup values
document.getElementById("syndrome").value =  "Achondroplasia"
document.getElementById("sexSlider").value = 0
document.getElementById("sevSlider").value = 0
document.getElementById("referenceComp").value = "Non-syndromic"
document.getElementById("syndromeComp").value = " "
document.getElementById("submissionComp").value = " "
document.getElementById("ageInput").value = "12"
document.getElementById("texture").value = "./syndromeModelTextures/genericWhiteTexture1.jpg"
document.getElementById("Gestalts-tab").className = 'nav-link show active'

changeWell('gestaltContainer')

// Default GESTALT mesh loading
myMesh = BABYLON.SceneLoader.ImportMesh("", "./assets/", document.getElementById("syndrome").value + ".glb", scene, function (meshes) {
    
    myInfluence = scene.getMeshByName(document.getElementById("syndrome").value).morphTargetManager.getTarget(1);

    document.getElementById("ageSlider").min = parseInt(myInfluence.name.split("_")[1])
    document.getElementById("ageSlider").max = parseInt(myInfluence.name.split("_")[2])
    document.getElementById("ageSlider").value = (parseInt(myInfluence.name.split("_")[1]) + parseInt(myInfluence.name.split("_")[2]) /2)
    document.getElementById("ageSliderLabel").innerHTML = document.getElementById("ageSlider").value + " y/o"

    myInfluence.influence = document.getElementById("ageSlider").value/100

    sevInfluence = scene.getMeshByName(document.getElementById("syndrome").value).morphTargetManager.getTarget(0);
    document.getElementById("sevSlider").max = parseFloat(sevInfluence.name.split("_")[1]) * 700
    document.getElementById("sevSlider").min = -parseFloat(sevInfluence.name.split("_")[1]) * 700

    // genericTexture = scene.getMeshByName(document.getElementById("syndrome").value).getVerticesData(BABYLON.VertexBuffer.ColorKind)

}) //end loader

// engine2.resize(); //resize comp window...maybe save for when it's rendered?
//create dynamic rane sliders
var rangeSlider = function(){
    var slider = $('.range-slider'),
        range = $('.range-slider__range'),
        value = $('.range-slider__value');
      
    slider.each(function(){
  
      value.each(function(){
        var value = $(this).prev().attr('value');
        $(this).html(value + " y/o");
      });
  
      range.on('input', function(){
        $(this).next(value).html(this.value + " y/o");
      });
    });
  };

  rangeSlider();

  var rangeSlider2 = function(){
    var slider = $('.range-slider2'),
    range = $('.range-slider__range2'),
    value = $('.range-slider__value2');
  };

  rangeSlider2();
  