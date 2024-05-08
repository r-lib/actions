FROM gcr.io/oss-fuzz-base/base-builder:v1@sha256:ffd8a9fe9f951451e7b28610c83b0264e9fe20449af1f1dc31e243ec947315f7
RUN apt-get update && apt-get install -y r-base make libxml2-dev libcurl4-openssl-dev
COPY . $SRC/actions
WORKDIR actions
COPY .clusterfuzzlite/build.sh $SRC/
