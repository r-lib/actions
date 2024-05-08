FROM gcr.io/oss-fuzz-base/base-builder:v1
RUN apt-get update && apt-get install -y make autoconf automake libtool
COPY . $SRC/actions
WORKDIR actions
COPY .clusterfuzzlite/build.sh $SRC/
