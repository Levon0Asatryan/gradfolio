import sys;sys.path.insert(0,'pylib')
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
OUT=sys.argv[1]
LP,LS,LA='#1D4ED8','#BE185D','#D97706'
DP,DS,DA='#93C5FD','#F9A8D4','#FCD34D'
font=TTFont('Nunito-800.ttf');gs=font.getGlyphSet();cm=font.getBestCmap();upem=font['head'].unitsPerEm
nt=lambda v:('%.2f'%v).rstrip('0').rstrip('.')
def text(s,x0,y0,fs,ls):
    sc=fs/upem;x=x0;d=''
    for ch in s:
        g=gs[cm[ord(ch)]];p=SVGPathPen(gs,ntos=nt);g.draw(TransformPen(p,(sc,0,0,-sc,x,y0)));d+=p.getCommands();x+=g.width*sc+ls
    return d,x
def shapes(k,m,acc,flat=False):
 if k=='A':return f'<path d="M32 9 58 22 32 35 6 22z" fill="{m}" stroke="{m}" stroke-width="4" stroke-linejoin="round"/><path d="M17 33v10c0 4.5 6.7 8 15 8s15-3.5 15-8V33l-15 7.5z" fill="{m}"/><path d="M54 25v15" stroke="{acc}" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="54" cy="43.5" r="3.5" fill="{acc}"/>'
 if k=='B':return f'<path d="M44 20A17 17 0 1 0 47 36V31H32" fill="none" stroke="{m}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="52" cy="14" r="4" fill="{acc}"/>'
 o=.62 if flat else 1
 return f'<path d="M30 24C23 18 14 17 8 19V47c6-2 15-2 22 4z" fill="{m}"/><path d="M34 24C41 18 50 17 56 19V47c-6-2-15-2-22 4z" fill="{m}" opacity="{o}"/><path d="M32 3 43 8.5 32 14 21 8.5z" fill="{acc}" stroke="{acc}" stroke-width="2" stroke-linejoin="round"/>'
def grad(i,p,s,x2=58,y2=58,x1=6,y1=6):
    return f'<linearGradient id="{i}" gradientUnits="userSpaceOnUse" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"><stop offset="0" stop-color="{p}"/><stop offset="1" stop-color="{s}"/></linearGradient>'
def svg(w,h,vb,body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{vb}" role="img" aria-label="Gradfolio"><title>Gradfolio</title>{body}</svg>\n'
for k,d in (('A','a-cap'),('B','b-g-spark'),('C','c-open-folio')):
    def w(n,s):open(f'{OUT}/{d}/{n}','w').write(s)
    w('mark.svg',svg(512,512,'0 0 64 64',f'<defs>{grad("g",LP,LS)}</defs>'+shapes(k,'url(#g)',LA)))
    w('mark-dark.svg',svg(512,512,'0 0 64 64',f'<defs>{grad("g",DP,DS)}</defs>'+shapes(k,'url(#g)',DA)))
    w('mark-flat.svg',svg(512,512,'0 0 64 64',shapes(k,LP,LP,True)))
    w('tile.svg',svg(512,512,'0 0 64 64',f'<defs>{grad("t",LP,LS,64,64,0,0)}</defs><rect width="64" height="64" rx="15" fill="url(#t)"/><g transform="translate(32 33) scale(.72) translate(-32 -32)">{shapes(k,"#FFFFFF","#FCD34D")}</g>'))
    for dark,n in ((False,'horizontal.svg'),(True,'horizontal-dark.svg')):
        P,S,A=(DP,DS,DA) if dark else (LP,LS,LA)
        d1,x=text('Grad',76,44,36,-.5);d2,xe=text('folio',x,44,36,-.5);W=int(xe)+2
        t1='#E6EDF8' if dark else '#0F172A'
        w(n,svg(W*4,256,f'0 0 {W} 64',f'<defs>{grad("g",P,S,W,64,0,0)}</defs>'+shapes(k,'url(#g)',A)+f'<path d="{d1}" fill="{t1}"/><path d="{d2}" fill="url(#g)"/>'))
