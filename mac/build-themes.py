from pathlib import Path
import re
from urllib.parse import quote
work=Path(__file__).resolve().parent
ids=['teal','ocean','plum','forest','midnight','classic','classic-coast','classic-harbor','retro','pixel','fantasy','orbital','neon','letterpress','blueprint']
scoped=':root:is('+','.join('[data-theme="'+i+'"]' for i in ids)+')'
classic=':root:is([data-theme="classic"],[data-theme="classic-coast"],[data-theme="classic-harbor"])'
css=(work/'themes.css').read_text().replace('@styled',scoped).replace('@classic',classic)
nature=':root:is([data-theme="teal"],[data-theme="ocean"],[data-theme="plum"],[data-theme="forest"],[data-theme="midnight"])'
css=css.replace('@nature',nature)
css=re.sub(r'@art\(([-a-z]+)\)',lambda m:'url("data:image/svg+xml,'+quote((work/'art'/(m[1]+'.svg')).read_text(),safe='')+'")',css)
for file in ['app-source.html','synth-window.html']:
 p=work/file;s=p.read_text()
 s=re.sub(r'\n/\* BEGIN STYLE THEMES \*/.*?/\* END STYLE THEMES \*/\n','\n',s,flags=re.S)
 s=s.replace('</style>','\n/* BEGIN STYLE THEMES */\n'+css+'\n/* END STYLE THEMES */\n</style>',1)
 p.write_text(s)
