#!/bin/sh

set -e
set -u

BUILD_DIR='./build'
ORG='hsldevcom'
DOCKER_IMAGE='bessersmith'
HEAD="$(git log -1 --pretty=%H)"

rm -rf "${BUILD_DIR}" \
&& mkdir -p "${BUILD_DIR}" \
&& git ls-files -z \
  | xargs -0 cp --parents -t "${BUILD_DIR}" \
&& docker build --tag="${ORG}/${DOCKER_IMAGE}:${HEAD}" .
rm -rf "${BUILD_DIR}"
