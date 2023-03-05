library(plumber)
library(future)
library(Jovid)
library(dplyr)
library(promises)
library(Morpho)
library(Rvcg)
library(sparsediscrim)
library(RvtkStatismo)
library(mesheR)
future::plan("multicore")

#set CORS parameters####
#* @filter cors
cors <- function(res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
  res$setHeader("Access-Control-Allow-Credentials", "true")
  plumber::forward()
}


# setwd("~/shiny/shinyapps/Syndrome_modelJS/")
# atlas2 <- file2mesh("~/whoami3.ply", readcol = T)

# save(atlas, d.meta.combined, front.face, PC.eigenvectors, synd.lm.coefs, synd.mshape, PC.scores, synd.mat, file = "data.Rdata")
load("/srv/shiny-server/API/data.Rdata")

load("/srv/shiny-server/API/modules_400PCs.Rdata")
eye.index <- as.numeric(read.csv("/srv/shiny-server/API/eye_small.csv", header = F)) +1 # eye.index <- as.numeric(read.csv("~/Desktop/eye_lms.csv", header = F)) +1

# load("texture_300PCs.Rdata")
# texture.coefs <- lm(texture.pca$x[,1:300] ~ d.meta.combined$Sex + d.meta.combined$Age + d.meta.combined$Age^2 + d.meta.combined$Age^3 + d.meta.combined$Syndrome + d.meta.combined$Age:d.meta.combined$Syndrome)$coef
# texture.pcs <-  texture.pca$rotation[,1:300]
# texture.mean <- texture.pca$center

tmp.mesh <- atlas
# synd.mshape <- d.registered$mshape

d.meta.combined$Sex <- as.numeric(d.meta.combined$Sex == "F")
d.meta.combined$Syndrome <- factor(d.meta.combined$Syndrome, levels = unique(d.meta.combined$Syndrome))

num_pcs <- 200
PC.eigenvectors <- PC.eigenvectors[,1:num_pcs]
PC.scores <- PC.scores[,1:num_pcs]
meta.lm <- lm(PC.scores[,1:num_pcs] ~ d.meta.combined$Sex + d.meta.combined$Age + d.meta.combined$Age^2 + d.meta.combined$Age^3 + d.meta.combined$Syndrome + d.meta.combined$Age:d.meta.combined$Syndrome)
synd.lm.coefs <- meta.lm$coefficients

#initialize ssm variables

atlas <- file2mesh("/srv/shiny-server/morf/data/atlas.ply")
atlas.lms <- read.mpp("/srv/shiny-server/morf/data/atlas_picked_points.pp")

# Kernels <- IsoKernel(0.1,atlas)
# mymod <- statismoModelFromRepresenter(atlas, kernel = Kernels, ncomp = 100)
# save(mymod, Kernels, file = "API/statismoStarter.Rdata")
load("/srv/shiny-server/API/statismoStarter.Rdata")

#calculations at startup that should make it into the startup file
hdrda.df <- data.frame(synd = d.meta.combined$Syndrome, PC.scores[,1:200])
hdrda.mod <- rda_high_dim(synd ~ ., data = hdrda.df)

predshape.lm <- function(fit, datamod, PC, mshape){
  dims <- dim(mshape)
  mat <- model.matrix(datamod)
  pred <- mat %*% fit

  predPC <- (PC %*% t(pred))
  out <- mshape + matrix(predPC, dims[1], dims[2], byrow = F)

  return(out * 1e10)
}

predPC.lm <- function(fit, datamod){
  mat <- model.matrix(datamod)
  pred <- mat %*% fit

  return(pred * 1e10)
}

predtexture.lm <- function(fit, datamod, PC, mshape, gestalt_combo = NULL){
  dims <- dim(mshape)
  mat <- model.matrix(datamod)
  pred <- mat %*% fit
  names <- as.matrix(model.frame(datamod))
  names <- apply(names, 1, paste, collapse = "_")
  names <- gsub(" ", "", names)
  predPC <- t(PC %*% t(pred))
  out <- mshape + predPC

  predicted.texture3d <- row2array3d(out)[,,1]

  if(is.null(gestalt_combo) == F){
    final.texture <-  3*(predicted.texture3d) + t(col2rgb(atlas$material$color))
  } else {final.texture <- predicted.texture3d}

  #scale values
  maxs <- apply(final.texture, 2, max)
  mins <- apply(final.texture, 2, min)
  additive.texture <- scale(final.texture, center = mins, scale = maxs - mins)
  # hex.mean <- rgb(additive.texture, maxColorValue = 1)

  return(additive.texture)
}

