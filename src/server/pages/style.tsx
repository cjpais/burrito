import React from "react";

const Style = () => {
  return (
    <style>{`
        body {
          margin: 0;
          padding: 16px 0px 0px 0px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: Arial, sans-serif;
          background-color: #111; /* Dark gray background */
          color: #eee;
        }
        h1 {
          color: #eee; /* Near white text for the heading */
          margin-top: 16px;
          text-align: center; /* Center text */
        }
        h6 {
          margin: 16px;
          text-align: center;
        }
        div {
          width: 90%; /* Responsive width */
          max-width: 600px; /* Maximum width */
          margin: 10px auto; /* Centering and spacing between elements */
        }
        img,
        audio,
        video {
          width: 100%; /* Full width of the container */
        }

        .hidden-link {
          text-decoration: none;
          color: inherit;
        }
        
        a {
          user-select: text;
        }

        p {
            padding: 0px 0px 0px 0px;
            margin: 0px 0px 0px 0px;
        }

        .memory-holder {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
      
        .memory {
            display: flex;
            flex-direction: column; 
            gap: 8px;
        }
  
        .mono {
          font-family: monospace;
          font-size: 0.64rem;
          text-align: center;
          text-overflow: ellipsis;
        }
      `}</style>
  );
};

export default Style;
