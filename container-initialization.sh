#!/bin/bash 
#multi step initialization taken from: https://docs.docker.com/config/containers/multi-service_container/
set -m

./init &
 R -f /var/startup.R --slave

fg %1
