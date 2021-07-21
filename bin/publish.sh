#!/usr/bin/env bash

set -e

RED='\033[0;31m'
GREEN='\033[32m'
NC='\033[0m'

# the default domain
DOMAIN='dev-a.pub.network'
read -p $'\e[31mAre you publishing to PRODUCTION?\e[0m: '
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${GREN}*** Okay the domain will be $DOMAIN ***"
  DOMAIN='a.pub.network'
fi

read -p "

If you are missing the dev-a sub domain that means you will be publishing to PRODUCTION.


Are you sure you're ready to publish the file prebid-universal-creative.js to $DOMAIN?" -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${GREN}*** OKAY ***"
  PARENT_DIRECTORY="$(dirname $( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P ) )"
  if [ ! -d $PARENT_DIRECTORY/build/$ENV/ ]; then
    echo -e "${RED}*** NO $PARENT_DIRECTORY FOUND ***${NC}"
    echo -e "${RED}*** DID YOU FORGET TO BUILD? ***${NC}"
    exit 1
  fi
  FILE=$PARENT_DIRECTORY/build/creative.js
  echo -e "${GREEN}Built File ${FILE}"
  gsutil mv $PARENT_DIRECTORY/build/creative.js gs://$DOMAIN/core/prebid-universal-creative.js
  echo -e "${GREEN}Setting permissions for $FILE...${NC}"
  gsutil acl ch -u AllUsers:R gs://$DOMAIN/core/creative.js
fi

