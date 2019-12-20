#!/bin/bash

# Set .env to a some .env.name file contents and create a backup of the existing .env

# Define a timestamp function
timestamp() {
  date +"%A-%s"
}
ENV_SOURCE=".env.$1"
if [ -f ".env" ]; then
  cp .env .env.$(timestamp).backup
  echo "Made backup of .env"
fi
if [ -f "$ENV_SOURCE" ]; then
  cp "$ENV_SOURCE" .env
  echo "Set .env to contents of $ENV_SOURCE"
fi
