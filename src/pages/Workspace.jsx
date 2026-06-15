import React, { useEffect, useRef, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import "./Workspace.css";

const Workspace = () => {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [micStatus, setMicStatus] = useState("checking");
  const [isFullScreen, setIsFullScreen] = useState(false);

  const recognitionRef = useRef(null);
  const editorRef = useRef(null);

  const processedTranscriptsRef = useRef(new Set());

  const historyRef = useRef([]);
  const redoRef = useRef([]);

  // live preview
  const liveRangeRef = useRef(null);

  // -----------------------------
  // LOAD SAVED DATA
  // -----------------------------
  useEffect(() => {
    const saved = localStorage.getItem("voiceText");

    if (saved) {
      setText(saved);
    }

    setMicStatus("available");
  }, []);

  // -----------------------------
  // AUTO SAVE
  // -----------------------------
  useEffect(() => {
    localStorage.setItem("voiceText", text);
  }, [text]);

  // -----------------------------
  // DYNAMIC PLACEHOLDER
  // -----------------------------
  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) return;

    const editableElement =
      editor.ui.view.editable.element;

    if (!editableElement) return;

    editableElement.setAttribute(
      "data-placeholder",
      listening
        ? "🎙️ Start speaking..."
        : "Click start and start speaking..."
    );
  }, [listening]);

  // -----------------------------
  // REQUEST MIC
  // -----------------------------
  const requestMicrophoneAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      setMicStatus("available");
    } catch {
      setMicStatus("blocked");

      alert(
        "Please allow microphone access"
      );
    }
  };

  // -----------------------------
  // COMMANDS
  // -----------------------------
  const processCommands = (input) => {
    return input
      .replace(/new\s+line/gi, "\n")

      .replace(
        /new\s+paragraph/gi,
        "\n\n"
      )

      .replace(/\bcomma\b/gi, ",")

      .replace(
        /\b(full\s+stop|period|dot)\b/gi,
        "."
      )

      .replace(
        /\bquestion\s+mark\b/gi,
        "?"
      )

      .replace(
        /\bexclamation\s+mark\b/gi,
        "!"
      )

      .replace(/\bcolon\b/gi, ":")

      .replace(/\bsemicolon\b/gi, ";")

      .replace(
        /\bopen\s+bracket\b/gi,
        "("
      )

      .replace(
        /\bclose\s+bracket\b/gi,
        ")"
      )

      .replace(/\s+([.,!?;:])/g, "$1")

      .replace(
        /([.,!?;:])([^\s])/g,
        "$1 $2"
      );
  };

  // -----------------------------
  // NUMBER CONVERSION
  // -----------------------------
  const wordsToNumbers = (str) => {
    const map = {
      zero: 0,
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };

    return str
      .split(" ")
      .map((w) =>
        map[w.toLowerCase()] !== undefined
          ? map[w.toLowerCase()]
          : w
      )
      .join(" ");
  };

  // -----------------------------
  // CAPITALIZE
  // -----------------------------
  const autoCapitalize = (text) => {
    return text.replace(
      /(^\s*\w|[.!?]\s*\w)/g,
      (c) => c.toUpperCase()
    );
  };

  // -----------------------------
  // REMOVE LIVE PREVIEW
  // -----------------------------
  const removeLivePreview = (
    writer
  ) => {
    if (!liveRangeRef.current)
      return;

    try {
      writer.remove(
        liveRangeRef.current
      );

      liveRangeRef.current = null;
    } catch (e) {
      console.log(e);
    }
  };

  // -----------------------------
  // START LISTENING
  // -----------------------------
