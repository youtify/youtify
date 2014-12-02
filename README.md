Youtify is an online music player.

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

How to get the development environment set up
---------------------------------------------

1. git clone git@github.com:youtify/youtify.git
2. Download and install the Google AppEngine SDK http://code.google.com/appengine/downloads.html
3. From the GAE SDK, select File -> Add Existing Application -> Select the Youtify git repository folder you just checked out
4. Start Youtify from the GAE SDK
5. You're done! Navigate your browser to http://localhost:8080 (or whatever port you selected).

Build & Deploy
--------------

When developing, Youtify requests all script files individually. However, on the production envrioronment we use a one big minimized script. To generate this script, you need to run our build system.

Dependencies: python 2.7 and node 0.8.2 needs to be installed.

    $ cd YOUTIFY_DIR/make

Install JSLint, UglifyJS and other dependencies:

    $ npm install

To run the build system:

    $ node make/generate_production_javascript.js

Discussion
----------

Twitter: @youtify, @pthulin, @kallux
Mail: youtify@youtify.com
... or create issues here on GitHub!
