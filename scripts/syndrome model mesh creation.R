agePoly <- poly(d.meta.combined$Age, 3)
ageModInt2 <- lm(PC.scores ~ d.meta.combined$Sex + agePoly[,1] + agePoly[,2] + agePoly[,3] + d.meta.combined$Syndrome + agePoly[,1]:d.meta.combined$Syndrome)


rotationM <- function(mat, thetaX, thetaY, thetaZ){
  rotationX <- matrix(c(1,0,0,0,cos(thetaX), -sin(thetaX), 0,sin(thetaX), cos(thetaX)), ncol = 3, byrow = T)
  rotationY <- matrix(c(cos(thetaY),0,sin(thetaY),0,1,0,-sin(thetaY),0,cos(thetaY)), ncol = 3, byrow = T)
  rotationZ <- matrix(c(cos(thetaZ),-sin(thetaZ),0,sin(thetaZ),cos(thetaZ),0,0,0,1), ncol = 3, byrow = T)
  
  mat %*% rotationX %*% rotationY %*% rotationZ
}

syndmod <- function(selected.sex = "Female", selected.age = 12, selected.synd = "Achondroplasia", selected.severity = "Typical", meshname) {
  selected.synd <- factor(selected.synd, levels = levels(d.meta.combined$Syndrome))
  if(selected.sex == "Female"){selected.sex <-1
  } else if(selected.sex == "Male"){selected.sex <- 0}
  selected.age <- as.numeric(selected.age)
  
  if(meshname == "age"){
    selected.age <- 75
  } else{
      selected.age <- 1
    }
  
  selected.age <- predict(agePoly, selected.age) 
  
  
  # if(selected.synd == "Unaffected Unrelated") selected.synd <- factor("(Intercept)", levels = levels(d.meta.combined$Syndrome))
  
  datamod <- ~ selected.sex + selected.age[1] + selected.age[2] + selected.age[3] + selected.synd + selected.age[1]:selected.synd  
  S <- matrix(synd.lm.coefs[grepl(pattern = selected.synd, rownames(synd.lm.coefs)),], nrow = 1, ncol = ncol(PC.eigenvectors))
  Snorm <- S/sqrt(sum(S^2))
  syndscores.main <- PC.scores %*% t(Snorm)
  
  severity_sd <- sd(syndscores.main[d.meta.combined$Syndrome == selected.synd])
  if(selected.synd == "Unaffected Unrelated") severity_sd <- 0
  
  if(selected.severity == "Mild"){selected.severity <- -1.5 * severity_sd} else if(selected.severity == "Severe"){selected.severity <- 1.5 * severity_sd} else if(selected.severity == "Typical"){selected.severity <- 0}
  
  # future_promise({
    
    main.res <- matrix(t(PC.eigenvectors %*% t(selected.severity * Snorm)), dim(synd.mshape)[1], dim(synd.mshape)[2])
    
    datamod <- ~ selected.sex + selected.age[1] + selected.age[2] + selected.age[3] + selected.synd + selected.age[1]:selected.synd  
    predicted.shape <- predictShape.lm(ageModInt2, datamod, PC.eigenvectors, synd.mshape)$predicted #predshape.lm(synd.lm.coefs, datamod, PC.eigenvectors, synd.mshape)
    
    #tmpmesh used to divide by 1e10 and multiplied by 20000...I threw that out
    tmp.mesh$vb[-4,] <- (t(rotationM((predicted.shape + main.res)/1, 58 * pi/180,90 * pi/180,32 * pi/180))) * 2e4
    # final.shape <- vcgSmooth(tmp.mesh)
    selected.synd <- gsub("/", "_", selected.synd)
    if(meshname == "baseline") mesh2ply(Rvcg::vcgSmooth(tmp.mesh), filename = paste0("~/Desktop/Syndrome_model_raw_meshes/", selected.synd))
    if(meshname == "sex") mesh2ply(Rvcg::vcgSmooth(tmp.mesh), filename = paste0("~/Desktop/Syndrome_model_raw_meshes/", selected.synd, "_", c("Male", "Female")[selected.sex + 1]))
    if(meshname == "age") mesh2ply(Rvcg::vcgSmooth(tmp.mesh), filename = paste0("~/Desktop/Syndrome_model_raw_meshes/", selected.synd, "_",  round(min(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])),"_", round(max(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]]))))#mesh2ply(Rvcg::vcgSmooth(tmp.mesh), filename = paste0("~/Desktop/Syndrome_model_raw_meshes/", selected.synd, "_",  round(min(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])),"_", selected.age))
    if(meshname == "severity") mesh2ply(Rvcg::vcgSmooth(tmp.mesh), filename = paste0("~/Desktop/Syndrome_model_raw_meshes/", selected.synd, "_",  round(severity_sd, 3)))
    
    # as_attachment(readBin(paste0(tmp.file, ".ply"), "raw", n = file.info(paste0(tmp.file, ".ply"))$size), paste0(selected.synd, "_", selected.age, "_", c("Male", "Female")[selected.sex + 1], "_sev", selected.severity, "_gestalt.ply"))
    # readBin(paste0(tmp.file, ".ply"), "raw", n = file.info(paste0(tmp.file, ".ply"))$size)
    
  # })
  
}

