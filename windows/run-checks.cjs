'use strict';
const {spawn}=require('node:child_process');
const path=require('node:path');
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const child=spawn(require('electron'),[path.join(__dirname,'check-windows.cjs')],{windowsHide:true,stdio:'inherit',env});
const timeout=setTimeout(()=>{child.kill();console.error('Windows checks timed out.');process.exitCode=1;},240000);
child.on('error',error=>{clearTimeout(timeout);console.error(error);process.exitCode=1;});
child.on('exit',code=>{clearTimeout(timeout);process.exitCode=code===0?0:1;});
