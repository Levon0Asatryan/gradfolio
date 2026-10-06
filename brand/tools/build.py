import sys;sys.path.insert(0,'pylib')
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
F='final/'
LP,LS,LA='#1D4ED8','#BE185D','#D97706'
DP,DS,DA='#93C5FD','#F9A8D4','#FCD34D'
font=TTFont('Nunito-800.ttf');gs=font.getGlyphSet();cm=font.getBestCmap();upem=font['head'].unitsPerEm
nt=lambda v:('%.2f'%v).rstrip('0').rstrip('.')
def text(s,x0,y0,fs,ls):
    sc=fs/upem;x=x0;d=''
    for ch in s:
        g=gs[cm[ord(ch)]];p=SVGPathPen(gs,ntos=nt);g.draw(TransformPen(p,(sc,0,0,-sc,x,y0)));d+=p.getCommands();x+=g.width*sc+ls
    return d,x
# logo mark geometry (64 box)
def cap(m,acc,tas=None):
    tas=tas or acc
    return (f'<path d="M32 9 58 22 32 35 6 22z" fill="{m}" stroke="{m}" stroke-width="4" stroke-linejoin="round"/>'
     f'<path d="M17 33v10c0 4.5 6.7 8 15 8s15-3.5 15-8V33l-15 7.5z" fill="{m}"/>'
     f'<path d="M54 25v15" stroke="{tas}" stroke-width="3.5" stroke-linecap="round" fill="none"/><circle cx="54" cy="43.5" r="4" fill="{tas}"/>')
def grad(i,p,s,x2=58,y2=58,x1=6,y1=6):
    return f'<linearGradient id="{i}" gradientUnits="userSpaceOnUse" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"><stop offset="0" stop-color="{p}"/><stop offset="1" stop-color="{s}"/></linearGradient>'
def svg(w,h,vb,body,title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{vb}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'
def w(n,s):open(F+n,'w').write(s)
# 1 mark gradient, 2 flat
w('logo-mark.svg',svg(512,512,'0 0 64 64',f'<defs>{grad("g",LP,LS)}</defs>'+cap('url(#g)',LA),'Gradfolio'))
w('logo-mark-flat.svg',svg(512,512,'0 0 64 64',cap(LP,LP),'Gradfolio'))
# favicon: tile + bold simplified cap, white on gradient
def fav(inner_t='translate(0 2)'):
    return (f'<defs>{grad("t","#1D4ED8","#BE185D",64,64,0,0)}</defs><rect width="64" height="64" rx="14" fill="url(#t)"/>'
     f'<g transform="{inner_t}"><path d="M32 11 57 23.5 32 36 7 23.5z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>'
     '<path d="M17 34v9c0 4.5 6.7 8 15 8s15-3.5 15-8v-9l-15 7.5z" fill="#fff"/>'
     '<path d="M54.5 27v14" stroke="#FCD34D" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="54.5" cy="43.5" r="4.2" fill="#FCD34D"/></g>')
w('favicon.svg',svg(64,64,'0 0 64 64',fav(),'Gradfolio'))
# lockups
def lockup(dark,white=False):
    P,S,A=(DP,DS,DA) if dark else (LP,LS,LA)
    d1,x=text('Grad',76,44,36,-.5);d2,xe=text('folio',x,44,36,-.5);W=int(xe)+2
    if white: m=cap('#fff','#FCD34D');g='';t1=t2='#fff'
    else:
        g=f'<defs>{grad("g",P,S,W,64,0,0)}</defs>';m=cap('url(#g)',A);t1='#E6EDF8' if dark else '#0F172A';t2='url(#g)'
    return W,svg(W*4,256,f'0 0 {W} 64',g+m+f'<path d="{d1}" fill="{t1}"/><path d="{d2}" fill="{t2}"/>','Gradfolio'),(g,m,d1,d2,t1,t2)
W,s,_=lockup(False);w('logo-horizontal.svg',s)
W,s,_=lockup(True);w('logo-horizontal-dark.svg',s)
W,s,parts=lockup(False,True);open('work_white_lockup.svg','w').write(s);print('lockup W',W)
