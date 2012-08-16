import os.path
from shutil import copyfile
from shutil import copytree
from shutil import rmtree
try:
    from jinja2 import Template
except:
    print "Could not import Jinja2, run 'easy_install Jinja2'"
    exit()

output_dir = os.path.join('./', 'chrome_webstore')

if os.path.exists(output_dir):
    print "Removing existing build output directory"
    rmtree(output_dir)

os.makedirs(output_dir)

def add_background_script():
    copyfile('chrome_webstore_background.js', os.path.join(output_dir, 'background.js'))

    print "Background script copied"

def copy_static_dirs():
    copytree('images', os.path.join(output_dir, 'images'))
    copytree('styles', os.path.join(output_dir, 'styles'))
    copytree('scripts', os.path.join(output_dir, 'scripts'))

    print "Static directories copied"

def add_manifest():
    copyfile('chrome_webstore_manifest.json', os.path.join(output_dir, 'manifest.json'))

    print "Manifest copied"

def render_main_template():
    f = open('./html/index.html')
    template = Template(f.read().decode('utf-8'))
    f.close()

    html = template.render(og_tag='', url='', CURRENT_VERSION_ID='12345', INCLUDE_GOOGLE_ANALYTICS=False, USE_PRODUCTION_JAVASCRIPT=True)
    f = open(os.path.join(output_dir, 'index.html'), 'w')
    f.write(html.encode('utf-8'))
    f.close()

    print "Template rendered"

add_manifest()
add_background_script()
render_main_template()
copy_static_dirs()

print "Done, see " + os.path.abspath(output_dir)
