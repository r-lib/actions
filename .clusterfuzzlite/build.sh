#!/bin/bash -eu

# build project
# e.g.
# ./autogen.sh
# ./configure
# make -j$(nproc) all

cd /src/actions/src
$CC -c fuzzer.c
ar rcs fuzzer.a fuzzer.o

# build fuzzers
# e.g.
# $CXX $CXXFLAGS -std=c++11 -Iinclude \
#     /path/to/name_of_fuzzer.cc -o $OUT/name_of_fuzzer \
#     $LIB_FUZZING_ENGINE /path/to/library.a

$CC $CFLAGS fuzzer.c -o $OUT/fuzzer \
    $LIB_FUZZING_ENGINE /src/actions/src/fuzzer.a
