#!/bin/bash

# Make sure to start from base workspace folder
reldir="$( dirname -- "$0"; )";
cd "$reldir/../../..";
SDK_WORKSPACE_DIR="$( pwd; )";
COMM_LAYER_DIR="$SDK_WORKSPACE_DIR/packages/sdk-communication-layer"
SDK_DIR="$SDK_WORKSPACE_DIR/packages/sdk"
SDK_REACT_DIR="$SDK_WORKSPACE_DIR/packages/sdk-react"
SDK_REACT_UI_DIR="$SDK_WORKSPACE_DIR/packages/sdk-react-ui"

DAPP_DIR="$SDK_WORKSPACE_DIR/packages/examples/nextjs-demo"

echo "SDK_DIR: $SDK_DIR"
echo "COMM_LAYER_DIR: $COMM_LAYER_DIR"
echo "DAPP_DIR: $DAPP_DIR"
echo "SDK_REACT_DIR: $SDK_REACT_DIR"
echo "SDK_REACT_UI_DIR: $SDK_REACT_UI_DIR"

echo "########### START REPLACING SDK_COMMUNICATION_LAYER #########"

cd $DAPP_DIR
echo "Hack Sentience sdk && sdk-communication-layer packages..."
## hack to debug to latest unpublished version of the sdk
rm -rf node_modules/@sntns/sdk-communication-layer node_modules/@sntns/sdk node_modules/@sntns/sdk-react node_modules/@sntns/sdk-react-ui
cp -rf $COMM_LAYER_DIR node_modules/@sntns/
cp -rf $SDK_DIR node_modules/@sntns/
cp -rf $SDK_REACT_DIR node_modules/@sntns/
cp -rf $SDK_REACT_UI_DIR node_modules/@sntns/


echo "All done."
