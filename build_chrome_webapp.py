from zipfile import ZipFile
try:
    from jinja2 import Template
except:
    print "Could not import Jinja2, run 'easy_install Jinja2'"
    exit()

zipfile = ZipFile("webapp.zip", "w")

def render_main_template():
    f = open('./html/index.html')
    template = Template(f.read().decode('utf-8'))
    f.close()

    html = template.render(og_tag='', url='', ON_PRODUCTION=True, ON_DEV=False, USE_PRODUCTION_JAVASCRIPT=True)
    zipfile.writestr('index.html', html.encode('utf-8'))

    print "Template rendered"

render_main_template()
