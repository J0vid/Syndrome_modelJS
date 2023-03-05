FROM rocker/rstudio:3.6.3-ubuntu18.04

#system libraries of general use
RUN apt-get update && apt-get autoclean && apt-get install -y \
    software-properties-common \
    libssl-dev \
    build-essential \
    libharfbuzz-dev \
    libfribidi-dev \
    cmake \
    libgl1 \
    xvfb \
    python3.6 \
    python3-pip \
    gdebi-core

RUN apt-add-repository ppa:zarquon42/statismo-develop
RUN sudo apt update
RUN sudo apt install -y statismo-dev

# install R packages required
RUN R -e "install.packages('devtools')"
RUN R -e "devtools::install_github('zarquon42b/RvtkStatismo',ref='develop')"
RUN R -e "devtools::install_github('zarquon42b/mesheR')"
RUN R -e "install.packages('geomorph')"
RUN R -e "install.packages('Morpho')"
RUN R -e "install.packages('Rvcg')"
RUN R -e "install.packages('future')"
RUN R -e "install.packages('promises')"
RUN R -e "devtools::install_github('j0vid/Jovid')"
RUN R -e "install.packages('sparsediscrim')"
RUN R -e "install.packages('shinyBS')"
RUN R -e "install.packages('shinycssloaders')"
RUN R -e "install.packages('plotly')"
RUN R -e "install.packages('ggrepel')"
RUN R -e "install.packages('grid')"
RUN R -e "install.packages('visNetwork')"
RUN R -e "install.packages('shinydashboard')"
    
RUN pip3 install --upgrade pip
#python packages
RUN pip install numpy
RUN pip install scipy
RUN pip install opencv-python
RUN pip install vtk
RUN pip install pip
RUN pip install dlib
RUN pip install face-recognition
RUN pip install xvfbwrapper

RUN wget https://download2.rstudio.org/server/bionic/amd64/rstudio-server-2022.02.1-461-amd64.deb
RUN gdebi rstudio-server-2022.02.1-461-amd64.deb
RUN rstudio-server start

RUN R -e "install.packages('Morpho')"

ENV SHINY_SERVER_VERSION 1.5.14.948
RUN /rocker_scripts/install_shiny_server.sh
EXPOSE 3838

RUN R -e "install.packages('plumber')"
COPY ./API/startup.R /var
COPY ./API/ /srv/shiny-server/API
COPY ./container-initialization.sh /var

RUN ["chmod", "+x", "/var/startup.R"]
RUN ["chmod", "+x", "/var/container-initialization.sh"]

CMD ["/var/container-initialization.sh"]
