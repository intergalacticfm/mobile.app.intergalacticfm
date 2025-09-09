# use this for Android and iOS fastlane generation
# see also https://gitlab.com/-/snippets/1895688

# INSTALL sudo apt install xmlstarlet OR brew install xmlstarlet
# INSTALL sudo apt install imagemagick OR brew install imagemagick
set -e
cd ..
DST=fastlane/metadata/android/en-US

mkdir -p $DST
xmlstarlet sel -N w="http://www.w3.org/ns/widgets" -t -m "/w:widget" \
  -v "w:name" -n \
  config.xml > $DST/title.txt
xmlstarlet sel -N w="http://www.w3.org/ns/widgets" -t -m "/w:widget" \
  -v "w:description" -n \
  config.xml > $DST/short_description.txt
xmlstarlet sel -N w="http://www.w3.org/ns/widgets" -t -m "/w:widget" \
  -v "w:name" -o $' is ' \
  -v "w:description" -o $' by ' \
  -v "normalize-space(w:author)" -n \
  config.xml > $DST/long_description.txt

mkdir -p $DST/images/
convert archive/icon-logo.png -resize 512x512\! $DST/images/icon.png
cp -f archive/googleplayfeature.png $DST/images/featureGraphic.png

#TODO mkdir -p $DST/images/phoneScreenshots/

#TODO mkdir -p $DST/images/tenInchScreenshots/
