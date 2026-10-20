# -*- coding: utf-8 -*-
"""Horizontal process/architecture diagram for the Super El Nino Mapper (incl. 2026 outlook)."""
from PIL import Image, ImageDraw, ImageFont

W, H = 1600, 900
img = Image.new('RGB', (W, H), '#0a1420')
d = ImageDraw.Draw(img)

for y in range(H):
    t = y / H
    d.line([(0,y),(W,y)], fill=(int(10+3*t), int(20+10*t), int(32+16*t)))

F = lambda p,s: ImageFont.truetype(p, s)
BOLD = 'C:/Windows/Fonts/segoeuib.ttf'
REG  = 'C:/Windows/Fonts/segoeui.ttf'
f_title = F(BOLD, 44); f_sub = F(REG, 21)
f_nt = F(BOLD, 22);   f_nb = F(REG, 15); f_num = F(BOLD, 17)
f_chip = F(BOLD, 14)

d.text((54, 42), 'How the Super El Ni\u00f1o Mapper works', font=f_title, fill='#eaf2fb')
d.text((56, 102), 'Historical county records + a live 2026 forecast  \u2192  one interactive map of Kenya', font=f_sub, fill='#93a4bd')

nodes = [
 ('1','Historical records','OCHA, IFRC, ICPAC, KMD and Red Cross reports for 2015\u201316 and 2009\u201310.','#38bdf8'),
 ('2','Impact coding','Each record mapped to a county and graded severe \u00b7 high \u00b7 moderate \u00b7 watch.','#a78bfa'),
 ('3','Boundaries','All 47 Kenya counties (geoBoundaries ADM1) projected to SVG polygons.','#f59e0b'),
 ('4','Interactive map','Choropleth with hover, click-to-inspect, search and event toggle.','#ef4444'),
 ('5','Recurrence','27 counties flooded in BOTH events \u2014 the structural risk core.','#eab308'),
 ('6','2026 outlook','Live ENSO + ICPAC/KMD forecast blended into a county risk score.','#34d399'),
]

nw, nh = 222, 250
gap = 31
total = 6*nw + 5*gap
x0 = (W - total)//2
y0 = 292

for i,(num,title,body,col) in enumerate(nodes):
    x = x0 + i*(nw+gap)
    d.rounded_rectangle([x, y0, x+nw, y0+nh], radius=15, fill='#121d2f', outline='#22344d', width=2)
    d.rounded_rectangle([x, y0, x+nw, y0+9], radius=5, fill=col)
    d.ellipse([x+16, y0+23, x+48, y0+55], fill=col)
    d.text((x+26, y0+29), num, font=f_num, fill='#08111d')
    d.text((x+16, y0+70), title, font=f_nt, fill='#eaf2fb')
    words = body.split(); line=''; yy=y0+110
    for w in words:
        test=(line+' '+w).strip()
        if d.textlength(test, font=f_nb) > nw-32:
            d.text((x+16, yy), line, font=f_nb, fill='#a9bcd2'); yy+=23; line=w
        else: line=test
    if line: d.text((x+16, yy), line, font=f_nb, fill='#a9bcd2')
    if i < len(nodes)-1:
        ax=x+nw+4; ay=y0+nh//2
        d.line([(ax,ay),(ax+gap-12,ay)], fill='#3b5a7d', width=4)
        d.polygon([(ax+gap-12,ay-8),(ax+gap,ay),(ax+gap-12,ay+8)], fill='#3b5a7d')

oy = y0+nh+54
d.rounded_rectangle([x0, oy, x0+total, oy+156], radius=15, fill='#0f1a2b', outline='#22344d', width=2)
d.text((x0+24, oy+16), 'DELIVERED AS  \u2192', font=F(BOLD,17), fill='#7dd3fc')
chips = [
 'Single-file interactive HTML map','47-county severity choropleth','Hover + click county records',
 '2015\u201316 / 2009\u201310 toggle','Recurring-hotspot analysis','2026 outlook & county risk score','Linked sources & method note',
]
cx = x0+24; cy = oy+50
for c in chips:
    tw=d.textlength(c, font=f_chip)
    d.rounded_rectangle([cx, cy, cx+tw+32, cy+38], radius=19, fill='#16273d', outline='#2b4666')
    d.text((cx+16, cy+9), c, font=f_chip, fill='#cfe0f2')
    cx += tw+32+12
    if cx > x0+total-240: cx=x0+24; cy+=46

d.text((54, H-40), 'Sources: NOAA CPC (Sep 2026) \u00b7 ICPAC OND-2026 \u00b7 WMO \u00b7 IRI \u00b7 OCHA \u00b7 IFRC \u00b7 Red Cross Red Crescent Climate Centre \u00b7 geoBoundaries', font=F(REG,15), fill='#6d8199')

img.save('C:/Users/DAVID/.openclaw-autoclaw/workspace/elnino/assets/process-diagram.png')
print('saved diagram')
