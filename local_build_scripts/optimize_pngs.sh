# use this for Android and iOS to reduce PNG files in size without
# loosing image quality

# INSTALL sudo apt install optipng OR brew install optipng
set -e
cd ..

find . -name '*.png' -exec optipng {} \;

