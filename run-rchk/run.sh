#!/bin/bash

set -eo pipefail

PACKAGE=$(Rscript -e "d=read.dcf('DESCRIPTION');cat(d[,colnames(d)=='Package',drop=TRUE])")

cd /home/docker/R-svn/
/home/docker/rchk/scripts/check_package.sh $PACKAGE
if [ $(cat packages/lib/$PACKAGE/libs/$PACKAGE.so.bcheck | wc -l) -gt 3 ]; then
  FAIL=1
fi
if [ $(cat packages/lib/$PACKAGE/libs/$PACKAGE.so.maacheck | wc -l) -gt 3 ]; then
  FAIL=1
fi
cat packages/lib/$PACKAGE/libs/$PACKAGE.so.maacheck
cat packages/lib/$PACKAGE/libs/$PACKAGE.so.bcheck

if [ "$FAIL" = 1 ]; then
  echo "rchk tests failed."
  exit 1
else
  echo "rchk tests succeed."
fi
