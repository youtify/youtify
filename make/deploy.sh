#!/bin/bash

set -e # Exit if any of the following commands fail

if [ -e $1 ]; then
    echo "You need to pass an email address as argument 1"
    exit 1
fi

YOUTIFY_ROOT_DIR=$(pwd)
EMAIL=$1

node ./make/generate_production_javascript.js
appcfg.py --email=$EMAIL --oauth2 --noauth_local_webserver update $YOUTIFY_ROOT_DIR