rotationM <- function(mat, thetaX, thetaY, thetaZ){
  rotationX <- matrix(c(1,0,0,0,cos(thetaX), -sin(thetaX), 0,sin(thetaX), cos(thetaX)), ncol = 3, byrow = T)
  rotationY <- matrix(c(cos(thetaY),0,sin(thetaY),0,1,0,-sin(thetaY),0,cos(thetaY)), ncol = 3, byrow = T)
  rotationZ <- matrix(c(cos(thetaZ),-sin(thetaZ),0,sin(thetaZ),cos(thetaZ),0,0,0,1), ncol = 3, byrow = T)
  
  mat %*% rotationX %*% rotationY %*% rotationZ
}

#* @apiTitle Syndrome model API

#* Health check
#* @get /
#* @serializer unboxedJSON
function() {
  list(status = "OK")
}

#* generate atlasPC scores for each syndrome at a given age & sex
#* @param selected.sex predicted sex effect
#* @param selected.age predicted age effect
#* @param selected.synd predicted syndrome effect
#* @get /predPC
function(selected.sex = "Female", selected.age = 12, selected.synd = "Achondroplasia") {
  # selected.synd <- factor(selected.synd, levels = levels(d.meta.combined$Syndrome))
  if(selected.sex == "Female"){selected.sex <-1
  } else if(selected.sex == "Male"){selected.sex <- 0} 
  selected.age <- as.numeric(selected.age)
  
  predicted.shape <- matrix(NA, nrow = length(unique(d.meta.combined$Syndrome)), ncol = 2)
  future_promise({
    for(i in 1:nrow(predicted.shape)){
      selected.synd <- factor(levels(d.meta.combined$Syndrome)[i], levels = levels(d.meta.combined$Syndrome))
      datamod <- ~ selected.sex + selected.age + selected.age^2 + selected.age^3 + selected.synd + selected.age:selected.synd
      predicted.shape[i,] <- predPC.lm(synd.lm.coefs, datamod)[1:2]
    }
    predicted.shape
  })
}

#* get similarity scores for whole face and selected subregion
#* @param reference reference syndrome
#* @param synd_comp compared syndrome
#* @param facial_subset what part of the face to analyze
#* @get /similarity_scores
function(reference = "Unaffected Unrelated", synd_comp = "Costello Syndrome", facial_subregion = 1){
  
  selected.synd <- factor(synd_comp, levels = levels(d.meta.combined$Syndrome))

  # future_promise({

    #calculate syndrome severity scores for selected syndrome
    #calculate score for the whole face
    S <- synd.lm.coefs[grepl(pattern = synd_comp, rownames(synd.lm.coefs)),][1,]
    Snorm <- S/sqrt(sum(S^2))
    syndscores.main <- PC.scores %*% Snorm
    
    syndscores.df <- data.frame(Syndrome = d.meta.combined$Syndrome, face.score = syndscores.main)
    syndscores.wholeface <- syndscores.df%>%
      group_by(Syndrome) %>%
      summarise(face_score = mean(face.score))
    
    # calculate score for the selected subregion
    if(is.null(facial_subregion)) selected.node <- 1 else if(facial_subregion == 1){
      selected.node <- 1} else{
        selected.node <- as.numeric(facial_subregion)}
    
    if(selected.node > 1){
      node.code <- c("posterior_mandible" = 2, "nose" = 3,"anterior_mandible" = 4, "brow" = 5, "zygomatic" = 6, "premaxilla" = 7)
      subregion.coefs <- manova(get(paste0(tolower(names(node.code)[node.code == selected.node]), ".pca"))$x ~ d.meta.combined$Sex + d.meta.combined$Age + d.meta.combined$Age^2 + d.meta.combined$Age^3 + d.meta.combined$Syndrome + d.meta.combined$Age:d.meta.combined$Syndrome)$coef
      S <- subregion.coefs[grepl(pattern = synd_comp, rownames(subregion.coefs)),][1,]
      
      Snorm <- S/sqrt(sum(S^2))
      syndscores.main <- get(paste0(tolower(names(node.code)[node.code == selected.node]), ".pca"))$x %*% Snorm
      
      syndscores.df <- data.frame(Syndrome = d.meta.combined$Syndrome, module.score = syndscores.main)
      syndscores.module <- syndscores.df%>%
        group_by(Syndrome) %>%
        summarise(face_score = mean(module.score))
    } else{syndscores.module <- syndscores.wholeface}
    
    #convert to similarity scores
    syndscores.module <- as.data.frame(syndscores.module)
    syndscores.wholeface <- as.data.frame(syndscores.wholeface)
    # syndscores.wholeface[,2] <- as.numeric(syndscores.wholeface[,2])
    # syndscores.module[,2] <- as.numeric(syndscores.module[,2])
    
    full_similarity <- sqrt((syndscores.wholeface[,2] - syndscores.wholeface[syndscores.wholeface[,1] == synd_comp,2])^2)
    module_similarity <- sqrt((syndscores.module[,2] - syndscores.module[syndscores.module[,1] == synd_comp,2])^2)
    
    syndscores.wholeface[,2] <- full_similarity
    syndscores.module[,2] <- module_similarity
    
    #sort from high to low
    syndscores.module <- syndscores.module[sort(syndscores.module[,2], index.return = T)$ix,]
    syndscores.wholeface <- syndscores.wholeface[sort(syndscores.wholeface[,2], index.return = T)$ix,]
    
    list(wholeface_scores = syndscores.wholeface, subregion_scores = syndscores.module)
    
  # }) #end future
  
}

