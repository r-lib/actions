#!/bin/bash

set -eo pipefail

# check if user is running rhub/ubuntu-rchk docker image

if [[ ! -d /home/docker/R-svn/ ]]; then
    echo <<EOF
Make sure you are running the container 'rhub/ubuntu-rchk'.

    runs-on: ubuntu-latest
    container:
      image: rhub/ubuntu-rchk
      options: --user=root

EOF
    exit 1
fi

apt-get update && apt-get install -y sudo

cd /home/docker/R-svn/
. /home/docker/rchk/scripts/cmpconfig.inc

# these variables are defined in cmpconfig.inc
echo "CPICFLAGS=$CPICFLAGS" >> $GITHUB_ENV
echo "CFLAGS=$CFLAGS" >> $GITHUB_ENV
echo "CXXFLAGS=$CXXFLAGS" >> $GITHUB_ENV
echo "CC=$CC" >> $GITHUB_ENV
echo "CXX=$CXX" >> $GITHUB_ENV
echo "PATH=$PATH" >> $GITHUB_ENV
echo "LLVM_COMPILER=$LLVM_COMPILER" >> $GITHUB_ENV
echo "PKG_BUILD_DIR=$PKG_BUILD_DIR" >> $GITHUB_ENV
echo "R_LIBS=$R_LIBS" >> $GITHUB_ENV
echo "R_LIBSONLY=$R_LIBSONLY" >> $GITHUB_ENV
echo "LD=$LD" >> $GITHUB_ENV

# R_LIBS_USER is needed for caching dependencies
echo "R_LIBS_USER=$R_LIBS" >> $GITHUB_ENV
