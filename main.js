/*global define, $, jQuery, brackets, window, console */

define(function (require, exports, module) {
	"use strict";

	//Modules to load
	var AppInit = brackets.getModule("utils/AppInit"),
		ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
		CommandManager = brackets.getModule("command/CommandManager"),
		KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
		EditorManager = brackets.getModule("editor/EditorManager"),
		NodeConnection = brackets.getModule("utils/NodeConnection");

	var CUT_LINE = "opensourceportfolio.cut-line.cut",
		COPY_LINE = "opensourceportfolio.cut-line.copy",
		clipboard;

	function modifyLine(isCutOperation) {
		return function () {
			var editor = EditorManager.getFocusedEditor()._codeMirror;
			var from = editor.getCursor(true),
				to = editor.getCursor(false),
				isSelectionEmpty = (from.line == to.line && from.ch == to.ch);

			if (isSelectionEmpty) {
				var line = editor.getLine(from.line),
                    currentLineNumber = to.line,
                    lineCount = editor.lineCount(),
                    nextLine = '';
                
				clipboard.copy("\n" + line);
				if (isCutOperation) { 
                    editor.removeLine(from.line);
                    if (currentLineNumber < lineCount){
                        nextLine = editor.getLine(currentLineNumber);
                        editor.setCursor({
                            ch: nextLine.length,
                            line: currentLineNumber
                        });
                    }
                }
			} else {
				return new $.Deferred.reject();
			}
		};
	}

	function connect() {
		var nodeConnection = new NodeConnection(),
			connectionPromise = nodeConnection.connect(true);

		return connectionPromise.then(function(){
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
			CommandManager.register("Cut line when selection empty", CUT_LINE, modifyLine(true));
			CommandManager.register("Copy line when selection empty", COPY_LINE, modifyLine(false));

			KeyBindingManager.addBinding(CUT_LINE, "Ctrl-X", brackets.platform);
			KeyBindingManager.addBinding(COPY_LINE, "Ctrl-C", brackets.platform);
		}).fail(function (e) {
			console.error("[brackets-cut-line] failed to connect to node");
			console.error(e);
		});
	});
});