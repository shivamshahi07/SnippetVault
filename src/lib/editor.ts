import { EditorState, Transaction } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  HighlightStyle,
} from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { tags as t } from "@lezer/highlight";

const lightHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#d73a49" },
  { tag: t.operator, color: "#d73a49" },
  { tag: t.special(t.variableName), color: "#6f42c1" },
  { tag: t.typeName, color: "#6f42c1" },
  { tag: t.definition(t.variableName), color: "#6f42c1" },
  { tag: t.string, color: "#032f62" },
  { tag: t.number, color: "#005cc5" },
  { tag: t.bool, color: "#005cc5" },
  { tag: t.null, color: "#005cc5" },
  { tag: t.comment, color: "#6a737d" },
  { tag: t.function(t.variableName), color: "#6f42c1" },
  { tag: t.definition(t.propertyName), color: "#6f42c1" },
]);

const lightTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
    backgroundColor: "white",
  },
  ".cm-content": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    padding: "8px",
    color: "#24292e",
  },
  ".cm-gutters": {
    backgroundColor: "#f6f8fa",
    color: "#6e7781",
    border: "none",
    borderRight: "1px solid #e1e4e8",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-line": {
    padding: "0 8px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#e7eaed",
  },
  ".cm-activeLine": {
    backgroundColor: "#f6f8fa",
  },
  ".cm-selectionBackground": {
    backgroundColor: "#0366d625",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "#0366d625",
  },
});

const darkTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
    backgroundColor: "#1e1e1e",
  },
  ".cm-content": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    padding: "8px",
    color: "#e1e4e8",
  },
  ".cm-gutters": {
    backgroundColor: "#1e1e1e",
    color: "#6e7681",
    border: "none",
    borderRight: "1px solid #30363d",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-line": {
    padding: "0 8px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#2c2c2c",
  },
  ".cm-activeLine": {
    backgroundColor: "#2c2c2c",
  },
  ".cm-selectionBackground": {
    backgroundColor: "#264f7840",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "#264f7840",
  },
  ".cm-cursor": {
    borderLeftColor: "#c8c8c8",
  },
});

export const createEditorState = (
  doc: string = "",
  language: string = "javascript",
  readOnly: boolean = false,
  isDarkMode: boolean = true
) => {
  const extensions = [
    lineNumbers(),
    highlightActiveLine(),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    syntaxHighlighting(
      isDarkMode ? defaultHighlightStyle : lightHighlightStyle
    ),
    isDarkMode ? [oneDark, darkTheme] : lightTheme,
    EditorState.readOnly.of(readOnly),
  ];

  // Add language support based on the language prop
  if (language === "javascript" || language === "typescript") {
    extensions.push(javascript());
  }
  // Add more language support as needed

  return EditorState.create({
    doc,
    extensions,
  });
};

export const createEditorView = (
  parent: HTMLElement,
  state: EditorState,
  onUpdate?: (value: string) => void
) => {
  const view = new EditorView({
    state,
    parent,
    dispatch: onUpdate
      ? (tr: Transaction) => {
          view.update([tr]);
          if (tr.docChanged) {
            onUpdate(tr.state.doc.toString());
          }
        }
      : undefined,
  });

  return view;
};
