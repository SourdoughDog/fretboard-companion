import Cocoa
import WebKit
import UniformTypeIdentifiers

final class FretboardApp: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler, NSWindowDelegate {
    private var window: NSWindow!
    private var webView: WKWebView!
    private var contentURL: URL!
    private var synthWindow: NSPanel?
    private var synthWebView: WKWebView?
    private var synthURL: URL?
    private var notationItems: [NSMenuItem] = []
    private var themeItems: [NSMenuItem] = []
    private let notationTabs = ["scales", "chords", "progressions"]
    private let themes = ["classic", "classic-coast", "classic-harbor", "teal", "ocean", "plum", "forest", "midnight", "retro", "pixel", "fantasy", "orbital", "neon", "letterpress", "blueprint"]

    func applicationDidFinishLaunching(_ notification: Notification) {
        installMenus()
        guard let url = Bundle.main.url(forResource: "index", withExtension: "html") else {
            showError("The app’s fretboard file is missing. Please use the complete Guitar Fretboard.app package.")
            NSApp.terminate(nil)
            return
        }
        contentURL = url
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.userContentController.add(self, name: "appearance")
        configuration.userContentController.add(self, name: "synthState")
        configuration.userContentController.add(self, name: "openSynth")
        configuration.userContentController.add(self, name: "midiExport")
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = false
        webView.setValue(false, forKey: "drawsBackground")
        let available = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 1000)
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: min(1220, available.width - 60), height: min(900, available.height - 60)), styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "Guitar Fretboard"
        window.delegate = self
        window.minSize = NSSize(width: 620, height: 520)
        window.backgroundColor = NSColor(calibratedRed: 0.957, green: 0.969, blue: 0.969, alpha: 1)
        window.appearance = NSAppearance(named: .aqua)
        window.contentView = webView
        window.setFrameAutosaveName("GuitarFretboardWindow")
        window.center()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        webView.loadFileURL(url, allowingReadAccessTo: url)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    private func add(_ title: String, action: Selector?, key: String = "", to menu: NSMenu, target: AnyObject? = nil) {
        let item = NSMenuItem(title: title, action: action, keyEquivalent: key)
        item.target = target
        menu.addItem(item)
    }

    private func installMenus() {
        let main = NSMenu()
        NSApp.mainMenu = main
        func submenu(_ name: String) -> NSMenu {
            let root = NSMenuItem(title: name, action: nil, keyEquivalent: "")
            let sub = NSMenu(title: name)
            root.submenu = sub
            main.addItem(root)
            return sub
        }
        let app = submenu("Guitar Fretboard")
        add("About Guitar Fretboard", action: #selector(about), to: app, target: self)
        app.addItem(.separator())
        add("Hide Guitar Fretboard", action: #selector(NSApplication.hide(_:)), key: "h", to: app)
        add("Show All", action: #selector(NSApplication.unhideAllApplications(_:)), to: app)
        app.addItem(.separator())
        add("Quit Guitar Fretboard", action: #selector(NSApplication.terminate(_:)), key: "q", to: app)
        let file = submenu("File")
        add("Print Current View…", action: #selector(printMap), key: "p", to: file, target: self)
        add("Close Window", action: #selector(NSWindow.performClose(_:)), key: "w", to: file)
        file.addItem(.separator())
        add("Wavetable Synth…", action: #selector(showSynth), key: "4", to: file, target: self)
        let labelsRoot = NSMenuItem(title: "Degree Labels", action: nil, keyEquivalent: "")
        let labels = NSMenu(title: "Degree Labels")
        labelsRoot.submenu = labels
        file.addItem(labelsRoot)
        for (tabIndex, tabTitle) in ["Scales", "Chords", "Progressions"].enumerated() {
            let tabRoot = NSMenuItem(title: tabTitle, action: nil, keyEquivalent: "")
            let tabMenu = NSMenu(title: tabTitle)
            tabRoot.submenu = tabMenu; labels.addItem(tabRoot)
            for (i, title) in ["Numbers · 1, ♭3, 5", "Roman · I, ♭III, V"].enumerated() {
                let item = NSMenuItem(title: title, action: #selector(changeNotation(_:)), keyEquivalent: "")
                item.tag = tabIndex * 2 + i; item.target = self; tabMenu.addItem(item); notationItems.append(item)
            }
        }
        let themeRoot = NSMenuItem(title: "Theme", action: nil, keyEquivalent: "")
        let themeMenu = NSMenu(title: "Theme")
        themeRoot.submenu = themeMenu
        file.addItem(themeRoot)
        for (i, title) in ["Classic (Default)", "Classic · Coast", "Classic · Harbor", "Lagoon", "Ocean", "Plum", "Forest", "Midnight", "Sunset Studio · Retro", "Pocket Pixel", "Moonlit Grimoire · Fantasy", "Orbital Console · Sci-Fi", "Neon Arcade", "Letterpress", "Blueprint"].enumerated() {
            if i == 3 || i == 8 { themeMenu.addItem(.separator()) }
            let item = NSMenuItem(title: title, action: #selector(changeTheme(_:)), keyEquivalent: "")
            item.tag = i; item.target = self; themeMenu.addItem(item); themeItems.append(item)
        }
        let edit = submenu("Edit")
        add("Copy", action: Selector(("copy:")), key: "c", to: edit)
        add("Select All", action: Selector(("selectAll:")), key: "a", to: edit)
        let view = submenu("View")
        for (index, title) in ["Scales", "Chords", "Progressions"].enumerated() {
            let item = NSMenuItem(title: title, action: #selector(switchTab(_:)), keyEquivalent: String(index + 1))
            item.tag = index; item.target = self; view.addItem(item)
        }
        view.addItem(.separator())
        add("Zoom In", action: #selector(zoomIn), key: "+", to: view, target: self)
        add("Zoom Out", action: #selector(zoomOut), key: "-", to: view, target: self)
        add("Actual Size", action: #selector(actualSize), key: "0", to: view, target: self)
        let windows = submenu("Window")
        NSApp.windowsMenu = windows
        add("Minimize", action: #selector(NSWindow.performMiniaturize(_:)), key: "m", to: windows)
        add("Zoom", action: #selector(NSWindow.performZoom(_:)), to: windows)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "midiExport", message.webView === webView {
            exportMIDI(message.body)
            return
        }
        if message.name == "openSynth", message.webView === webView { showSynth(); return }
        if message.name == "synthState", message.webView === webView {
            if let data = try? JSONSerialization.data(withJSONObject: message.body), let json = String(data: data, encoding: .utf8) {
                synthWebView?.evaluateJavaScript("receiveSynthState(\(json))", completionHandler: nil)
            }
            return
        }
        if message.name == "synthControl", message.webView === synthWebView,
           let body = message.body as? [String: Any], let action = body["action"] as? String {
            if action == "ready" { webView.evaluateJavaScript("publishSynthState(true)", completionHandler: nil) }
            if action == "play" { webView.evaluateJavaScript("playProgression()", completionHandler: nil) }
            if action == "toggle" { webView.evaluateJavaScript("(synthSession||synthPending)?stopPlayback():playProgression()", completionHandler: nil) }
            if action == "stop" { webView.evaluateJavaScript("stopPlayback()", completionHandler: nil) }
            // The engine validates keys and ranges in validSynthOption. Forward new controls
            // through the same path instead of maintaining a second, stale allowlist.
            if action == "set", let key = body["key"] as? String,
               let value = body["value"], let data = try? JSONSerialization.data(withJSONObject: [key, value]), let json = String(data: data, encoding: .utf8) {
                webView.evaluateJavaScript("setSynthOption(...\(json))", completionHandler: nil)
            }
            return
        }
        guard message.name == "appearance", message.webView === webView,
              let preferences = message.body as? [String: String], let theme = preferences["theme"] else { return }
        let appearance = NSAppearance(named: ["classic-harbor", "midnight", "fantasy", "orbital", "neon", "blueprint"].contains(theme) ? .darkAqua : .aqua)
        window?.appearance = appearance
        synthWindow?.appearance = appearance
        for (i, item) in themeItems.enumerated() { item.state = themes[i] == theme ? .on : .off }
        for (i, item) in notationItems.enumerated() { item.state = (i % 2 == 1) == (preferences[notationTabs[i / 2]] == "roman") ? .on : .off }
    }

    @objc private func switchTab(_ sender: NSMenuItem) {
        guard (0...2).contains(sender.tag) else { return }
        let tab = ["scales", "chords", "progressions"][sender.tag]
        window.makeKeyAndOrderFront(nil)
        webView.evaluateJavaScript("document.getElementById('mode-\(tab)').click()", completionHandler: nil)
    }

    private func midiStatus(_ message: String) {
        guard let data = try? JSONSerialization.data(withJSONObject: [message]), let json = String(data: data, encoding: .utf8) else { return }
        webView.evaluateJavaScript("midiExportResult(...\(json))", completionHandler: nil)
    }

    private func exportMIDI(_ value: Any) {
        guard let body = value as? [String: String], let action = body["action"], ["copy", "save"].contains(action),
              let encoded = body["data"], encoded.count <= 4_000_000,
              let data = Data(base64Encoded: encoded), data.count > 22,
              data.prefix(4) == Data([77, 84, 104, 100]) else { midiStatus("Could not create a valid MIDI file."); return }
        let proposed = body["filename"] ?? "Guitar progression.mid"
        let name = proposed.replacingOccurrences(of: "[^A-Za-z0-9 #._-]", with: "", options: .regularExpression)
        if action == "save" {
            let panel = NSSavePanel()
            panel.nameFieldStringValue = name.hasSuffix(".mid") ? name : name + ".mid"
            if let type = UTType(filenameExtension: "mid") { panel.allowedContentTypes = [type] }
            panel.beginSheetModal(for: window) { [weak self] response in
                guard response == .OK, let url = panel.url else { self?.midiStatus("MIDI save canceled."); return }
                do { try data.write(to: url, options: .atomic); self?.midiStatus("Saved MIDI. Import the file into your DAW.") }
                catch { self?.midiStatus("Could not save MIDI: " + error.localizedDescription) }
            }
        } else {
            do {
                let support = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
                let folder = support.appendingPathComponent("Guitar Fretboard/MIDI Exports/" + UUID().uuidString, isDirectory: true)
                try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
                let url = folder.appendingPathComponent(name.hasSuffix(".mid") ? name : name + ".mid")
                try data.write(to: url, options: .atomic)
                let pasteboard = NSPasteboard.general
                pasteboard.clearContents()
                if pasteboard.writeObjects([url as NSURL]) { midiStatus("MIDI file copied. Paste into a DAW that accepts files, or use Save MIDI to import it.") }
                else { midiStatus("File created, but copying failed. Use Save MIDI instead.") }
            } catch { midiStatus("Could not copy MIDI: " + error.localizedDescription) }
        }
    }

    @objc private func showSynth() {
        if synthWindow == nil {
            guard let url = Bundle.main.url(forResource: "synth-window", withExtension: "html") else { return }
            synthURL = url
            let config = WKWebViewConfiguration()
            config.userContentController.add(self, name: "synthControl")
            config.defaultWebpagePreferences.allowsContentJavaScript = true
            let view = WKWebView(frame: .zero, configuration: config)
            view.navigationDelegate = self
            synthWebView = view
            let panel = NSPanel(contentRect: NSRect(x: 0, y: 0, width: 680, height: 820), styleMask: [.titled, .closable, .resizable, .utilityWindow], backing: .buffered, defer: false)
            panel.title = "Wavetable Synth"
            panel.minSize = NSSize(width: 520, height: 640)
            panel.isReleasedWhenClosed = false
            panel.hidesOnDeactivate = true
            panel.appearance = window.appearance
            panel.contentView = view
            panel.center()
            synthWindow = panel
            view.loadFileURL(url, allowingReadAccessTo: url)
        }
        synthWindow?.makeKeyAndOrderFront(nil)
        webView.evaluateJavaScript("publishSynthState(true)", completionHandler: nil)
    }

    func windowWillClose(_ notification: Notification) {
        guard let closing = notification.object as? NSWindow, closing === window else { return }
        synthWindow?.close()
        webView.evaluateJavaScript("stopPlayback()", completionHandler: nil)
        NSApp.terminate(nil)
    }

    @objc private func changeTheme(_ sender: NSMenuItem) {
        guard themes.indices.contains(sender.tag) else { return }
        webView.evaluateJavaScript("setAppTheme('\(themes[sender.tag])')", completionHandler: nil)
    }
    @objc private func changeNotation(_ sender: NSMenuItem) {
        guard (0..<6).contains(sender.tag) else { return }
        let notation = sender.tag % 2 == 1 ? "roman" : "numbers"
        webView.evaluateJavaScript("setAppNotation('\(notation)', '\(notationTabs[sender.tag / 2])')", completionHandler: nil)
    }

    @objc private func about() {
        NSApp.orderFrontStandardAboutPanel(options: [.applicationName: "Guitar Fretboard", .applicationVersion: "1.23", .version: "24", .credits: NSAttributedString(string: "Your offline guitar scale and chord companion.\n26 scales and modes · 34 chord types · All 12 roots\nPolyphonic wavetable synth · Progression arranger")])
    }
    @objc private func zoomIn() { webView.pageZoom = min(2, webView.pageZoom + 0.1) }
    @objc private func zoomOut() { webView.pageZoom = max(0.7, webView.pageZoom - 0.1) }
    @objc private func actualSize() { webView.pageZoom = 1 }
    @objc private func printMap() {
        let info = NSPrintInfo.shared.copy() as! NSPrintInfo
        info.orientation = .landscape
        let operation = webView.printOperation(with: info)
        operation.showsPrintPanel = true
        operation.showsProgressPanel = true
        operation.runModal(for: window, delegate: nil, didRun: nil, contextInfo: nil)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        let expectedURL = webView === synthWebView ? synthURL : contentURL
        if url.isFileURL && url.standardizedFileURL == expectedURL?.standardizedFileURL {
            decisionHandler(.allow)
            return
        }
        // Online reading is optional and opens only when the user activates its link.
        if navigationAction.navigationType == .linkActivated && url.scheme == "https" && ["ianring.com", "viva.pressbooks.pub"].contains(url.host ?? "") {
            NSWorkspace.shared.open(url)
        }
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if (error as NSError).code != NSURLErrorCancelled { showError(error.localizedDescription) }
    }

    private func showError(_ detail: String) {
        let alert = NSAlert()
        alert.messageText = "The fretboard couldn’t open"
        alert.informativeText = detail
        alert.alertStyle = .warning
        alert.runModal()
    }
}

let app = NSApplication.shared
let delegate = FretboardApp()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
