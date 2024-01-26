import dayjs from "dayjs";
import React from "react";

const Memory = ({ m }: { m: any }) => {
  return (
    <div className="memory">
      <h3>
        <a href={`/${m.hash}`} style={{ color: "#EEE" }}>
          {m.title}
        </a>
      </h3>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {m.location && (
          <p style={{ color: "#777", fontSize: ".95rem" }}>{m.location}</p>
        )}

        <p style={{ color: "#777", fontSize: ".95rem" }}>
          {dayjs(m.created * 1000).format("MMM D, YYYY - h:mma")}
        </p>
      </div>
      {m.type === "image" && (
        <img loading="lazy" src={`/i/${m.hash}`} alt={m.description} />
      )}
      {m.type === "video" && <video controls src={`/v/${m.hash}#t=0.1`} />}
      {m.type === "audio" && <p>{m.summary}</p>}
    </div>
  );
};

export default Memory;
