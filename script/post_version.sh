#!/bin/bash

npm_package_version=$1

if ([[ "$npm_package_version" =~ '-' ]]) then
  git tag -d "v$npm_package_version"
  git reset HEAD^
else
  git push --tag
fi
