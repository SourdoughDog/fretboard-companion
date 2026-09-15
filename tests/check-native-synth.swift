// Appended to the production main.swift (excluding its launch statements).
// This uses its actual message handler with two unshown, private WKWebViews.
@MainActor func bridgeJS(_ view:WKWebView,_ body:String,arguments:[String:Any]=[:]) async throws -> Any {
    try await withCheckedThrowingContinuation { continuation in
        view.callAsyncJavaScript(body,arguments:arguments,in:nil,in:.page) { result in
            continuation.resume(with:result)
        }
    }
}
@MainActor func waitForBridge(_ view:WKWebView,_ expression:String) async throws {
    for _ in 0..<150 {
        if (try? await view.evaluateJavaScript(expression)) as? Bool == true {return}
        try await Task.sleep(nanoseconds:20_000_000)
    }
    throw NSError(domain:"NativeBridge",code:1,userInfo:[NSLocalizedDescriptionKey:"Timed out waiting for "+expression])
}
extension FretboardApp {
    @MainActor func runBridgeChecks() async throws {
        let root=URL(fileURLWithPath:CommandLine.arguments[1])
        let config=WKWebViewConfiguration()
        config.websiteDataStore = .nonPersistent()
        config.userContentController.add(self,name:"synthState")
        config.userContentController.addUserScript(WKUserScript(source:"""
            // A real offline graph with a running state for the playback scheduler.
            // No AudioContext or audio device is ever created by this test.
            window.AudioContext=class extends OfflineAudioContext {
                constructor(){super(2,48000*8,48000);}
                get state(){return 'running';}
                async resume(){}
            };
            window.webkitAudioContext=window.AudioContext;
            """,injectionTime:.atDocumentStart,forMainFrameOnly:true))
        webView=WKWebView(frame:NSRect(x:0,y:0,width:1100,height:900),configuration:config)
        let panelConfig=WKWebViewConfiguration()
        panelConfig.websiteDataStore = .nonPersistent()
        panelConfig.userContentController.add(self,name:"synthControl")
        synthWebView=WKWebView(frame:NSRect(x:0,y:0,width:680,height:820),configuration:panelConfig)
        window=NSWindow(contentRect:webView.frame,styleMask:.borderless,backing:.buffered,defer:false)
        window.contentView=webView
        synthWindow=NSPanel(contentRect:synthWebView!.frame,styleMask:.borderless,backing:.buffered,defer:false)
        synthWindow!.contentView=synthWebView
        contentURL=root.appendingPathComponent("mac/app-source.html")
        synthURL=root.appendingPathComponent("mac/synth-window.html")
        webView.loadFileURL(contentURL,allowingReadAccessTo:contentURL)
        synthWebView!.loadFileURL(synthURL!,allowingReadAccessTo:synthURL!)
        // Loading is asynchronous; inspect only these views until both scripts exist.
        for _ in 0..<150 {
            let mainReady=(try? await webView.evaluateJavaScript("typeof setSynthOption==='function'")) as? Bool ?? false
            let panelReady=(try? await synthWebView!.evaluateJavaScript("typeof receiveSynthState==='function'")) as? Bool ?? false
            if mainReady && panelReady {break}
            try await Task.sleep(nanoseconds:20_000_000)
        }
        _ = try await webView.evaluateJavaScript("publishSynthState(true)")
        let panel=synthWebView!
        try await waitForBridge(panel,"lastState!==null")
        _ = try await bridgeJS(panel,"""
            window.expectedSound={cutoff:Math.round(150*80**.6),resonance:37,filterEnv:46,reverb:31,attack:.43,decay:.71,sustain:61,release:1.27,detune:8.3,width:74,vibrato:13.5,vibratoRate:6.2};
            for(const [key,value] of Object.entries(expectedSound)){
                const el=$('synth-'+key);el.value=key==='cutoff'?60:value;
                el.dispatchEvent(new Event('input',{bubbles:true}));
            }
            return true;
            """,arguments:[:])
        try await waitForBridge(panel,"Object.entries(expectedSound).every(([k,v])=>lastState.options[k]===v)")
        let expected=try await panel.evaluateJavaScript("JSON.stringify(expectedSound)") as! String
        for i in 0..<3 {
            _ = try await bridgeJS(webView,"""
                const expected=JSON.parse(expectedJSON);
                const check=(object,label)=>{for(const [k,v] of Object.entries(expected))if(object[k]!==v)throw Error(label+' reset '+k);};
                check(synthOptions,'engine');
                check(JSON.parse(localStorage.getItem('guitar-companion-v12')).synth,'saved settings');
                await playProgression(null,{degree:'1',quality:'major7',beats:2});
                if(!synthSession||!synthSession.notes.size)throw Error('No chord was scheduled');
                check(synthSession.settings,'playing chord');
                check(soundSettings(synthSession.settings),'sound parameters');
                stopPlayback();synthContext=null;synthMaster=null;
                check(synthOptions,'after stop');
                for(const k of Object.keys(expected))synthOptions[k]=-1;
                restoreWorkspace();check(synthOptions,'restored settings');publishSynthState(true);
                return true;
                """,arguments:["expectedJSON":expected])
            try await waitForBridge(panel,"Object.entries(expectedSound).every(([k,v])=>lastState.options[k]===v)")
            _ = try await bridgeJS(panel,"""
                for(const [key,value] of Object.entries(expectedSound)){
                    if(lastState.options[key]!==value)throw Error('Panel reset '+key);
                    const want=key==='cutoff'?cutoffToSlider(value):value;
                    if(Math.abs(Number($('synth-'+key).value)-want)>.51)throw Error('Slider reset '+key);
                }
                return true;
                """,arguments:[:])
            print("PASS: native controls, chord \(i+1), stop, storage restoration and panel values")
        }
        _ = try await panel.evaluateJavaScript("send('set',{key:'notAControl',value:99});send('set',{key:'release',value:-1});send('set',{key:'cutoff',value:'bad'})")
        try await Task.sleep(nanoseconds:50_000_000)
        _ = try await webView.evaluateJavaScript("if(synthOptions.release!==1.27||typeof synthOptions.notAControl!=='undefined'||synthOptions.cutoff!==Math.round(150*80**.6))throw Error('Invalid option accepted')")
        _ = try await panel.evaluateJavaScript("$('reset-sound').click()")
        try await waitForBridge(panel,"!lastState.modified")
        _ = try await bridgeJS(panel,"""
            if(lastState.modified||lastState.options.release!==.28)throw Error('Preset reset failed');
            return true;
            """,arguments:[:])
        print("PASS: all 12 new controls traverse the production Swift handler; invalid inputs rejected and preset reset works. No audio device or screen used.")
    }
}
let app=NSApplication.shared
app.setActivationPolicy(.prohibited)
let subject=FretboardApp()
Task { @MainActor in
    do {try await subject.runBridgeChecks();exit(0)}
    catch {fputs("Native bridge check failed: \(error)\n",stderr);exit(1)}
}
DispatchQueue.main.asyncAfter(deadline:.now()+30){fputs("Native bridge check timed out\n",stderr);exit(2)}
app.run()
