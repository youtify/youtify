var fs = require("fs");
var jslint = require("jslint");

// https://github.com/mishoo/UglifyJS#api
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;

var MATCH_PATTERN = /\/scripts\/(.*\.js)/g;
var IGNORE_PATTERN = /jquery-1\.|jquery\.time|less|soundmanager|production|shuffle|featuredetection.*.js/i;
var JSLINT_OPTIONS = {
    devel: true,
    browser: true,
    regexp: true,
    sloppy: true,
    undef: true,
    unparam: true,
    bitwise: true,
    vars: true,
    white: true,
    nomen: true,
    maxerr: 50,
    indent: 4
}

function extractScriptFileNames() {
    var filenames = [];
    var data = fs.readFileSync('./html/index.html', 'utf8');
    match = data.match(MATCH_PATTERN);

    for (var i =- 0; i < match.length; i += 1) {
        var filename = match[i];
        if (!filename.match(IGNORE_PATTERN)) {
            filenames.push(filename);
        }
    }

    return filenames;
}

function runJSLint(filenames) {
    var files = [];
    filenames.forEach(function(filename) {
        var data = fs.readFileSync('./' + filename);

        // Fix UTF8 with BOM
        if (0xEF === data[0] && 0xBB === data[1] && 0xBF === data[2]) {
            data = data.slice(3);
        }
        data = data.toString("utf8");

        console.log('[JSLINT]', filename);

        if (!jslint(data, JSLINT_OPTIONS)) {
            throw {
                filename: filename,
                report: jslint.data()
            }
        }
        files.push({
            'name': filename,
            'content': data
        });
    });
    return files;
}

function runUglify(mergedFile) {
    var ast;
    try {
        ast = jsp.parse(mergedFile); // parse code and get the initial AST
    } catch (e) {
        console.log('UglifyJS parse failed', e);
    }
    ast = pro.ast_mangle(ast); // get a new AST with mangled names
    ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
    return pro.gen_code(ast); // compressed code here
}

function mergeFiles(files) {
    var mergedFile = '';
    files.forEach(function(file) {
        mergedFile += '\n\n';
        mergedFile += file.content;
    });
    return mergedFile;
}

function writeUglifiedFile(uglifiedFile) {
    var outputFileName = './scripts/production.js';
    fs.writeFileSync(outputFileName, uglifiedFile, 'utf8');
    console.log("Wrote", outputFileName);
}

var filenames = extractScriptFileNames();
try {
    var files = runJSLint(filenames);
} catch (e) {
    e.report.errors.forEach(function(e) {
        console.log(e.raw.replace('{a}', e.a).replace('{b}', e.b).replace('{c}', e.c).replace('{d}', e.d));
        console.log('Line ' + e.line + ', character', e.character, e.evidence);
    });
    process.exit(1);
}
var mergedFile = mergeFiles(files);
var uglifiedFile = runUglify(mergedFile);

writeUglifiedFile(uglifiedFile);
