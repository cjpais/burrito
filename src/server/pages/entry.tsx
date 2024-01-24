import React from "react";
import { z } from "zod";
import Style from "./style";
import dayjs from "dayjs";
import { flatten } from "flat";

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
            {metadata.caption && <p>Caption: {metadata.caption}</p>}
            {metadata.type === "image" && <img src={`/f/${metadata.hash}`} />}
            {metadata.audio && <audio controls src={`/f/${metadata.hash}`} />}
            {/* <p style={{ fontSize: ".9rem", wordSpacing: "2px" }}> */}
            {metadata.audio && <p>Transcript: {metadata.audio.transcript}</p>}
          </div>
          <div className="similar">
            <h2>Similar Entries</h2>
            {similar &&
              similar.map((s) => (
                <div key={s.hash}>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: ".777rem",
                      color: "#777",
                    }}
                  >
                    <a href={`/${s.hash}`} style={{ color: "#777" }}>
                      0x{s.hash.slice(0, 6)}
                    </a>
                    .....Similarity: {1 - s.distance}
                    <h3>
                      <a style={{ color: "#EEE" }} href={`/${s.hash}`}>
                        {s.title}
                      </a>
                    </h3>
                  </p>
                  <p className="truncate">{s.summary}</p>
                </div>
              ))}

            {peersSimilar && peersSimilar.length > 0 && (
              <h2>Peers Similar Entries</h2>
            )}
            {peersSimilar &&
              peersSimilar.map((s) => (
                <div key={s.hash}>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: ".777rem",
                      color: "#777",
                    }}
                  >
                    <a
                      href={`https://${s.peer}/${s.hash}`}
                      style={{ color: "#777" }}
                    >
                      {s.peer} 0x{s.hash.slice(0, 6)}
                    </a>
                    .....Similarity: {1 - s.distance}
                    <h3>
                      <a
                        style={{ color: "#EEE" }}
                        href={`https://${s.peer}/${s.hash}`}
                      >
                        {s.title}
                      </a>
                    </h3>
                  </p>
                  <p className="truncate">{s.summary}</p>
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