#* generate atlas prediction as downloadable mesh
#* @param selected.sex predicted sex effect
#* @param selected.age predicted age effect
#* @param selected.synd predicted syndrome effect
#* @param selected.severity Mild, Typical, or Severe?
#* @param severity_sd what's a standard deviation of the severity scores
#* @serializer contentType list(type="application/octet-stream")
#* @get /predshapePLY
function(selected.sex = "Female", selected.age = 12, selected.synd = "Achondroplasia", selected.severity = "Typical", severity_sd = .02) {
  selected.synd <- factor(selected.synd, levels = levels(d.meta.combined$Syndrome))
  if(selected.sex == "Female"){selected.sex <-1
  } else if(selected.sex == "Male"){selected.sex <- 0}
  selected.age <- as.numeric(selected.age)

  datamod <- ~ selected.sex + selected.age + selected.age^2 + selected.age^3 + selected.synd + selected.age:selected.synd
    S <- matrix(synd.lm.coefs[grepl(pattern = selected.synd, rownames(synd.lm.coefs)),], nrow = 1, ncol = ncol(PC.eigenvectors))
    Snorm <- S/sqrt(sum(S^2))
    syndscores.main <- PC.scores %*% t(Snorm)
    
    severity_sd <- sd(syndscores.main[d.meta.combined$Syndrome == selected.synd])

    if(selected.severity == "Mild"){selected.severity <- -1.5 * severity_sd} else if(selected.severity == "Severe"){selected.severity <- 1.5 * severity_sd} else if(selected.severity == "Typical"){selected.severity <- 0}

    future_promise({

        main.res <- 1e10 * matrix(t(PC.eigenvectors %*% t(selected.severity * Snorm)), dim(synd.mshape)[1], dim(synd.mshape)[2])

        datamod <- ~ selected.sex + selected.age + selected.age^2 + selected.age^3 + selected.synd + selected.age:selected.synd
        predicted.shape <- predshape.lm(synd.lm.coefs, datamod, PC.eigenvectors, synd.mshape)

        tmp.mesh$vb[-4,] <- t(predicted.shape + main.res)/1e5
        # final.shape <- vcgSmooth(tmp.mesh)

    tmp.file <- tempfile()
    mesh2ply(Rvcg::vcgSmooth(tmp.mesh), filename = tmp.file)
    as_attachment(readBin(paste0(tmp.file, ".ply"), "raw", n = file.info(paste0(tmp.file, ".ply"))$size), paste0(selected.synd, "_", selected.age, "_", c("Male", "Female")[selected.sex + 1], "_sev", selected.severity, "_gestalt.ply"))
    # readBin(paste0(tmp.file, ".ply"), "raw", n = file.info(paste0(tmp.file, ".ply"))$size)
    
  })
}

