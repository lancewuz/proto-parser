#!/bin/bash

npm_package_version=$1
if ([[ ! "$npm_package_version" =~ '-' ]]) then
  npm run changelog && git add CHANGELOG.md
fi
