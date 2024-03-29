import React from "react";
import { z } from "zod";
import Style from "./style";
import dayjs from "dayjs";
import { flatten } from "flat";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const processMarkdown = (markdownText: string) => {
  // Regular expression to match code blocks and preformatted text
  const codeBlockRegex = /(```[\s\S]*?```|`[^`]*`)/g;

  // Function to replace single newlines with double newlines outside of code blocks
  return markdownText
    .split(codeBlockRegex)
    .map((segment, index) => {
      // Odd indices are code blocks, even indices are normal text
      if (index % 2 === 0) {
        // Replace single newlines with double newlines in normal text
        return segment.replace(/\n(?! *\n)/g, "\n\n");
      } else {
        // Keep code blocks unchanged
        return segment;
      }
    })
    .join("");
};

const Entry = ({
  metadata,
  similar,
  peersSimilar,
}: {
  metadata: any;
  similar: any;
  peersSimilar: any;
}) => {
  const flatMetadata = Object.entries(flatten(metadata)).filter(
    ([key, value]) => !key.includes("embedding")
  );

  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* <link rel="icon" type="image/x-icon" href="/static/favicon.ico" /> */}
        <title>{metadata.title}</title>
        <Style />
      </head>
      <body>
        <h1>
          <a href="/" className="hidden-link">
            {process.env.BRAIN_NAME}
          </a>
        </h1>
        <div className="content-container">
          <div className="entry-container">
            <h2>{metadata.title}</h2>
            <b style={{ color: "#777", fontStyle: "bold" }}>
              {dayjs(metadata.created * 1000).format("MMM D, YYYY - h:mma")}
            </b>
            {metadata.location && (
              <b style={{ color: "#777", fontStyle: "bold" }}>
                {metadata.location}
              </b>
            )}
            {metadata.summary && (
              <i style={{ fontStyle: "italic" }}>Summary: {metadata.summary}</i>
            )}
            {metadata.userData && <p>Comment: {metadata.userData}</p>}
            {metadata.caption && <p>Caption: {metadata.caption}</p>}
            {metadata.description && <i>Description: {metadata.description}</i>}
            {metadata.type === "image" && (
              <img
                loading="lazy"
                alt={metadata.description}
                src={`/i/${metadata.hash}`}
              />
            )}
            {metadata.type === "audio" && (
              <audio controls src={`/f/${metadata.hash}`} />
            )}
            {metadata.type === "video" && (
              <video controls src={`/v/${metadata.hash}#t=0.1`} />
            )}
            {/* <p style={{ fontSize: ".9rem", wordSpacing: "2px" }}> */}
            {metadata.audio && <p>Transcript: {metadata.audio.transcript}</p>}
            {metadata.text && (
              <>
                <p>Text</p>
                <div>
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {processMarkdown(metadata.text)}
                  </Markdown>
                </div>
              </>
            )}
            {metadata.extractedText && (
              <>
                <p>Extracted Text</p>
                <div>
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {processMarkdown(metadata.extractedText)}
                  </Markdown>
                </div>
              </>
            )}
          </div>
          <div className="similar">
            <h2>Similar Entrees</h2>
            {similar &&
              similar.map((s) => (
                <div key={s.hash}>
                  <div style={{ paddingBottom: ".25rem" }}>
                    <h3>
                      <a style={{ color: "#EEE" }} href={`/${s.hash}`}>
                        {s.title}
                      </a>
                    </h3>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: ".777rem",
                        color: "#777",
                      }}
                    >
                      {`${((1 - s.distance) * 100).toFixed(2)}% similar`}
                    </p>
                  </div>
                  {s.summary && <p className="truncate">{s.summary}</p>}
                  {s.type === "image" && (
                    <img
                      loading="lazy"
                      alt={s.description}
                      src={`/i/${s.hash}`}
                    />
                  )}
                </div>
              ))}
          </div>

          <div className="similar">
            {peersSimilar && peersSimilar.length > 0 && (
              <h2>Friends Similar Entrees</h2>
            )}
            {peersSimilar &&
              peersSimilar.map((s) => (
                <div key={s.hash}>
                  <h3>
                    <a
                      style={{ color: "#EEE" }}
                      href={`${s.peer.url}/${s.hash}`}
                    >
                      {s.title}
                    </a>
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      gap: ".5rem",
                      paddingBottom: ".25rem",
                    }}
                  >
                    <a
                      href={`${s.peer.url}/${s.hash}`}
                      style={{
                        color: "#777",
                        fontFamily: "monospace",
                        fontSize: ".777rem",
                      }}
                    >
                      {s.peer.display}
                    </a>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: ".777rem",
                        color: "#777",
                      }}
                    >
                      {`${((1 - s.distance) * 100).toFixed(2)}% similar`}
                    </p>
                  </div>
                  <p className="truncate">{s.summary}</p>
                  {s.type === "image" && (
                    <img
                      loading="lazy"
                      alt={s.description}
                      src={`${s.peer.url}/i/${s.hash}`}
                    />
                  )}
                </div>
              ))}

            {/* <div>
              <textarea style={{ width: "100%", height: "100px" }} />
              <button>Query</button>
            </div>

            {flatMetadata.map(([key, value]) => (
              <div
                key={key}
                style={{ fontFamily: "monospace", fontSize: ".6rem" }}
              >
                <p>
                  {key}: {value}
                </p>
              </div>
            ))} */}
          </div>
        </div>
      </body>
    </html>
  );
};

export default Entry;
