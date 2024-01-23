import React from "react";
import Style from "./style";
import dayjs from "dayjs";

const Index = ({ metadata }: { metadata: any[] }) => {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* <link rel="icon" type="image/x-icon" href="/static/favicon.ico" /> */}
        <title>{process.env.BRAIN_NAME}</title>
        <Style />
      </head>
      <body>
        <h1>
          <a href="/" className="hidden-link">
            {process.env.BRAIN_NAME}
          </a>
        </h1>
        {/* <img src="/static/cj.svg" height="50px" /> */}
        <div className="memory-holder">
          {metadata.map((m, id) => (
            <div key={id} className="memory">
              <h3>
                <a href={`/${m.hash}`} style={{ color: "#EEE" }}>
                  {m.title}
                </a>
              </h3>
              <p style={{ color: "#777", fontSize: ".95rem" }}>
                {dayjs(m.created * 1000).format("MMM D, YYYY - h:mma")}
              </p>
              {m.location && (
                <p style={{ color: "#777", fontSize: ".95rem" }}>
                  {m.location}
                </p>
              )}
              {m.type === "image" && <img src={`/f/${m.hash}`} />}
              {/* <p style={{ fontSize: ".75rem", fontStyle: "italic" }}>
                {m.hash}
              </p> */}
              <p>{m.summary}</p>
              {/* <p>{m.audio?.transcript ?? "no transcript"}</p> */}
            </div>
          ))}
          {/* {memories.map((memory) => (
          ))} */}
        </div>
      </body>
    </html>
  );
};

export default Index;
