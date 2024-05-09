#!/bin/bash

# Run the following commands from top-level directory
# (assuming you only want to format YAML files in the 'examples' folder)
#
#   $ chmod +x .dev/format-yaml.sh
#   $ ./.dev/format-yaml.sh examples

if ! npm list -g | grep -q "prettier"; then
    echo "Error: 'Prettier' npm package is not installed globally."
    echo "You can install 'Prettier' globally by running: sudo npm install -g prettier"
    exit 1
fi

# Specify the folder containing YAML files
FOLDER=$1

# Check if folder argument is provided
if [ -z "$FOLDER" ]; then
    echo "Usage: $0 <folder>"
    exit 1
fi

if [ ! -d "$FOLDER" ]; then
    echo "Folder $FOLDER does not exist."
    exit 1
fi

# Find all YAML files recursively but skip cookiecutter folders
YAML_FILES=$(find "$FOLDER" -type f -name '*.yaml' -o -name '*.yml' -not -path "*/cookiecutter/*")

for FILE in $YAML_FILES; do
    prettier --write "$FILE"
    echo "Formatted: $FILE"
done

echo "Formatting complete."
