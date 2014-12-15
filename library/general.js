var com = {
    geertwille: {}
};

com.geertwille.general = {
    alert: function(message) {
        var app = [NSApplication sharedApplication];
        [app displayDialog:message];
    },

    openInFinder: function(path) {
        var finderTask = [[NSTask alloc] init],
            openFinderArgs = [NSArray arrayWithObjects:"-R", path, nil];

        [finderTask setLaunchPath:"/usr/bin/open"];
        [finderTask setArguments:openFinderArgs];
        [finderTask launch];
    }
};