#* generate atlas prediction as downloadable mesh
#* @param selected.sex predicted sex effect
#* @param selected.age predicted age effect
#* @param selected.synd predicted syndrome effect
#* @param selected.severity Mild, Typical, or Severe?
#* @param type what type of mesh you want back? ply, glb, or stream
#* @serializer contentType list(type="application/octet-stream")
#* @get /predshapeMesh
function(selected.sex = "Female", selected.age = 12, selected.synd = "Achondroplasia", selected.severity = "Typical", type = "ply") {
  selected.synd <- factor(selected.synd, levels = levels(d.meta.combined$Syndrome))
  if(selected.sex == "Female"){selected.sex <-1
  } else if(selected.sex == "Male"){selected.sex <- 0}
  selected.age <- as.numeric(selected.age)
  
  datamod <- ~ selected.sex + selected.age + selected.age^2 + selected.age^3 + selected.synd + selected.age:selected.synd
  S <- matrix(synd.lm.coefs[grepl(pattern = selected.synd, rownames(synd.lm.coefs)),], nrow = 1, ncol = ncol(PC.eigenvectors))
  Snorm <- S/sqrt(sum(S^2))
  syndscores.main <- PC.scores %*% t(Snorm)
  
  severity_sd <- sd(syndscores.main[d.meta.combined$Syndrome == selected.synd])
  
  if(selected.severity == "Mild"){selected.severity <- -1.5 * severity_sd} else if(selected.severity == "Severe"){selected.severity <- 1.5 * severity_sd} else if(selected.severity == "Typical"){selected.severity <- 0}
  
  future_promise({
    
    main.res <- 1e10 * matrix(t(PC.eigenvectors %*% t(selected.severity * Snorm)), dim(synd.mshape)[1], dim(synd.mshape)[2])
    
    datamod <- ~ selected.sex + selected.age + selected.age^2 + selected.age^3 + selected.synd + selected.age:selected.synd
    predicted.shape <- predshape.lm(synd.lm.coefs, datamod, PC.eigenvectors, synd.mshape)
    
    tmp.mesh$vb[-4,] <- (t(rotationM((predicted.shape + main.res)/1e10, 180 * pi/180, 0 * pi/180, -90 * pi/180))) * 20000
    # final.shape <- vcgSmooth(tmp.mesh)
    
    tmp.file <- tempfile()
    if(type == "ply"){
      mesh2ply(Rvcg::vcgSmooth(tmp.mesh), filename = tmp.file)
      as_attachment(readBin(paste0(tmp.file, ".ply"), "raw", n = file.info(paste0(tmp.file, ".ply"))$size), paste0(selected.synd, "_", selected.age, "_", c("Male", "Female")[selected.sex + 1], "_sev", selected.severity, "_gestalt.ply"))
    }
    
    if(type == "glb" | type == "stream"){
    writeGLB(as.gltf(Rvcg::vcgSmooth(tmp.mesh)), paste0(tmp.file, ".glb"))
    #for glb file: 
    if(type == "glb") as_attachment(readBin(paste0(tmp.file, ".glb"), "raw", n = file.info(paste0(tmp.file, ".glb"))$size), paste0("gestalt.glb"))
    #for b64 stream:
    if(type == "stream") base64enc::base64encode(readBin(paste0(tmp.file, ".glb"), "raw", n = file.info(paste0(tmp.file, ".glb"))$size), "text")
    }
  })
  
}

# #* register novel mesh
# #* @param selected.sex predicted sex effect
# #* @param selected.age predicted age effect
# #* @serializer contentType list(type="application/octet-stream")
# #* @get /registerMesh
# function() {
#   
#   future_promise({
#    #register mesh to synd.mshape
#     tmp.mesh <- atlas
#     jtemp <- file2mesh("~/shiny/shinyapps/Syndrome_model/da_reg.ply")
#     sample1k <- sample(1:27903, 1000)
#     
#     jtemp <- rotmesh.onto(jtemp, t(jtemp$vb[-4, sample1k]), synd.mshape[sample1k,], scale = T)$mesh
#     
#     #rotate for babylon
#     jtemp$vb[-4,] <- (t(rotationM(t(jtemp$vb[-4,]), 180 * pi/180, 0 * pi/180, -90 * pi/180))) * 20000
#     # final.shape <- vcgSmooth(tmp.mesh)
#     
#     tmp.file <- tempfile()
#     writeGLB(as.gltf(Rvcg::vcgSmooth(jtemp)), paste0(tmp.file, ".glb"))
#     #for b64 stream:
#     base64enc::base64encode(readBin(paste0(tmp.file, ".glb"), "raw", n = file.info(paste0(tmp.file, ".glb"))$size), "text")
#     #for glb file: as_attachment(readBin(paste0(tmp.file, ".glb"), "raw", n = file.info(paste0(tmp.file, ".glb"))$size), paste0("gestalt.glb"))
#     
#   })
#   
# }

