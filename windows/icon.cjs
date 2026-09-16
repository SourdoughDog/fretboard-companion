'use strict';
// Resolution-independent Windows artwork. Rasterize each ICO size separately
// so small title-bar/taskbar icons retain legible strings and smooth contours.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const ICON_SIZES=[16,20,24,30,32,36,40,48,60,64,72,80,96,128,256];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);

function roundedRect(x,y,left,top,right,bottom,radius){
  const dx=x-clamp(x,left+radius,right-radius),dy=y-clamp(y,top+radius,bottom-radius);
  return dx*dx+dy*dy<=radius*radius;
}
function segment(x,y,x1,y1,x2,y2,radius){
  const dx=x2-x1,dy=y2-y1,t=clamp(((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy),0,1);
  return (x-x1-t*dx)**2+(y-y1-t*dy)**2<=radius*radius;
}
function sample(x,y,size){
  if(!roundedRect(x,y,.043,.043,.957,.957,.205))return null;
  let color=mix([23,139,145],[0,89,101],clamp((x*.30+y*.70-.05)/.90,0,1));
  // A restrained rim gives the teal tile a clean edge on light and dark themes.
  if(!roundedRect(x,y,.049,.049,.951,.951,.199))color=mix(color,[210,246,240],.20*(1-y));
  const stroke=Math.max(.014, .85/size);
  // Snap narrow strokes to pixel centers at small sizes instead of letting
  // Windows resample a large icon into uneven or disappearing grid lines.
  const align=v=>size<=48?(Math.floor(v*size)+.5)/size:v;
  for(const px of [.27,.50,.73]){
    if(segment(x,y,align(px),.188,align(px),.816,stroke/2))color=mix(color,[147,210,210],.75);
  }
  for(const py of [.294,.432,.570,.708]){
    if(segment(x,y,.184,align(py),.816,align(py),stroke/2))color=mix(color,[182,224,218],.83);
  }
  for(const [noteX,noteY,radius,top,bottom] of [
    [.50,.432,.095,[255,255,255],[235,250,246]],
    [.73,.708,.082,[255,227,190],[249,188,139]]
  ]){
    const cx=align(noteX),cy=align(noteY);
    if(size>=32&&(x-cx)**2+(y-cy-.008)**2<=(radius+.005)**2)color=mix(color,[0,40,49],.30);
    if((x-cx)**2+(y-cy)**2<=radius*radius)color=mix(top,bottom,clamp((y-cy+radius)/(2*radius),0,1));
  }
  return color;
}

function renderIcon(size){
  const samples=size<=64?8:4,pixels=Buffer.alloc(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    let r=0,g=0,b=0,covered=0;
    for(let sy=0;sy<samples;sy++)for(let sx=0;sx<samples;sx++){
      const color=sample((x+(sx+.5)/samples)/size,(y+(sy+.5)/samples)/size,size);
      if(color){r+=color[0];g+=color[1];b+=color[2];covered++;}
    }
    if(covered){
      const i=(y*size+x)*4;
      pixels[i]=Math.round(r/covered);pixels[i+1]=Math.round(g/covered);pixels[i+2]=Math.round(b/covered);
      pixels[i+3]=Math.round(255*covered/(samples*samples));
    }
  }
  return {size,pixels,png:encodePng(size,pixels)};
}
const crcTable=Array.from({length:256},(_,n)=>{
  for(let bit=0;bit<8;bit++)n=(n>>>1)^((n&1)?0xedb88320:0);
  return n>>>0;
});
function chunk(type,data){
  const name=Buffer.from(type),out=Buffer.alloc(data.length+12);
  out.writeUInt32BE(data.length);name.copy(out,4);data.copy(out,8);
  let crc=0xffffffff;for(const byte of out.subarray(4,-4))crc=(crc>>>8)^crcTable[(crc^byte)&255];
  out.writeUInt32BE((crc^0xffffffff)>>>0,out.length-4);return out;
}
function encodePng(size,pixels){
  const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  const rows=Buffer.alloc((size*4+1)*size);
  for(let y=0;y<size;y++)pixels.copy(rows,y*(size*4+1)+1,y*size*4,(y+1)*size*4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
function encodeIco(frames){
  const directory=Buffer.alloc(6+frames.length*16);directory.writeUInt16LE(1,2);directory.writeUInt16LE(frames.length,4);
  let offset=directory.length;
  frames.forEach(({size,png},i)=>{
    const entry=6+i*16;directory[entry]=size===256?0:size;directory[entry+1]=size===256?0:size;
    directory.writeUInt16LE(1,entry+4);directory.writeUInt16LE(32,entry+6);
    directory.writeUInt32LE(png.length,entry+8);directory.writeUInt32LE(offset,entry+12);offset+=png.length;
  });
  return Buffer.concat([directory,...frames.map(frame=>frame.png)]);
}
function writeIcons(output){
  const frames=ICON_SIZES.map(renderIcon);
  fs.writeFileSync(path.join(output,'icon.ico'),encodeIco(frames));
  fs.writeFileSync(path.join(output,'icon.png'),renderIcon(1024).png);
}
module.exports={ICON_SIZES,renderIcon,encodeIco,writeIcons};