// -----------------------------
// START LISTENING
// -----------------------------
const startListening = async () => {
  if (listening) return;

  if (micStatus === "blocked") {
    await requestMicrophoneAccess();
    return;
  }

  const editor = editorRef.current;

  if (!editor) return;

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert(
      "Use Google Chrome Browser"
    );
    return;
  }

  setListening(true);

  const recognition =
    new SpeechRecognition();

  recognitionRef.current =
    recognition;

  // ✅ BEST SETTINGS
  recognition.lang = "en-IN";

  recognition.continuous = true;

  recognition.interimResults = true;

  recognition.maxAlternatives = 1;

  let lastInterimText = "";

  recognition.onstart = () => {
    setMicStatus("listening");
  };

  recognition.onresult = (
    event
  ) => {
    const editor =
      editorRef.current;

    if (!editor) return;

    let finalTranscript = "";

    let interimTranscript = "";

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {
      const transcript =
        event.results[i][0].transcript;

      if (
        event.results[i].isFinal
      ) {
        finalTranscript +=
          transcript + " ";
      } else {
        interimTranscript +=
          transcript;
      }
    }

    // process final text
    finalTranscript =
      processCommands(
        finalTranscript
      );

    finalTranscript =
      wordsToNumbers(
        finalTranscript
      );

    finalTranscript =
      autoCapitalize(
        finalTranscript
      );

    editor.model.change(
      (writer) => {
        const selection =
          editor.model.document.selection;

        const position =
          selection.getFirstPosition();

        // ✅ REMOVE OLD INTERIM
        if (lastInterimText) {
          try {
            const start =
              writer.createPositionAt(
                position.parent,
                Math.max(
                  0,
                  position.offset -
                  lastInterimText.length
                )
              );

            const end =
              writer.createPositionAt(
                position.parent,
                position.offset
              );

            writer.remove(
              writer.createRange(
                start,
                end
              )
            );
          } catch (e) {}
        }

        // ✅ INSERT NEW INTERIM
        if (
          interimTranscript
        ) {
          editor.model.insertContent(
            writer.createText(
              interimTranscript
            ),
            selection
          );

          lastInterimText =
            interimTranscript;
        } else {
          lastInterimText = "";
        }

        // ✅ INSERT FINAL
        if (
          finalTranscript
        ) {
          if (
            lastInterimText
          ) {
            try {
              const currentPos =
                editor.model.document.selection.getFirstPosition();

              const start =
                writer.createPositionAt(
                  currentPos.parent,
                  Math.max(
                    0,
                    currentPos.offset -
                    lastInterimText.length
                  )
                );

              const end =
                writer.createPositionAt(
                  currentPos.parent,
                  currentPos.offset
                );

              writer.remove(
                writer.createRange(
                  start,
                  end
                )
              );
            } catch (e) {}
          }

          editor.model.insertContent(
            writer.createText(
              finalTranscript
            ),
            editor.model.document.selection
          );

          lastInterimText = "";
        }
      }
    );

    setText(editor.getData());
  };

  recognition.onerror = (
    event
  ) => {
    console.log(
      "Speech error:",
      event.error
    );

    // ignore temporary errors
    if (
      event.error ===
      "no-speech"
    )
      return;

    if (
      event.error ===
      "aborted"
    )
      return;

    setMicStatus("error");
  };

  recognition.onend = () => {
    // ✅ AUTO RESTART
    if (listening) {
      setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          console.log(e);
        }
      }, 300);
    } else {
      setMicStatus("available");
    }
  };

  recognition.start();
};

  // -----------------------------
  // STOP
  // -----------------------------
const stopListening = () => {
  setListening(false);

  setMicStatus("available");

  recognitionRef.current?.stop();
};

  // -----------------------------
  // CLEAR
  // -----------------------------
  const clearEditor = () => {
    const editor =
      editorRef.current;

    if (!editor) return;

    historyRef.current.push(
      editor.getData()
    );

    redoRef.current = [];

    editor.setData("");

    setText("");
  };

  // -----------------------------
  // COPY
  // -----------------------------
  const copyText = async () => {
    const editor =
      editorRef.current;

    if (!editor) return;

    const temp =
      document.createElement(
        "div"
      );

    temp.innerHTML =
      editor.getData();

    await navigator.clipboard.writeText(
      temp.innerText
    );

    alert("Copied!");
  };

  // -----------------------------
  // UNDO
  // -----------------------------
  const undo = () => {
    const editor =
      editorRef.current;

    if (
      !editor ||
      historyRef.current.length === 0
    )
      return;

    const last =
      historyRef.current.pop();

    redoRef.current.push(
      editor.getData()
    );

    editor.setData(last);

    setText(last);
  };

  // -----------------------------
  // REDO
  // -----------------------------
  const redo = () => {
    const editor =
      editorRef.current;

    if (
      !editor ||
      redoRef.current.length === 0
    )
      return;

    const next =
      redoRef.current.pop();

    historyRef.current.push(
      editor.getData()
    );

    editor.setData(next);

    setText(next);
  };

  const toggleFullScreen = () => {
    setIsFullScreen((current) => !current);
  };

  return (
    <div className={`workspace-screen ${isFullScreen ? "is-fullscreen" : ""}`}>
      <h1>
        Voice to Text Editor
      </h1>

      <div className="toolbar-buttons">
        <button
          className="start"
          onClick={startListening}
          disabled={listening}
        >
          🎤 Start
        </button>

        <button
          className="stop"
          onClick={stopListening}
          disabled={!listening}
        >
          ⏹ Stop
        </button>

        <button
          className="clear"
          onClick={clearEditor}
        >
          🧹 Clear
        </button>

        <button
          className="copy"
          onClick={copyText}
          disabled={
            !text ||
            text === "<p>&nbsp;</p>"
          }
        >
          📋 Copy
        </button>

        <button
          className="check"
          onClick={undo}
        >
          ↩️ Undo
        </button>

        <button
          className="check"
          onClick={redo}
        >
          ↪️ Redo
        </button>

        <button
          className="fullscreen"
          onClick={toggleFullScreen}
          type="button"
        >
          {isFullScreen ? "✕ Exit Full Screen" : "⛶ View Full Screen"}
        </button>
      </div>

      <div className="card">
        <div className="editor-wrapper">
          <CKEditor
            editor={ClassicEditor}
            data={text}
            config={{
              placeholder:
                "Click start and start speaking...",
            }}
            onReady={(editor) => {
              editorRef.current =
                editor;
            }}
            onChange={(
              event,
              editor
            ) => {
              const data =
                editor.getData();

              setText(data);
            }}
          />
        </div>
      </div>

      <div className="status">
        <p>
          <strong>Status:</strong>{" "}
          {listening
            ? "🎙️ Listening..."
            : "✅ Idle"}
        </p>
      </div>
    </div>
  );
};

export default Workspace;