#* upload mesh
#* @param meshFile obj or ply file
#* @post /uploadMesh
function(req, res) {
    multipart <- mime::parse_multipart(req)
    out_file <- multipart$test$datapath
    print(multipart)
    print(out_file)
    ext <- paste0(".", tools::file_ext(multipart$test$name))
    #grab extension instead of hardcoding for obj or ply
    system(paste0("mv ", jsonlite::unbox(out_file), " ", jsonlite::unbox(out_file), ext))
    #debug check for mesh receipt: print(file2mesh(paste0(jsonlite::unbox(out_file), ".ply")))
    # rawMesh <- file2mesh(paste0(jsonlite::unbox(out_file), ext))
    
    system(paste0("python3 /srv/shiny-server/morf/LandmarkScan.py -i ", jsonlite::unbox(out_file), ext, " -o /tmp/testestest"))
    
    # system(paste0("python ../morf/LandmarkScan.py -i ", jsonlite::unbox(out_file), ext, " -o ~/Downloads/testestest -d True"))
    # base64enc::base64encode(readBin(paste0("~/Downloads/testestest.obj"), "raw", n = file.info(paste0("~/Downloads/testestest.obj"))$size))
    # 
   file.mesh <- tryCatch(
        {
          file.mesh <- file2mesh("/tmp/testestest.obj")
          
        },
        error=function(cond) {
          print("mesh wasn't readable, trying another way")
            file.mesh <- rgl::readOBJ("/tmp/testestest.obj")

            # Choose a return value in case of error
            return(file.mesh)
        }
    )  
    
    file.lms <- read.table("/tmp/testestest.txt")

    #clean up
    file.remove("/tmp/testestest.obj")
    
    # library(rgl)
    # plot3d(file.mesh, aspect = "iso", alpha = .3)
    # text3d(file.lms, col = 3, texts = 1:13)
    # spheres3d(file.lms, col = 3, radius = 4)
    # rglwidget()
    
    tmp.fb <- rotmesh.onto(file.mesh, refmat = as.matrix(file.lms), tarmat = as.matrix(atlas.lms), scale = T, reflection = T)
    gp.fb <- tmp.fb$yrot
    
    tmp.fb <- tmp.fb$mesh
    
    # debug
    # library(rgl)
    # plot3d(tmp.fb, aspect = "iso", alpha = .3)
    # shade3d(atlas, col = 4)
    # spheres3d(atlas.lms, col = 2)
    # spheres3d(gp.fb, col = 3)
    # rglwidget()

    postDef <- posteriorDeform(mymod, tmp.fb, modlm = atlas.lms, samplenum = 2000)
    print("rigid registration")
    for(i in 1:3) postDef <- posteriorDeform(mymod, tmp.fb, modlm = atlas.lms, tarlm = gp.fb, samplenum = 1000, reference = postDef)
    # icpMesh <- icpmat(t(tmp.fb$vb[-4,]), t(atlas$vb[-4,]), iterations = 10)
    # tmp.fb$vb[-4,] <- t(icpMesh)
    # postDef <- posteriorDeform(mymod, tmp.fb, modlm = atlas.lms, samplenum = 2000)
    
    print("non-linear registration")
    postDefFinal <- postDef
    for(i in 1:3) postDefFinal <- posteriorDeform(mymod, tmp.fb, modlm=atlas.lms, samplenum = 3000, reference = postDefFinal, deform = T, distance = 3)
    print("wanle~~~")
    
    # plot3d(tmp.fb, aspect = "iso", alpha = .3)
    # shade3d(postDefFinal, col = 4)
    # rglwidget()
    
    #currently bugged and writes to home directory
    postDefFinal$vb[-4,] <- (postDefFinal$vb[-4,]/cSize(postDefFinal)) * 2e4
    vcgObjWrite(postDefFinal, "/tmp/postDefFinal.obj", writeNormals = T)
    base64enc::base64encode(readBin(paste0("/tmp/postDefFinal.obj"), "raw", n = file.info(paste0("/tmp/postDefFinal.obj"))$size))
    
}

