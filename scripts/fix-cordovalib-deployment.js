#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

module.exports = function (context) {
    const projectFile = path.join(context.opts.projectRoot,
        'platforms/ios/CordovaLib/CordovaLib.xcodeproj/project.pbxproj');

    if (fs.existsSync(projectFile)) {
        let content = fs.readFileSync(projectFile, 'utf8');
        // Sostituisce TUTTI i target deployment con 12.0
        content = content.replace(/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;/g,
            'IPHONEOS_DEPLOYMENT_TARGET = 12.0;');
        fs.writeFileSync(projectFile, content);
        console.log('CordovaLib deployment target updated to iOS 12.0');
    } else {
        console.warn('project.pbxproj not found for CordovaLib');
    }
};
