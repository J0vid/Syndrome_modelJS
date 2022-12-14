#!/usr/local/bin/Rscript
library(plumber)
pr <- plumb("/srv/shiny-server/API/plumber.R")
pr$run(host = "0.0.0.0", port = 8000)
# print("hey")