tmp.mesh <- atlas
#failed: 1, 15, 44 / secomd time 30, 58
for(i in 1:length(unique(d.meta.combined$Syndrome))){
  #baseline
  syndmod(selected.sex = "Female", selected.age = round(min(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])), selected.synd =  levels(d.meta.combined$Syndrome)[i], selected.severity = "Typical", meshname = "baseline")
  
  #sex
  syndmod(selected.sex = "Male", selected.age = round(min(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])), selected.synd =  levels(d.meta.combined$Syndrome)[i], selected.severity = "Typical", meshname = "sex")
  
  #age
  syndmod(selected.sex = "Female", selected.age = round(max(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])), selected.synd =  levels(d.meta.combined$Syndrome)[i], selected.severity = "Typical", meshname = "age")
  
  #severity
  syndmod(selected.sex = "Female", selected.age = round(min(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])), selected.synd =  levels(d.meta.combined$Syndrome)[i], selected.severity = "Severe", meshname = "severity")
  
  print(i)
}

#now let's do the work for texture
load("~/shiny/shinyapps/Syndrome_model/texture_300PCs.Rdata")
texModInt2 <- lm(texture.pca$x ~ d.meta.combined$Sex + agePoly[,1] + agePoly[,2] + agePoly[,3] + d.meta.combined$Syndrome + agePoly[,1]:d.meta.combined$Syndrome)


predtexture.lm <- function(fit, datamod, PC, mshape, gestalt_combo = NULL){
  dims <- dim(mshape)
  mat <- model.matrix(datamod)
  pred <- mat %*% fit
  print(dim(pred))
  names <- as.matrix(model.frame(datamod))
  names <- apply(names, 1, paste, collapse = "_")
  names <- gsub(" ", "", names)
  predPC <- t(PC %*% t(pred))
  print(dim(predPC))
  out <- mshape + predPC
  
  predicted.texture3d <- row2array3d(out)[,,1]
  
  if(is.null(gestalt_combo) == F){
    final.texture <- 5 * (predicted.texture3d) + t(col2rgb(atlas$material$color))
  } else {final.texture <- predicted.texture3d}
  #scale values
  maxs <- apply(final.texture, 2, max)
  mins <- apply(final.texture, 2, min)
  additive.texture <- scale(final.texture, center = mins, scale = maxs - mins)
  # hex.mean <- rgb(additive.texture, maxColorValue = 1)
  
  return(additive.texture)
}

eye_small <- readr::read_csv("shiny/shinyapps/Syndrome_model/eye_small.csv", col_names = FALSE)

