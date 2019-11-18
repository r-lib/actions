#!/bin/bash

set -eo pipefail

cd /opt/R-svn/
. /opt/rchk/scripts/cmpconfig.inc
cd -

APT="$INPUT_APT"
if [ -n "$APT" ]; then
    sudo apt-get install $APT -y
fi

R --slave -e "install.packages('remotes', repos = 'https://cloud.r-project.org')"

R --slave -e "remotes::install_local(repos = 'https://cloud.r-project.org')"

PACKAGE="$INPUT_PACKAGE"

if [ -z "$PACKAGE" ]; then
    PACKAGE=$(echo ${GITHUB_REPOSITORY#*/})
fi

echo "running rchk tests for $PACKAGE"

cd /opt/R-svn/
. /opt/rchk/scripts/cmpconfig.inc
/opt/rchk/scripts/check_package.sh $PACKAGE
if [ $(cat packages/lib/$PACKAGE/libs/$PACKAGE.so.bcheck | wc -l) -gt 1 ]; then
  FAIL=1
fi
if [ $(cat packages/lib/$PACKAGE/libs/$PACKAGE.so.maacheck | wc -l) -gt 1 ]; then
  FAIL=1
fi
cat packages/lib/$PACKAGE/libs/$PACKAGE.so.maacheck
cat packages/lib/$PACKAGE/libs/$PACKAGE.so.bcheck

if [ -z "$FAIL" ]; then
  echo "rchk tests failed."
  exit 1
else
  echo "rchk tests succeed."
fi
