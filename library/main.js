@import 'library/general.js'
@import 'library/functions.js'
@import 'library/messages.js'
@import 'library/sandbox.js'

com.geertwille.main = {
    defaultAssetFolder: 'Images.xcassets',
    type: '',
    baseDensity: 0,
    baseDir: '',
    factors: {},
    layerVisibility: [],
    namesAndJson: {},

    export: function(type, factors, baseDensity) {
        this.type = type;
        this.factors = factors;
        this.baseDensity = baseDensity;
        this.baseDir = this.getDirFromPrompt();

        if (this.baseDir == null) {
            com.geertwille.general.alert("Not saving any assets");
            return;
        }

        // If nothing is selected tell the user so
        if ([selection count] == 0) {
            com.geertwille.general.alert("No layer(s) selected");
            return;
        }

        if (this.baseDensity == 0) {
            this.baseDensity = this.getDensityScaleFromPrompt();
        }

        // Hide all layers except the ones we are slicing
        for (var i = 0; i < [selection count]; i++) {
            var layer = [selection objectAtIndex:i];
            // Make sure we don't get errors if no artboard exists.
            // currentPage inerits from MSLayerGroup so it's basicly the same as an artboard
            var artboard = [layer parentArtboard] ? [layer parentArtboard] : [doc currentPage];

            // Process the slice
            success = this.processSlice(layer);

            if (success === false)
                return;
        }

        // Open finder window with assets exported
        com.geertwille.general.openInFinder(this.baseDir + "/" + this.defaultAssetFolder);
    },

    // Return current working directory
    // This works better for the designer's workflow, as they mostly want to
    // save assets in the current directory
    getCwd: function() {
        var fileUrl = [doc fileURL],
        filePath = [fileUrl path],
        baseDir = filePath.split([doc displayName])[0];
        return baseDir;
    },

    // Let the user specify a directory
    getDirFromPrompt: function() {
        var panel = [NSOpenPanel openPanel];
        [panel setMessage:"Where do you want to place your assets?"];
        [panel setCanChooseDirectories: true];
        [panel setCanChooseFiles: false];
        [panel setCanCreateDirectories: true];
        var defaultDir = [[doc fileURL] URLByDeletingLastPathComponent];
        [panel setDirectoryURL:defaultDir];


        if ([panel runModal] == NSOKButton) {
            var message = [panel filename];
            return message;
        }
    },

    //Let the user select design density
    getDensityScaleFromPrompt: function() {
        var folders       = helpers.readPluginPath(),
            accessory     = [[NSComboBox alloc] initWithFrame:NSMakeRect(0, 0, 200, 25)],
            alert         = [[NSAlert alloc] init],
            responseCode
        ;
        [accessory addItemsWithObjectValues:['@1x', '@2x', '@3x']];
        [accessory selectItemAtIndex: 0];

        [alert setMessageText:'Select screen density'];
        [alert addButtonWithTitle:'OK'];
        [alert setAccessoryView:accessory];

        responseCode = [alert runModal];
        var densityScale = [accessory indexOfSelectedItem] + 1;

        helpers.saveJsonToFile([NSDictionary dictionaryWithObjectsAndKeys:densityScale, @"density-scale", nil], folders.sketchPluginsPath + folders.pluginFolder + '/config.json');

        return densityScale;
    },

    processSlice: function(slice) {
        var frame        = [slice frame],
            sliceName    = [slice name],
            fileType     = sliceName.trim().substring(0, 2),
            deviceType   = sliceName.trim().substring(2, 4),
            cutSliceName = sliceName.trim().substring(4),
            fileName     = cutSliceName.split('/').pop(),
            jsonContent  = '',
            jsonPath     = '',
            lineBuffer   = [];


        // Find out our extension to save image with
        if (fileType == "j_") {
            imageExtension = ".jpg";
        } else if (fileType == "p_") {
            imageExtension = ".png";
        } else if (fileType == "v_") {
            // Vector (PDF) export, needs no scaling
            imageExtension = ".pdf";
            this.factors = [this.factors[0]];
        } else {
            // no valid naming convention used
            com.geertwille.general.alert(sliceName + com.geertwille.messages.invalid_layer_name);

            return false;
        }

        // What's our idiom?
        if (deviceType == "u_") {
            idiom = "universal";
        } else if (deviceType == "m_") {
           idiom = "iphone";
        } else if (deviceType == "t_") {
           idiom = "ipad";
        } else {
            // no valid naming convention used
            com.geertwille.general.alert(sliceName + com.geertwille.messages.invalid_layer_name);
        }

        // Loop over all the factors and save the lines to a lineBuffer array
        for (var i = 0; i < this.factors.length; i++) {
            var name         = this.factors[i].folder,
            scale            = this.factors[i].scale,
            suffix           = this.factors[i].suffix,
            version          = this.makeSliceAndResizeWithFactor(slice, scale),
            relativeFileName = fileName + suffix + imageExtension,
            absoluteFileName = this.baseDir + "/" + this.defaultAssetFolder + "/" + cutSliceName + ".imageset/" + idiom + "_" + fileName + suffix + imageExtension;


            [doc saveArtboardOrSlice:version toFile:absoluteFileName];
            if (fileType == "v_") {
                lineBuffer.push([relativeFileName, 0, idiom]); // Vector's JSON has no scale
            } else {
                lineBuffer.push([relativeFileName, scale, idiom]);
            }
        }

        // write the json string to a file depending on if name already exists
        if (cutSliceName in this.namesAndJson) {
          var combinedJSONs = this.combineJSON(cutSliceName, lineBuffer);
          ok = helpers.writeTextToFile(combinedJSONs, this.baseDir + "/" + this.defaultAssetFolder + "/" + cutSliceName + ".imageset/Contents.json");
        } else {
          var ok = helpers.writeTextToFile(this.prepareJSON(this.prepareInnerJSON(lineBuffer)), this.baseDir + "/" + this.defaultAssetFolder + "/" + cutSliceName + ".imageset/Contents.json");
          this.namesAndJson[cutSliceName] = this.prepareInnerJSON(lineBuffer);
        }

        if (ok === false) {
            com.geertwille.general.alert(com.geertwille.messages.unknown_error);
            return false;
        } else {
            return true;
        }
    },

    makeSliceAndResizeWithFactor: function(layer, factor) {
        var loopLayerChildren = [[layer children] objectEnumerator],
            rect = [MSSliceTrimming trimmedRectForSlice:layer],
            isSliceLayer = false,
            slice
        ;

        // Check for MSSliceLayer and overwrite the rect if present
        while (layerChild = [loopLayerChildren nextObject]) {
            if ([layerChild class] == 'MSSliceLayer') {
                isSliceLayer = true;
                rect  = [MSSliceTrimming trimmedRectForSlice:layerChild];
            }
        }

        slice = [MSExportRequest requestWithRect:rect scale:(factor / this.baseDensity)];

        if (!isSliceLayer) {
            slice.shouldTrim = true;
        }
        // slice.saveForWeb = true;
        // slice.compression = 0;
        slice.includeArtboardBackground = false;
        return slice;
    },

    //prepare just the inner JSON from lineBuffer
    prepareInnerJSON: function(lineBuffer) {
      var text = "";

      for (var c = 0; c < lineBuffer.length; c++) {
          log("LINE : " + lineBuffer[c]);
          var scale = lineBuffer[c][1];
          text += '{"idiom" : "' + lineBuffer[c][2] + '", ';
          if (scale) {
              text += '"scale" : "' + scale + 'x", ';
          }
          text += '"filename" : "' + lineBuffer[c][2] + '_' + lineBuffer[c][0] + '"},';
      }
      return text;
    },

    //prepare the whole JSON whith variable amount of innerJSONs
    prepareJSON: function(innerJSONs) {

        //delete last "," of innerJSONs for valid JSON format
        innerJSONs = innerJSONs.slice(0, -1);
        return '{ "images" : [' + innerJSONs + ' ], "info" : { "version" : 1, "author" : "xcode" }}';
    },

    //combine the already existing innerJSON with the same name and the actual innerJSON to a whole new innerJSON
    combineJSON: function(cutSliceName, lineBuffer) {

      var oldInnerJSON = this.namesAndJson[cutSliceName];

      return this.prepareJSON(this.prepareInnerJSON(lineBuffer) + oldInnerJSON);
    },

    readConfig: function() {
        var folders = helpers.readPluginPath();
        log(folders.sketchPluginsPath + folders.pluginFolder);
        return helpers.jsonFromFile(folders.sketchPluginsPath + folders.pluginFolder + '/config.json', true);
        // helpers.jsonFromFile();
    },

    updateBaseDensity: function() {
        this.getDensityScaleFromPrompt();
    }
}
