import React, { createContext, useContext, useState, useCallback } from "react";
import "../styles/Feedback.css";

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [snackbars, setSnackbars] = useState([]);
  const [modal, setModal] = useState(null);
  const [promptValue, setPromptValue] = useState("");

  const removeSnackbar = useCallback((id) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const showSnackbar = useCallback(
    (message, type = "success") => {
      const id = `${Date.now()}_${Math.random()}`;
      setSnackbars((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeSnackbar(id), 3800);
    },
    [removeSnackbar],
  );

  // Informational / Success Modal
  const showModal = useCallback(
    ({ title, message, confirmText = "Continue", variant = "default" }) => {
      return new Promise((resolve) => {
        setModal({
          mode: "ALERT",
          title,
          message,
          confirmText,
          variant,
          onConfirm: () => {
            setModal(null);
            resolve(true);
          },
        });
      });
    },
    [],
  );

  // Confirmation Dialog (Replaces window.confirm)
  const confirmModal = useCallback(
    ({
      title,
      message,
      confirmText = "Confirm",
      cancelText = "Cancel",
      variant = "danger",
    }) => {
      return new Promise((resolve) => {
        setModal({
          mode: "CONFIRM",
          title,
          message,
          confirmText,
          cancelText,
          variant,
          onConfirm: () => {
            setModal(null);
            resolve(true);
          },
          onCancel: () => {
            setModal(null);
            resolve(false);
          },
        });
      });
    },
    [],
  );

  // Input Prompt Modal (Replaces window.prompt)
  const promptModal = useCallback(
    ({
      title,
      message,
      placeholder = "",
      confirmText = "Submit",
      cancelText = "Cancel",
      variant = "danger",
    }) => {
      setPromptValue("");
      return new Promise((resolve) => {
        setModal({
          mode: "PROMPT",
          title,
          message,
          placeholder,
          confirmText,
          cancelText,
          variant,
          onConfirm: (val) => {
            setModal(null);
            resolve(val);
          },
          onCancel: () => {
            setModal(null);
            resolve(null);
          },
        });
      });
    },
    [],
  );

  return (
    <FeedbackContext.Provider
      value={{ showSnackbar, showModal, confirmModal, promptModal }}
    >
      {children}

      {/* Centered Modal Overlay */}
      {modal && (
        <div
          className="saga-modal-backdrop"
          onClick={() => modal.onCancel && modal.onCancel()}
        >
          <div
            className={`saga-modal-card ${modal.variant === "danger" ? "danger-top" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="saga-modal-title">{modal.title}</h3>
            <p className="saga-modal-message">{modal.message}</p>

            {modal.mode === "PROMPT" && (
              <input
                type="text"
                className="saga-modal-input"
                placeholder={modal.placeholder}
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                autoFocus
              />
            )}

            <div className="saga-modal-actions">
              {modal.mode !== "ALERT" && (
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={modal.onCancel}
                >
                  {modal.cancelText}
                </button>
              )}
              <button
                type="button"
                className={
                  modal.variant === "danger" ? "btn-danger" : "btn-primary"
                }
                style={{ padding: "10px 20px" }}
                onClick={() => {
                  if (modal.mode === "PROMPT") {
                    if (!promptValue.trim()) return;
                    modal.onConfirm(promptValue.trim());
                  } else {
                    modal.onConfirm();
                  }
                }}
              >
                {modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-Right Snackbar Stack */}
      <div className="saga-snackbar-stack">
        {snackbars.map((sb) => (
          <div key={sb.id} className={`saga-snackbar ${sb.type}`}>
            <span>{sb.message}</span>
            <button
              type="button"
              className="snackbar-close"
              onClick={() => removeSnackbar(sb.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export const useFeedback = () => useContext(FeedbackContext);
