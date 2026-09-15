import Cocoa
import WebKit

// A prohibited-activation process with an unshown window: never focuses or captures the user's screen.
final class HiddenCheck: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    var view: WKWebView!
    var window: NSWindow!
    func applicationDidFinishLaunching(_ notification: Notification) {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .nonPersistent()
        config.userContentController.addUserScript(WKUserScript(source: "window.AudioContext=class{constructor(){throw new Error('Audio disabled for background checks')}};window.webkitAudioContext=window.AudioContext;window.__messages=[];window.webkit={messageHandlers:{synthControl:{postMessage:m=>window.__messages.push(m)},midiExport:{postMessage:m=>window.__messages.push(m)}}};", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        view = WKWebView(frame:NSRect(x:0,y:0,width:CommandLine.arguments.count>3 ? Double(CommandLine.arguments[3])! : 1180,height:CommandLine.arguments.count>4 ? Double(CommandLine.arguments[4])! : 860),configuration:config)
        view.navigationDelegate = self
        window = NSWindow(contentRect:view.frame,styleMask:.borderless,backing:.buffered,defer:false)
        window.contentView = view
        let url=URL(fileURLWithPath:CommandLine.arguments[1])
        view.loadFileURL(url,allowingReadAccessTo:url.deletingLastPathComponent())
        DispatchQueue.main.asyncAfter(deadline:.now()+60){fputs("Background WebKit check timed out\n",stderr);exit(2)}
    }
    func finish(_ value: Any) {
        print(value)
        guard CommandLine.arguments.count > 5 else { exit(0) }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
        let configuration = WKSnapshotConfiguration()
        configuration.rect = self.view.bounds
        self.view.takeSnapshot(with: configuration) { image, error in
            guard let tiff = image?.tiffRepresentation,
                  let bitmap = NSBitmapImageRep(data: tiff),
                  let png = bitmap.representation(using: .png, properties: [:]) else {
                fputs("Offscreen snapshot failed: \(String(describing: error))\n", stderr); exit(1)
            }
            do { try png.write(to: URL(fileURLWithPath: CommandLine.arguments[5])); exit(0) }
            catch { fputs("Snapshot write failed: \(error)\n", stderr); exit(1) }
        }
    }
    }
    func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!) {
        do {
            let script=try String(contentsOfFile:CommandLine.arguments[2],encoding:.utf8)
            if CommandLine.arguments[2].hasSuffix(".async.js") {
                webView.callAsyncJavaScript(script, arguments: [:], in: nil, in: .page) { result in
                    switch result {
                    case .success(let value): self.finish(value)
                    case .failure(let error): fputs("\(error)\n",stderr); exit(1)
                    }
                }
            } else {
                webView.evaluateJavaScript(script){value,error in
                    if let error=error {fputs("\(error)\n",stderr);exit(1)}
                    self.finish(value ?? "No result")
                }
            }
        } catch {fputs("\(error)\n",stderr);exit(1)}
    }
}
let app=NSApplication.shared
app.setActivationPolicy(.prohibited)
let delegate=HiddenCheck()
app.delegate=delegate
app.run()
