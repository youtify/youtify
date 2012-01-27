Youtify is an online music player.

[![Flattr this git repo](http://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=Youtify&url=https://github.com/youtify/youtify&title=Youtify&language=en_GB&tags=github&category=software)


Code Style
----------

Filenames are PascalCased and match the class name. Example:

    ContextMenu.js

Namespaces are always PascalCased. Example:

    var TopList = {
    }

Classes are always PascalCased. Example:

    function PlaylistManager(foo, bar) {
    }

Variables are camelCased. Example:

    var playlistManager = ...;

Global functions and variables should be avoided and are only allowed in Main.js

Namespaces and classes are always put in files with the same name.

How to get translations working on your development setup
---------------------------------------------------------

1. Make sure you are logged in as admin and run http://localhost:8080/import_old_translations
2. Go to /admin and select the deploy tab. Press the deploy button.
3. Done!
