/* global define, $, brackets */

define(function (require, exports, module) {
	"use strict";

	//Modules to load
	var AppInit = brackets.getModule("utils/AppInit"),
		ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
		CommandManager = brackets.getModule("command/CommandManager"),
		KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
		EditorManager = brackets.getModule("editor/EditorManager"),
		NodeDomain = brackets.getModule("utils/NodeDomain");

	var COPY_LINE = "opensourceportfolio.cut-line.copy",
		CUT_LINE = "opensourceportfolio.cut-line.cut",
		PASTE_LINE = "opensourceportfolio.cut-line.paste",
		clipboard;

	function whenSelectionEmpty(callback) {
		var editor = EditorManager.getFocusedEditor(),
			codeMirror = editor ? editor._codeMirror : null,
			deferred = new $.Deferred(),
			from,
			to;

		if (codeMirror) {
			from = codeMirror.getCursor(true);
			to = codeMirror.getCursor(false);

			if (from.line === to.line && from.ch === to.ch) {
				return callback(codeMirror, editor, from);
			}
		}

		deferred.reject();

		return deferred;
	}

	function modifyLine() {
		return whenSelectionEmpty(function (codeMirror, editor, position) {
			var line = codeMirror.getLine(position.line),
				currentLineNumber = position.line,
				currentChar = position.ch,
				lineCount = codeMirror.lineCount(),
				deferred = new $.Deferred(),
				nextLine = '';

			clipboard.exec("copy", line + '\n');

			deferred.resolve();

			return deferred;
		});
	}

	function pasteLine() {
		return whenSelectionEmpty(function (codeMirror, editor, position) {
			var currentLine = codeMirror.getLine(position.line),
				deferred = new $.Deferred(),
				length,
				match;

			clipboard.exec("paste")
				.done(function (content) {
					length = content.length;

					//Remove for windows
					if (content[length - 1] === '\n' &&
						content[length - 2] === '\r') {

						content = content.substr(0, length - 2);
						length = length - 2;
					}

					if (content[length - 1] === '\n') {
						codeMirror.replaceRange(content, {
							line: position.line,
							ch: 0,
						});

						codeMirror.setCursor({
							line: position.line + 1,
							ch: position.ch < currentLine.length ? position.ch : currentLine.length,
						});

						deferred.resolve();
					} else {
						codeMirror.replaceRange(content, position);

						deferred.reject();
					}
				});

			return deferred;
		});
	}

	function loadDomain(nodeConnection) {
		var path = ExtensionUtils.getModulePath(module, "node/clipboard");

		clipboard = new NodeDomain('clipboard', path);
	}

	AppInit.appReady(function () {
		loadDomain();
		CommandManager.register("Copy line when selection empty", COPY_LINE, modifyLine);
		CommandManager.register("Paste line", PASTE_LINE, pasteLine);

		KeyBindingManager.addBinding(COPY_LINE, "Ctrl-C", brackets.platform);
		KeyBindingManager.addBinding(PASTE_LINE, "Ctrl-V", brackets.platform);
	});
});
