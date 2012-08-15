try:
    from jinja2 import Template
except:
    print "Could not import Jinja2, run 'easy_install Jinja2'"
    exit()

def render_main_template():
    f = open('./html/index.html')
    template = Template(f.read().decode('utf-8'))
    f.close()

    html = template.render(og_tag='', url='', ON_PRODUCTION=True, ON_DEV=False, USE_PRODUCTION_JAVASCRIPT=True)

    f = open('./chrome_webapp_index.html', 'w')
    f.write(html.encode('utf-8'))
    f.close()

    print "Template rendered"

render_main_template()
