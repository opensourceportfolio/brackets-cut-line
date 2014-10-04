/* global define, $, jQuery, brackets, window, console */
/* jshint esnext:true */

define(function (require, exports, module) {
    "use strict";

    //Modules to load
    var AppInit = brackets.getModule("utils/AppInit"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        CommandManager = brackets.getModule("command/CommandManager"),
        KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        NodeConnection = brackets.getModule("utils/NodeConnection");

    var COPY_LINE = "opensourceportfolio.cut-line.copy",
        PASTE_LINE = "opensourceportfolio.cut-line.paste",
        clipboard,
        isLineCopied = false;

    function modifyLine() {
        return function () {
            var editor = EditorManager.getFocusedEditor(),
                codeMirror = editor ? editor._codeMirror : null,
                from,
                to,
                isSelectionEmpty;

            isLineCopied = isSelectionEmpty;

            if (codeMirror) {
                from = codeMirror.getCursor(true);
                to = codeMirror.getCursor(false);
                isSelectionEmpty = (from.line === to.line && from.ch === to.ch);
                if (isSelectionEmpty) {
                    var line = codeMirror.getLine(from.line),
                        currentLineNumber = to.line,
                        lineCount = codeMirror.lineCount(),
                        nextLine = '';

                    clipboard.copy("\n" + line);
                } else {
                    return $.Deferred().reject();
                }
            }
        };
    }

    function pasteLine() {
        var editor = EditorManager.getFocusedEditor(),
            codeMirror = editor ? editor._codeMirror : null,
            from,
            to,
            isSelectionEmpty,
            position,
            content;

        if (codeMirror) {
            from = codeMirror.getCursor(true);
            to = codeMirror.getCursor(false);
            isSelectionEmpty = (from.line == to.line && from.ch == to.ch);

            if (isSelectionEmpty && isLineCopied) {
                //TODO: Find a way to synchronously paste in Windows
                //content = clipboard.paste();
                //if (content && content[0] === '\n') {
                position = codeMirror.getLine(from.line).length;
                codeMirror.setCursor({
                    line: from.line,
                    ch: position
                });
            }
        }

        return $.Deferred().reject();
    }

    function connect() {
        var nodeConnection = new NodeConnection(),
            connectionPromise = nodeConnection.connect(true);

        return connectionPromise.then(function () {
            return nodeConnection;
        });
    }

    function loadDomain(nodeConnection) {
        var path = ExtensionUtils.getModulePath(module, "node/clipboard");

        return nodeConnection.loadDomains([path], true).then(function () {
            clipboard = nodeConnection.domains.clipboard;
        });
    }

    AppInit.appReady(function () {
        connect()
            .then(loadDomain)
            .then(function () {
                CommandManager.register("Copy line when selection empty", COPY_LINE, modifyLine());
                CommandManager.register("Paste line", PASTE_LINE, pasteLine);

                KeyBindingManager.addBinding(COPY_LINE, "Ctrl-C", brackets.platform);
                KeyBindingManager.addBinding(PASTE_LINE, "Ctrl-V", brackets.platform);
            }).fail(function (e) {
                console.error("[brackets-cut-line] failed to connect to node");
                console.error(e);
            });
    });
});
