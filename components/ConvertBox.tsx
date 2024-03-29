import { useCallback, useEffect, useRef, useState } from "react";
import * as gtag from "../lib/gtag";
import classNames from "classnames";

const getProjectURL = (id: number) => `https://scratch.mit.edu/projects/${id}/`;

const getProjectId = (url: string) => {
  const results = url.match(/\d{2,}/);
  if (results === null) return null;
  return parseInt(results[0], 10);
};

export default function ConvertBox() {
  const [projectURL, setProjectURL] = useState("");

  const projectId = getProjectId(projectURL);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ status: number; info: string }>(null);

  const onSubmit = async (event) => {
    event.preventDefault();

    gtag.event({
      category: "Translate Project",
      action: "Edit in CodeSandbox",
      label: projectId,
    });

    setLoading(true);

    const url = `/api/${projectId}/codesandbox`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      window.location.href = data.url;
    } else {
      console.log(data);
      setError({ status: response.status, info: data.error });
      setLoading(false);
    }
  };

  const onSubmitUpload = async (event) => {
    event.preventDefault();

    gtag.event({
      category: "Translate Project",
      action: "Edit in CodeSandbox",
      label: "File",
    });

    setLoading(true);

    const url = `/api/upload/codesandbox`;
    const response = await fetch(url, {
      method: "POST",
      body: event.target.querySelector("input[type=file]").files[0],
    });
    const data = await response.json();

    if (response.ok) {
      window.location.href = data.url;
    } else {
      console.log(data);
      setError({ status: response.status, info: data.error });
      setLoading(false);
    }
  };

  const uploadFormRef = useRef<HTMLFormElement>(null);

  const [draggingFile, setDraggingFile] = useState(false);
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    setDraggingFile(true);
  }, []);
  const onDragLeave = useCallback((event) => {
    event.preventDefault();
    setDraggingFile(false);
  }, []);
  const onDrop = useCallback((event) => {
    event.preventDefault();
    setDraggingFile(false);
    const fileInput: HTMLInputElement =
      uploadFormRef.current?.querySelector("input[type=file]");
    if (fileInput) {
      fileInput.files = event.dataTransfer.files;
      uploadFormRef.current.requestSubmit();
    }
  }, []);
  useEffect(() => {
    document.body.addEventListener("dragover", onDragOver);
    document.body.addEventListener("dragleave", onDragLeave);
    document.body.addEventListener("drop", onDrop);
    return () => {
      document.body.removeEventListener("dragover", onDragOver);
      document.body.removeEventListener("dragleave", onDragLeave);
      document.body.removeEventListener("drop", onDrop);
    };
  }, [onDragOver, onDragLeave, onDrop]);

  return (
    <div className="space-y-4">
      <div className="space-y-2 relative">
        {/* Project URL form */}
        <form
          className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0"
          onSubmit={onSubmit}
        >
          <div className="relative w-full flex-1">
            <input
              type="text"
              className={classNames(
                "w-full px-5 py-3 text-lg rounded border-2 outline-none",
                {
                  "text-indigo-800 bg-indigo-100 border-indigo-600 placeholder-indigo-200":
                    !error,
                  "text-red-800 bg-red-100 border-red-700 focus:border-red-900":
                    error,
                }
              )}
              placeholder="https://scratch.mit.edu/projects/345789566/"
              value={projectURL}
              onChange={(e) => {
                setProjectURL(e.target.value);
                setError(null);
              }}
              onBlur={() => {
                // Normalize url format
                let id = getProjectId(projectURL);
                if (id) {
                  setProjectURL(getProjectURL(id));
                }
              }}
            />
          </div>

          <ProgressButton
            disabled={!projectId}
            loading={loading}
            error={!!error}
          >
            Edit as JavaScript
          </ProgressButton>
        </form>

        {/* File upload form */}
        <form
          ref={uploadFormRef}
          className="flex justify-center"
          onSubmit={onSubmitUpload}
        >
          <label>
            <span className="text-gray-700">
              Or{" "}
              <span className="text-indigo-800 font-medium underline decoration-dashed decoration-indigo-700/30 cursor-pointer">
                upload
              </span>{" "}
              an .sb3 file
            </span>
            <input
              type="file"
              name="file"
              className="hidden"
              accept=".sb3"
              onChange={(event) => {
                uploadFormRef.current?.requestSubmit();
              }}
            />
          </label>

          <div
            className={classNames("fixed inset-0 bg-indigo-400/20", {
              hidden: !draggingFile,
            })}
          />
          <div
            className={classNames(
              "absolute -inset-5 -top-14 bg-indigo-400 border-4 border-indigo-500 border-dashed rounded-xl shadow-2xl shadow-indigo-600/60 flex items-center justify-center",
              { hidden: !draggingFile }
            )}
          >
            <span className="text-xl font-semibold text-white drop-shadow-xl select-none">
              Drop to upload sb3...
            </span>
          </div>
        </form>
      </div>

      {/* Error box */}
      {error && (
        <div className="bg-red-200 rounded px-4 py-3 space-y-2">
          {error.status === 404 ? (
            <>
              <p>
                <strong>Project not found. (Did you share it?)</strong>
              </p>
              <p>
                Your project must be shared in order to be converted. A shared
                project was not found with the id {projectId}.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>There was an error converting your project.</strong>
              </p>
              <p>
                <code className="text-red-800 text-sm bg-red-300 px-2 py-1 rounded">
                  {error.info}
                </code>
              </p>
              <p>
                Leopard only supports new projects (created in Scratch 3.0). And
                the only supported extension is "pen"; all others will fail.
              </p>
            </>
          )}
          <p>
            If you aren't sure why your project is failing,{" "}
            <a
              href="https://scratch.mit.edu/discuss/topic/420162/"
              className="underline"
            >
              ask on the forums
            </a>
            !
          </p>
        </div>
      )}
    </div>
  );
}

function ProgressButton({
  children,
  loading = false,
  error = false,
  ...props
}) {
  return (
    <button
      className={classNames(
        "relative flex items-center justify-center px-5 py-3 text-white text-lg rounded whitespace-nowrap disabled:cursor-not-allowed",
        {
          "bg-indigo-700": !error,
          "bg-red-700": error,
        }
      )}
      {...props}
    >
      <span className={classNames({ invisible: loading })}>{children}</span>
      {loading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className={classNames(
              "origin-center w-8 h-8 border-4 rounded-full animate-spin",
              {
                "border-indigo-200": !error,
                "border-red-300": error,
              }
            )}
            style={{ borderBottomColor: "transparent" }}
          />
        </div>
      )}
    </button>
  );
}
