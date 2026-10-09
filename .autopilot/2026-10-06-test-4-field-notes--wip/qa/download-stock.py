from pathlib import Path
import json, urllib.request, time
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps, ImageDraw
root=Path('frontend/public/test_4'); root.mkdir(exist_ok=True)
assets=[
('thailand-islands',32219382,'FUNESMA79 .','aerial-view-of-stunning-limestone-islands-in-thailand','Известняковые острова Таиланда в солнечном свете'),
('thailand-boat',31029692,'Ali Kazal','traditional-longtail-boat-by-phuket-limestone-cliffs','Деревянная лодка у зелёных известняковых скал в Таиланде'),
('bangkok-night',36778776,'Rony Stephen Chowdhury','vibrant-nightlife-in-bangkok-s-chinatown','Люди и огни вечерней улицы Бангкока'),
('thailand-road',30560543,'Artem Krapivin','lone-walker-on-a-scenic-forest-road-in-thailand','Человек на дороге под густой зелёной кроной в Таиланде'),
('bangkok-food',31903562,'King Ho','vibrant-thai-street-food-stall-in-bangkok','Уличная кухня Бангкока, прилавок с едой и посетители'),
('beijing-hutong',36355093,'Sean Xu','traditional-hutong-alleyway-in-beijing','Пекинский переулок с традиционными домами'),
('madagascar-baobabs',32265190,'Herve Meftah','majestic-baobabs-lining-a-dusty-road-in-madagascar','Баобабы и песчаная дорога на Мадагаскаре'),
('madagascar-lemur',17814114,'Joan Costa','lemur-on-rocks-in-forest','Лемур на камнях среди зелени на Мадагаскаре'),
('madagascar-sunset',36139778,'Chen EdisoN','sunset-over-madagascar-baobabs-in-vast-landscape','Баобабы на Мадагаскаре в вечернем свете'),
]
def fetch(a):
 name,id,author,slug,alt=a;url=f'https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?auto=compress&cs=tinysrgb&w=1800';p=root/f'{name}.jpg'
 if not p.exists():
  for attempt in range(3):
   try:
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
    data=urllib.request.urlopen(req,timeout=20).read();p.write_bytes(data);break
   except Exception as e:
    print(name,attempt,str(e),flush=True)
    if attempt==2: return None
 with Image.open(p) as im: width,height=im.size
 print(name,width,height,flush=True)
 return dict(file=p.name,src=f'/test_4/{p.name}',width=width,height=height,bytes=p.stat().st_size,alt=alt,author=author,source=f'https://www.pexels.com/photo/{slug}-{id}/',download=url,license='Pexels License',licenseUrl='https://www.pexels.com/license/',checked='2026-10-07',use='Temporary stock illustration; not Travel Club participants or evidence of an itinerary stop')
with ThreadPoolExecutor(max_workers=5) as pool: manifest=[a for a in pool.map(fetch,assets) if a]
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
sheet=Image.new('RGB',(1000,900),'#f3f2ee');draw=ImageDraw.Draw(sheet)
for i,a in enumerate(manifest):
 with Image.open(root/a['file']) as im: thumb=ImageOps.fit(im.convert('RGB'),(300,240))
 x=(i%3)*333;y=(i//3)*300;sheet.paste(thumb,(x,y));draw.text((x+4,y+246),a['file'],fill='#172f50')
sheet.save('.autopilot/2026-10-06-test-4-field-notes--wip/qa/stock-contact-sheet.jpg')
print('DOWNLOAD_COUNT',len(manifest),flush=True)
