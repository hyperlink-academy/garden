import { FilterAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { useCallback } from "react";
import { useMutations } from "./useReplicache";

export const useKeyboardHandling = (deps: {
  entityID: string;
  section: keyof FilterAttributes<{
    unique: any;
    type: "string";
    cardinality: "one";
  }>;
  suggestions: Fact<"card/title">[];
  close: () => void;
  cursorCoordinates?: { textIndex: number };
  suggestionPrefix?: string;
  suggestionIndex: number;
  setSuggestionIndex: (x: number | ((x: number) => number)) => void;
}) => {
  let { mutate, action } = useMutations();

  let {
    entityID,
    section,
    suggestions,
    setSuggestionIndex,
    cursorCoordinates,
    close,
    suggestionIndex,
    suggestionPrefix,
  } = deps;
  return useCallback(
    (
      e: React.KeyboardEvent<HTMLTextAreaElement>,
      ref?: React.MutableRefObject<HTMLTextAreaElement | null>
    ) => {
      let value = e.currentTarget.value,
        start = e.currentTarget.selectionStart,
        end = e.currentTarget.selectionEnd;
      let transact = async (
        transaction: Transaction,
        offset: [number, number] | number = [0, 0],
        undo: boolean = true
      ) => {
        let isUndoing = false;
        if (undo) {
          try {
            action.start();
            isUndoing = true;
          } catch (e) {}
        }
        let [newValue, cursors] = modifyString(
          value,
          [start, end],
          transaction
        );
        let offsets: [number, number];
        if (typeof offset === "number") offsets = [offset, offset];
        else offsets = offset;

        if (undo)
          action.add({
            undo: () => {
              setTimeout(() => {
                ref?.current?.setSelectionRange(start, end);
              }, 10);
            },
            redo: () => {
              setTimeout(() => {
                ref?.current?.setSelectionRange(
                  cursors[0] + offsets[0],
                  cursors[1] + offsets[1]
                );
              }, 10);
            },
          });
        await mutate("assertFact", {
          entity: entityID,
          attribute: section,
          value: newValue,
          positions: {},
        });
        setTimeout(() => {
          ref?.current?.setSelectionRange(
            cursors[0] + offsets[0],
            cursors[1] + offsets[1]
          );
        }, 10);
        if (undo && isUndoing) action.end();
      };

      switch (e.key) {
        case "Escape": {
          if (suggestions.length > 0) {
            e.preventDefault();
            close();
          }
          break;
        }
        case "Enter": {
          if (suggestions.length > 0 && !!cursorCoordinates) {
            e.preventDefault();
            let value = suggestions[suggestionIndex] || suggestions[0];
            if (!value) break;
            // TODO write the text!
            if (!suggestionPrefix) break;
            transact(
              (text) => {
                if (!cursorCoordinates || !suggestionPrefix) return;
                text.delete(
                  cursorCoordinates.textIndex,
                  suggestionPrefix.length
                );
                text.insert(cursorCoordinates.textIndex, value.value);
              },
              2 - suggestionPrefix.length,
              true
            );
            close();
            break;
          }
          let lineIndex = value.lastIndexOf("\n", start - 1);
          let currentLine = value.slice(0, start).split("\n").pop();
          if (!currentLine) break;
          if (
            currentLine.match(/^(\s*)-\s*$/) ||
            currentLine.match(/^(\s*)(\d+)\.\s*$/)
          ) {
            e.preventDefault();
            let delLength = currentLine.length;
            transact((text) => {
              text.delete(lineIndex + 1, delLength - 1);
            }, -1 * delLength);
            break;
          }
          let numberMatch = currentLine.match(/^(\s*)(\d+)\.\s*/);
          if (numberMatch) {
            let length = numberMatch[1].length;
            let number = parseInt(numberMatch[2]) + 1;
            e.preventDefault();
            transact((text) => {
              text.insert(start, `\n${" ".repeat(length)}${number}. `);
            }, length + number.toString().length + 3);
          }
          const match = currentLine.match(/^(\s*)-/);
          if (match) {
            let length = match[1].length;
            e.preventDefault();
            transact((text) => {
              text.insert(start, `\n${" ".repeat(length)}- `);
            }, length + 3);
          }
          break;
        }
        case "Tab": {
          if (suggestions.length > 0 && !!cursorCoordinates) {
            e.preventDefault();
            if (e.shiftKey) {
              if (suggestionIndex > 0) setSuggestionIndex((i) => i - 1);
            } else {
              if (suggestionIndex < suggestions.length - 1)
                setSuggestionIndex((i) => i + 1);
            }
            break;
          }

          let lineIndex = value.lastIndexOf("\n", start - 1);
          if (lineIndex === -1) break;
          let currentLine = value.slice(lineIndex + 1, start);
          if (!currentLine) break;
          const match = currentLine.match(/^(\s*)-/);
          if (match) {
            e.preventDefault();
            if (e.shiftKey) {
              if (currentLine[0] === "-") break;
              transact((text) => text.delete(lineIndex + 1, 2), -2);
            } else {
              let previousLine = value
                .slice(0, lineIndex)
                .split("\n")
                .pop()
                ?.match(/^(\s*)/);
              if (!previousLine || previousLine[0].length < match[1].length)
                return;
              transact((text) => text.insert(lineIndex + 1, "  "));
            }
          }

          break;
        }
        case "ArrowUp": {
          if (suggestions.length > 0 && !!cursorCoordinates) {
            e.preventDefault();
            if (suggestionIndex > 0) setSuggestionIndex((i) => i - 1);
            break;
          }
          break;
        }
        case "ArrowDown": {
          if (suggestions.length > 0 && !!cursorCoordinates) {
            e.preventDefault();
            if (suggestionIndex < suggestions.length - 1)
              setSuggestionIndex((i) => i + 1);
            break;
          }
          break;
        }

        case "k": {
          if (!e.ctrlKey) break;
          if (suggestions.length > 0 && !!cursorCoordinates) {
            e.preventDefault();
            if (suggestionIndex > 0) setSuggestionIndex((i) => i - 1);
            break;
          }
          break;
        }
        case "j": {
          if (!e.ctrlKey) break;
          if (suggestions.length > 0 && !!cursorCoordinates) {
            e.preventDefault();
            if (suggestionIndex < suggestions.length - 1)
              setSuggestionIndex((i) => i + 1);
            break;
          }
          break;
        }
        case "Backspace": {
          if (
            value[start - 1] === "[" &&
            value[start] === "]" &&
            start === end
          ) {
            e.preventDefault();
            transact((text) => {
              text.delete(start - 1, 2);
            }, -1);
            break;
          }

          if (
            value[start - 2] === "[" &&
            value[start - 1] === "]" &&
            start === end
          ) {
            e.preventDefault();
            transact((text) => {
              text.delete(start - 2, 2);
            }, -2);
            break;
          }

          break;
        }
        case "i": {
          if (!(e.ctrlKey || e.metaKey)) break;
          if (start !== end) {
            transact((text) => {
              text.insert(start, "*");
              text.insert(end + 1, "*");
            });
          }
          break;
        }
        case "b": {
          if (!(e.ctrlKey || e.metaKey)) break;
          if (start !== end) {
            transact(
              (text) => {
                text.insert(start, "**");
                text.insert(end + 2, "**");
              },
              [0, 2]
            );
          }
          break;
        }
        case "[": {
          if (e.ctrlKey || e.altKey || e.metaKey) break;
          e.preventDefault();
          if (start !== end) {
            transact((text) => {
              text.insert(start, "[");
              text.insert(end + 1, "]");
            });
          } else {
            transact((text) => {
              text.insert(start, "[]");
            }, 1);
          }
          break;
        }
        case "]": {
          if (e.ctrlKey || e.altKey || e.metaKey) break;
          let start = e.currentTarget.selectionStart,
            end = e.currentTarget.selectionEnd;
          if (start === end) {
            if (e.currentTarget.value[start] === "]") {
              e.preventDefault();
              ref?.current?.setSelectionRange(start + 1, start + 1);
            }
          }
          break;
        }
      }
    },
    [
      suggestions,
      setSuggestionIndex,
      cursorCoordinates,
      close,
      suggestionIndex,
      suggestionPrefix,
    ]
  );
};

export type Transaction = (tx: {
  insert: (i: number, s: string) => void;
  delete: (i: number, l: number) => void;
}) => void;
export function modifyString(
  input: string,
  initialCursor: number[],
  transact: Transaction
): [string, number[]] {
  let output = input;
  let cursors = initialCursor;
  transact({
    insert: (i: number, s: string) => {
      output = output.slice(0, i) + s + output.slice(i);
      cursors = cursors.map((c) => {
        if (i < c) return c + s.length;
        return c;
      });
    },
    delete: (i: number, l: number) => {
      output = output.slice(0, i) + output.slice(i + l);
      cursors = cursors.map((c) => {
        if (i > c) return c - l;
        return c;
      });
    },
  });
  return [output, cursors];
}
