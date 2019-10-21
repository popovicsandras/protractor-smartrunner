#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

VERSION="";

show_help() {
    echo "Usage: release.sh -v|--version <patch|minor|major|semver>"
}

set_version() {
    echo "====== Preparing to release version $1 ====="
    VERSION=$1
}

while [[ $1  == -* ]]; do
    case "$1" in
      -h|--help|-\?) show_help; exit 0;;
      -v|--version) set_version $2; shift;;
      -*) shift;;
    esac
done

SEMVER=`cd "$DIR" && npm --no-git-tag-version version $VERSION`
cd "$DIR/src/smartrunner" && npm --no-git-tag-version version $SEMVER

git add "$DIR/package.json"
git add "$DIR/package-lock.json"
git add "$DIR/src/smartrunner/package.json"
git commit -m "Creating version $SEMVER"
git push origin master

git tag "$SEMVER"
git push origin "$SEMVER"