texmod <- function(selected.sex = "Female", selected.age = 12, selected.synd = "Achondroplasia") {
  selected.synd <- factor(selected.synd, levels = levels(d.meta.combined$Syndrome))
  if(selected.sex == "Female"){selected.sex <-1
  } else if(selected.sex == "Male"){selected.sex <- 0}
  selected.age <- as.numeric(selected.age)
  
  selected.age <- predict(agePoly, selected.age) 
  
  datamod <- ~ selected.sex + selected.age[1] + selected.age[2] + selected.age[3] + selected.synd + selected.age[1]:selected.synd  
  predicted.shape <- predictShape.lm(ageModInt2, datamod, PC.eigenvectors, synd.mshape)$predicted
  predicted.tex <- predtexture.lm(texModInt2$coefficients, datamod, texture.pca$rotation, texture.pca$center)
  
  hex.mean <- rgb(predicted.tex, maxColorValue = 1)
  tmp.mesh$material$color[-as.numeric(eye_small )] <- hex.mean[-as.numeric(eye_small )]
  tmp.mesh$material$color[as.numeric(eye_small)] <- atlas$material$color[as.numeric(eye_small)]
  
  #tmpmesh is multiplied by 20000
  # tmp.mesh$vb[-4,] <- (t(rotationM((predicted.shape)/1, 58 * pi/180,90 * pi/180,32 * pi/180))) * 2e4
  # final.shape <- vcgSmooth(tmp.mesh)
  
  plot3d(Rvcg::vcgSmooth(tmp.mesh), aspect = "iso", specular = 1)  
  rglwidget()
  
  selected.synd <- gsub("/", "_", selected.synd)
  mesh2ply(Rvcg::vcgSmooth(tmp.mesh), filename = paste0("~/Desktop/Syndrome_model_raw_meshes/texture/", selected.synd))
  
  # })
  
}


for(i in 1:length(unique(d.meta.combined$Syndrome))){
  #baseline
  syndmod(selected.sex = "Female", selected.age = round(min(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])), selected.synd =  levels(d.meta.combined$Syndrome)[i], selected.severity = "Typical", meshname = "baseline")
  
  #sex
  syndmod(selected.sex = "Male", selected.age = round(min(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])), selected.synd =  levels(d.meta.combined$Syndrome)[i], selected.severity = "Typical", meshname = "sex")
  
  #age
  syndmod(selected.sex = "Female", selected.age = round(max(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])), selected.synd =  levels(d.meta.combined$Syndrome)[i], selected.severity = "Typical", meshname = "age")
  
  #severity
  syndmod(selected.sex = "Female", selected.age = round(min(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])), selected.synd =  levels(d.meta.combined$Syndrome)[i], selected.severity = "Severe", meshname = "severity")
  
  print(i)
}

#
View(d.meta.combined)

#averaging texture
averageTex <- colMeans(texture.pca$x[which(d.meta.combined$StudyID == "HJ_0118_1" | d.meta.combined$StudyID == "HJ_0052_1"),])

averageTex <- texture.pca$x[which(d.meta.combined$StudyID == "HJ_0153_1"),]

predPC <- texture.pca$rotation %*% averageTex
modell <- texture.pca$center + predPC
modell[modell < 0] <- 0
modell[modell > 255] <- 255

finalTex <- rgb(matrix(modell, ncol = 3, byrow = T), maxColorValue = 255)

tmp.mesh$material$color<- atlas$material$color
tmp.mesh$material$color[eyeMask$material$color != "#0626B7"] <- finalTex[eyeMask$material$color != "#0626B7"]
tmp.mesh$material$color <- finalTex

eyeMask <- file2mesh("shiny/shinyapps/Syndrome_modelJS/API/eyeMask.ply", readcol = T)
unique(eyeMask$material$color)

plot3d(Rvcg::vcgSmooth(tmp.mesh), aspect = "iso", specular = 1)  
rglwidget()



mesh2ply(tmp.mesh, filename = "~/texture7")

