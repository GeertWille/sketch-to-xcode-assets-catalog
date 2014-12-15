#import 'library/general.js'
#import 'library/messages.js'
#import 'library/sandbox.js'

com.geertwille.main = {
    defaultAssetFolder: 'Images.xcassets',
    type: '',
    baseDir: '',
    factors: {},

    export: function(type, factors) {
        this.type = type;
        this.factors = factors;
        this.baseDir = this.getCwd();

        var fileUrl = [doc fileURL],
            success  = false;

        if (fileUrl == null) {
            com.geertwille.general.alert("You need to save your document for me to know where to save it");
            return;
        }

        if (this.getDirFromPrompt() == null) {
            com.geertwille.general.alert("Not saving any assets");
            return;
        }

        //process the selected slices
        var slicesToOutput = selection;

        // Loop over all slices to export
        var count = [slicesToOutput count];
        for (var i = 0; i < count; i++) {
            var slice = [slicesToOutput objectAtIndex: i];
            success = this.processSlice(slice);

            if (success === false) {
                return;
            }
        }

        // Open finder window with assets exported
        com.geertwille.general.openInFinder(this.baseDir + this.defaultAssetFolder);
    },

    createSelect: function(msg, items, selectedItemIndex){
        selectedItemIndex = selectedItemIndex || 0

        var accessory = [[NSComboBox alloc] initWithFrame:NSMakeRect(0, 0, 200, 25)]
        [accessory addItemsWithObjectValues:items]
        [accessory selectItemAtIndex:selectedItemIndex]

        var alert = [[NSAlert alloc] init]
        [alert setMessageText:msg]
        [alert addButtonWithTitle:'OK']
        [alert addButtonWithTitle:'Cancel']
        [alert setAccessoryView:accessory]

        var responseCode = [alert runModal]
        var sel = [accessory indexOfSelectedItem]

        return [responseCode, sel]
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

    processSlice: function(slice) {
        var frame        = [slice frame],
            sliceName    = [slice name],
            fileType     = sliceName.substring(0, 2),
            deviceType   = sliceName.substring(2, 4),
            cutSliceName = sliceName.substring(4),
            jsonContent  = '',
            jsonPath     = '',
            lineBuffer   = [];

        // Find out our extension to save image with
        if (fileType == "j_") {
            imageExtension = ".jpg";
        } else if (fileType == "p_") {
            imageExtension = ".png";
        } else {
            // no valid naming convention used
            com.geertwille.general.alert(sliceName + com.geertwille.messages.invalid_layer_name);

            return false;
        }

        // What;s our idion?
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
            var name      = this.factors[i].folder,
                line      = '',
                scale     = this.factors[i].scale,
                suffix    = this.factors[i].suffix,
                version   = this.copyLayerWithFactor(slice, scale),
                fileName  = this.baseDir + this.defaultAssetFolder + "/"+ cutSliceName + ".imageset/" + cutSliceName + suffix + imageExtension,
                finalName = cutSliceName + suffix + imageExtension;

            [doc saveArtboardOrSlice: version toFile:fileName];

            lineBuffer.push([fileName, scale, idiom]);
        }

        // Save json
        jsonContent = this.prepareJSON(lineBuffer),
        jsonPath    = this.baseDir + this.defaultAssetFolder + "/" + cutSliceName + ".imageset/Contents.json";

        // write the json string to a file
        var ok = this.writeTextToFile(this.prepareJSON(lineBuffer), this.baseDir + this.defaultAssetFolder + "/" + cutSliceName + ".imageset/Contents.json");

        if (ok === false) {
            com.geertwille.general.alert(com.geertwille.messages.unknown_error);
            return false;
        } else {
            return true;
        }
    },

    copyLayerWithFactor: function(originalSlice, factor) {
        var copy = [originalSlice duplicate];
        var frame = [copy frame];
        var rect = [copy absoluteDirtyRect]
        slice = [MSExportRequest requestWithRect:rect scale:factor];
        [copy removeFromParent];

        return slice;
    },

    writeTextToFile: function(text, path) {
        var result = false;
        if (typeof path !== 'string')
            return result;

        // create a NSString object from the given text
        var nsstring = NSString.stringWithUTF8String(text);

        // use the writeToFile method of the NSString object to write the text to the given URL
        result = [nsstring writeToFile:path atomically:1 encoding:NSUTF8StringEncoding error:null];

        if (!result) {
            result = false;
        } else {
            result = true;
        }

        return result;
    },

    prepareJSON: function(lineBuffer) {
        var jsoncode = '{ "images" : [';

        for (var c = 0; c < lineBuffer.length; c++) {
            log("LINE : " + lineBuffer[c]);
            jsoncode = jsoncode + '{"idiom" : "' + lineBuffer[c][2] + '", "scale" : "' + lineBuffer[c][1] + 'x", "filename" : "' + lineBuffer[c][0] + '"},';
        }

        jsoncode = jsoncode + ' ], "info" : { "version" : 1, "author" : "xcode" }}';

        return jsoncode;
    }
}