# 
# #* register novel mesh
# #* @param selected.sex predicted sex effect
# #* @param selected.age predicted age effect
# #* @serializer contentType list(type="application/octet-stream")
# #* @get /registerMesh
# function(meshPath) {
#   
#   future_promise({
#     #register mesh to synd.mshape
#     # setwd("~/shiny/shinyapps/Syndrome_model/morf/")
#     # system(paste0("/Users/jovid/opt/anaconda3/bin/python ~/shiny/shinyapps/Syndrome_model/morf/LandmarkScan.py -i ~/shiny/shinyapps/Syndrome_model/morf/data/chidinma_decimated.obj -t ~/shiny/shinyapps/Syndrome_model/morf/data/chidinmaOriented.jpg -o ~/shiny/shinyapps/Syndrome_model/morf/out/testestest"))
#     # 
#     jtemp <- file2mesh("~/shiny/shinyapps/Syndrome_model/morf/out/testestest.obj")
# 
#     #rotate for babylon
#     jtemp$vb[-4,] <- (t(rotationM(t(jtemp$vb[-4,]), 180 * pi/180, 0 * pi/180, -90 * pi/180))) * 20000
# 
#     mesh2obj(jtemp, "~/shiny/shinyapps/Syndrome_model/morf/out/testestest.obj")
# 
#     tmp.file <- tempfile()
#     writeGLB(as.gltf(Rvcg::vcgSmooth(jtemp)), paste0(tmp.file, ".glb"))
#     #for b64 stream:
#     
#     base64enc::base64encode(readBin(paste0("~/shiny/shinyapps/Syndrome_model/morf/out/testestest.obj"), "raw", n = file.info(paste0("~/shiny/shinyapps/Syndrome_model/morf/out/testestest.obj"))$size))
#     # base64enc::base64encode(readBin(paste0(tmp.file, ".glb"), "raw", n = file.info(paste0(tmp.file, ".glb"))$size), "text")
#     #for glb file: as_attachment(readBin(paste0(tmp.file, ".glb"), "raw", n = file.info(paste0(tmp.file, ".glb"))$size), paste0("gestalt.glb"))
#     
#   })
#   
# }

#* generate syndrome classifier prediction
#* @get /getNormals
function(){

  jtemp <- file2mesh("/tmp/postDefFinal.obj")
  return(as.numeric(jtemp$normals[-4,]))
  
}


#* generate syndrome classifier prediction
#* @get /classifyMesh
function(selected.sex = "Female", selected.age = 12){
  tmp.mesh <- atlas
  
  jtemp <- file2mesh("/tmp/postDefFinal.obj")

  sample1k <- sample(1:27903, 1000)
  
  jtemp <- rotmesh.onto(jtemp, t(jtemp$vb[-4, sample1k]), synd.mshape[sample1k,], scale = T)$mesh
  
  icpMesh <- icpmat(t(jtemp$vb[-4,]), synd.mshape, iterations = 10)
  
  # plot3d(icpMesh, aspect = "iso")
  # points3d(synd.mshape, col = 2)
  # rglwidget()
  
  projected.mesh <- matrix(getPCscores(icpMesh, PC.eigenvectors, synd.mshape)[1:200], nrow = 1)
  # projected.mesh <- getPCscores(t(registered.mesh$vb[-4,]), PC.eigenvectors, synd.mshape)[1:200]
  
  #classify individual's scores using the model
  colnames(projected.mesh) <- colnames(PC.scores)
  
  posterior.distribution <- predict(hdrda.mod, newdata = as.data.frame(projected.mesh), type = "prob")
  
  posterior.distribution <- sort(posterior.distribution, decreasing = T)
  
  #used to be part of plot.df: ID = as.factor(1:10),
  plot.df <- data.frame(Probs = round(as.numeric(posterior.distribution[1:10]), digits = 4), Syndrome = as.factor(names(posterior.distribution[1:10])))
  plot.df$Syndrome <- as.character(plot.df$Syndrome)
  plot.df$Syndrome[plot.df$Syndrome == "Unrelated Unaffected"] <- "Non-syndromic"
  
  #personal morphospace df
  if(selected.sex == "Female"){selected.sex <-1
  } else if(selected.sex == "Male"){selected.sex <- 0} 
  selected.age <- as.numeric(selected.age)
  
  predicted.shape <- matrix(NA, nrow = length(unique(d.meta.combined$Syndrome)), ncol = 2)
  
    for(i in 1:nrow(predicted.shape)){
      selected.synd <- factor(levels(d.meta.combined$Syndrome)[i], levels = levels(d.meta.combined$Syndrome))
      datamod <- ~ selected.sex + selected.age + selected.age^2 + selected.age^3 + selected.synd + selected.age:selected.synd
      predicted.shape[i,] <- predPC.lm(synd.lm.coefs, datamod)[1:2]
    }
  
  personal.df <- data.frame(Syndrome = c("Submitted mesh", levels(d.meta.combined$Syndrome)), Scores = rbind(projected.mesh[1:2], predicted.shape/1e10))
  personal.df$Syndrome <- as.character(personal.df$Syndrome)
  personal.df$Syndrome[personal.df$Syndrome == "Unrelated Unaffected"] <- "Non-syndromic"
  colnames(personal.df)[2:3] <- c("Scores1", "Scores2")
  
  list(plot.df, personal.df)
}

