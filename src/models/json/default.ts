import { Run, StyleOptions } from "./wordJsonModels";

export let defaultJsonRun: Run = {
  text: ``,
  Bold: false,
  Italic: false,
  Underline: false,
  Size: 12,
  Uri: null,
  Font: "Arial",
  InsertLineBreak: true,
  InsertSpace: true
};

export let DescriptionandProcedureStyle: StyleOptions = {
  isBold: true,
  IsItalic: false,
  IsUnderline: false,
  Size: 12,
  Uri: null,
  Font: "Arial",
  InsertLineBreak: false,
  InsertSpace: false,
};