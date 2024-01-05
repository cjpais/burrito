import React from "react";
import { z } from "zod";
import Style from "./style";
import dayjs from "dayjs";

const Entry = ({ metadata }: { metadata: any }) => {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* <link rel="icon" type="image/x-icon" href="/static/favicon.ico" /> */}
        <title>CJ's Brain</title>
        <Style />
      </head>
      <body>
        <h1>
          <a href="/" className="hidden-link">
            CJ's Brain
          </a>
        </h1>
        <div className="memory-holder">
          <audio controls src={`/f/${metadata.hash}`} />
          <b style={{ color: "#777", fontStyle: "bold" }}>
            {dayjs(metadata.created * 1000).format("MMM D, YYYY - h:mma")}
          </b>
          <i style={{ fontStyle: "italic" }}>{metadata.summary}</i>
          <p style={{ fontSize: ".9rem", wordSpacing: "2px" }}>
            {metadata.audio.transcript}
          </p>
        </div>
      </body>
    </html>
  );
};

export default Entry;
