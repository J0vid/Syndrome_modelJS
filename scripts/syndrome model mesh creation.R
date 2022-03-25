
syndmod <- function(selected.sex = "Female", selected.age = 12, selected.synd = "Achondroplasia", selected.severity = "Typical", meshname) {
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
  
  # future_promise({
    
    main.res <- 1e10 * matrix(t(PC.eigenvectors %*% t(selected.severity * Snorm)), dim(synd.mshape)[1], dim(synd.mshape)[2])
    
    datamod <- ~ selected.sex + selected.age + selected.age^2 + selected.age^3 + selected.synd + selected.age:selected.synd
    predicted.shape <- predshape.lm(synd.lm.coefs, datamod, PC.eigenvectors, synd.mshape)
    
    tmp.mesh$vb[-4,] <- (t(rotationM((predicted.shape + main.res)/1e10, 58 * pi/180,90 * pi/180,32 * pi/180))) * 20000
    # final.shape <- vcgSmooth(tmp.mesh)
    
    if(meshname == "baseline") mesh2ply(Rvcg::vcgSmooth(tmp.mesh), filename = paste0("~/Desktop/Syndrome_model_raw_meshes/", selected.synd))
    if(meshname == "sex") mesh2ply(Rvcg::vcgSmooth(tmp.mesh), filename = paste0("~/Desktop/Syndrome_model_raw_meshes/", selected.synd, "_", c("Male", "Female")[selected.sex + 1]))
    if(meshname == "age") mesh2ply(Rvcg::vcgSmooth(tmp.mesh), filename = paste0("~/Desktop/Syndrome_model_raw_meshes/", selected.synd, "_",  round(min(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])),"_", selected.age))
    if(meshname == "severity") mesh2ply(Rvcg::vcgSmooth(tmp.mesh), filename = paste0("~/Desktop/Syndrome_model_raw_meshes/", selected.synd, "_",  round(severity_sd, 3)))
    
    # as_attachment(readBin(paste0(tmp.file, ".ply"), "raw", n = file.info(paste0(tmp.file, ".ply"))$size), paste0(selected.synd, "_", selected.age, "_", c("Male", "Female")[selected.sex + 1], "_sev", selected.severity, "_gestalt.ply"))
    # readBin(paste0(tmp.file, ".ply"), "raw", n = file.info(paste0(tmp.file, ".ply"))$size)
    
  # })
  
}

#failed: 1, 15, 44
for(i in 45:length(unique(d.meta.combined$Syndrome))){
  #baseline
  syndmod(selected.sex = "Female", selected.age = round(min(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])), selected.synd =  levels(d.meta.combined$Syndrome)[i], selected.severity = "Typical", meshname = "baseline")
  
  #sex
  syndmod(selected.sex = "Male", selected.age = round(min(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])), selected.synd =  levels(d.meta.combined$Syndrome)[i], selected.severity = "Typical", meshname = "sex")
  
  #age
  syndmod(selected.sex = "Female", selected.age = round(max(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])), selected.synd =  levels(d.meta.combined$Syndrome)[i], selected.severity = "Typical", meshname = "age")
  
  #severity
  syndmod(selected.sex = "Female", selected.age = round(min(d.meta.combined$Age[d.meta.combined$Syndrome == levels(d.meta.combined$Syndrome)[i]])), selected.synd =  levels(d.meta.combined$Syndrome)[i], selected.severity = "Severe", meshname = "severity")
  
  
}

rotationM <- function(mat, thetaX, thetaY, thetaZ){
rotationX <- matrix(c(1,0,0,0,cos(thetaX), -sin(thetaX), 0,sin(thetaX), cos(thetaX)), ncol = 3, byrow = T)
rotationY <- matrix(c(cos(thetaY),0,sin(thetaY),0,1,0,-sin(thetaY),0,cos(thetaY)), ncol = 3, byrow = T)
rotationZ <- matrix(c(cos(thetaZ),-sin(thetaZ),0,sin(thetaZ),cos(thetaZ),0,0,0,1), ncol = 3, byrow = T)

mat %*% rotationX %*% rotationY %*% rotationZ
}