# #* download comparison mesh
# #* @param selected.age age for syndrome comparison
# #* @param selected.sex sex for syndrome comparison
# #* @param selected.synd reference syndrome
# #* @param synd_comp compared syndrome
# #* @param selected.severity Mild, Typical, or Severe?
# #* @param severity_sd what's a standard deviation of the severity scores
# #* @serializer contentType list(type="application/octet-stream")
# #* @get /comparison_mesh
# function(selected.sex = "Female", selected.synd = "Unaffected Unrelated", synd_comp = "Achondroplasia", selected.severity = "Typical", selected.age = 10, severity_sd = .02) {
#   selected.synd <- factor(selected.synd, levels = levels(d.meta.combined$Syndrome))
#   synd_comp <- factor(synd_comp, levels = levels(d.meta.combined$Syndrome))
#   if(selected.sex == "Female"){selected.sex <- 1.5
#   } else if(selected.sex == "Male"){selected.sex <- -.5}
#   selected.age <- as.numeric(selected.age)
#   
#   #severity math####
#   S <- matrix(synd.lm.coefs[grepl(pattern = selected.synd, rownames(synd.lm.coefs)),], nrow = 1, ncol = ncol(PC.eigenvectors))
#   Snorm <- S/sqrt(sum(S^2))
#   
#   if(selected.severity == "Mild"){selected.severity <- -1.5 * severity_sd} else if(selected.severity == "Severe"){selected.severity <- 1.5 * severity_sd} else if(selected.severity == "Typical"){selected.severity <- 0}
#   
#   future_promise({
# 
#       main.res <- 1e10 * matrix(t(PC.eigenvectors %*% t(selected.severity * Snorm)), dim(synd.mshape)[1], dim(synd.mshape)[2])
#       
#       datamod <- ~ selected.sex + selected.age + selected.age^2 + selected.age^3 + selected.synd + selected.age:selected.synd
#       predicted.shape <- predshape.lm(synd.lm.coefs, datamod, PC.eigenvectors, synd.mshape)
#       
#       tmp.mesh$vb[-4,] <- t(predicted.shape + main.res)
#       final.shape <- vcgSmooth(tmp.mesh)
#       
#       datamod_comp <- ~ selected.sex + selected.age + selected.age^2 + selected.age^3 + synd_comp + selected.age:synd_comp
#       predicted.shape <- predshape.lm(synd.lm.coefs, datamod_comp, PC.eigenvectors, synd.mshape)
#       
#       tmp.mesh$vb[-4,] <- t(predicted.shape + main.res)
#       final.shape2 <- vcgSmooth(tmp.mesh)
#       
#       tmp.file <- tempfile()
#       mesh2ply(meshDist(final.shape, final.shape2, plot = F)$colMesh, filename = tmp.file)
#       as_attachment(readBin(paste0(tmp.file, ".ply"), "raw", n = file.info(paste0(tmp.file, ".ply"))$size), paste0(selected.synd, "2_", synd_comp, "_", selected.age, "_heatmap.ply"))
#       
#   })
# }
# 




